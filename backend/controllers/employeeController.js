import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import ShiftNotice from '../models/ShiftNotice.js';
import Attendance from '../models/Attendance.js';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { findEmployee, getEmployeeLegacyId } from '../utils/entityLookup.js';
import { toEmployeeJSON, toAttendanceJSON, toLeaveJSON, toLeaveBalanceJSON, toCompanyJSON } from '../utils/formatters.js';
import { getSettings } from '../services/settingsService.js';
import { syncCompanyEmployeeCounts } from '../services/companyService.js';
import { getSecsFromTime, getTimeStringFromSecs, autoEndOverdueTeaBreaks, finalizeClockOut } from '../utils/attendanceMath.js';
import { syncLeaveBalance, autoRejectPassedLeaves } from '../services/leaveService.js';

export const getProfile = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const empId = getEmployeeLegacyId(emp);
    const balance = await syncLeaveBalance(empId, emp.joinDate);
    const settings = await getSettings();

    // Auto end any overdue tea break
    const activeBreakRecord = await Attendance.findOne({ employeeId: empId, onTeaBreak: true });
    if (activeBreakRecord) {
      await autoEndOverdueTeaBreaks(activeBreakRecord, settings);
    }

    const empJson = toEmployeeJSON(emp);
    if (empJson) {
      let companyTeaBreakAllowed = true;
      let companyDetails = null;
      if (emp.companyId) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(emp.companyId);
        const compQuery = isValidObjectId
          ? { $or: [{ legacyId: emp.companyId }, { _id: emp.companyId }] }
          : { legacyId: emp.companyId };
        const comp = await Company.findOne(compQuery);
        if (comp) {
          companyTeaBreakAllowed = comp.teaBreakAllowed !== false;
          companyDetails = toCompanyJSON(comp);
        }
      }
      if (emp.teamId) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(emp.teamId);
        const teamQuery = isValidObjectId
          ? { $or: [{ legacyId: emp.teamId }, { _id: emp.teamId }] }
          : { legacyId: emp.teamId };
        const teamComp = await Company.findOne(teamQuery);
        if (teamComp) {
          empJson.teamLead = teamComp.contact;
        }
      }
      
      const teamsLed = await Company.find({ isTeam: true, contact: emp.name });
      if (teamsLed && teamsLed.length > 0) {
        empJson.leadsTeams = teamsLed.map(t => t.name).join(', ');
      }

      empJson.companyTeaBreakAllowed = companyTeaBreakAllowed;
      empJson.companyDetails = companyDetails;
    }

    res.json({
      employee: empJson,
      leaveBalance: toLeaveBalanceJSON(balance),
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const settings = await getSettings();
    const records = await Attendance.find({ employeeId: getEmployeeLegacyId(emp) }).sort({ date: -1 }).lean();
    await autoEndOverdueTeaBreaks(records, settings);
    res.json(records.map(toAttendanceJSON));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logAttendance = async (req, res) => {
  try {
    const { action, time, date } = req.body;
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const empId = getEmployeeLegacyId(emp);
    const settings = await getSettings();

    let todayRecord;
    if (action === 'clock-in') {
      todayRecord = await Attendance.findOne({ employeeId: empId, date });
    } else {
      todayRecord = await Attendance.findOne({ employeeId: empId, checkOut: null });
      if (!todayRecord) {
        todayRecord = await Attendance.findOne({ employeeId: empId, date });
      }
    }

    if (todayRecord) {
      await autoEndOverdueTeaBreaks(todayRecord, settings);
    }

    if (action === 'clock-in') {
      if (todayRecord) return res.status(400).json({ error: 'Already clocked in today' });

      // Validate clock-in time against assigned shift
      const empShift = emp.shift || 'morning';
      const allowedStartTimeStr = empShift === 'night' 
        ? (settings.nightShiftStartTime || '21:00') 
        : (settings.morningShiftStartTime || '09:00');

      const allowedSecs = getSecsFromTime(allowedStartTimeStr);
      const attemptSecs = getSecsFromTime(time);

      let isTooEarly = false;
      if (empShift === 'night') {
        // For night shift, block check-ins before start time, but only if it's afternoon/evening of the same day.
        // This allows very late check-ins past midnight (e.g., 01:00 AM) while blocking early check-ins (e.g., 20:00).
        if (attemptSecs < allowedSecs && attemptSecs > 103200) {
          isTooEarly = true;
        }
      } else {
        // For morning shift, strictly block anything before the start time.
        if (attemptSecs < allowedSecs) {
          isTooEarly = true;
        }
      }

      if (isTooEarly) {
        return res.status(400).json({ error: `You cannot clock in before your assigned ${empShift} shift starts at ${allowedStartTimeStr}` });
      }

      todayRecord = await Attendance.create({
        employeeId: empId,
        date,
        checkIn: time,
        checkOut: null,
        status: 'present',
        totalHours: 0,
        breakMinutes: 0,
        onBreak: false,
        breaks: [],
        extraHours: 0,
        lessHours: 0,
      });
    } else if (action === 'start-break') {
      if (!todayRecord) return res.status(400).json({ error: 'Not clocked in' });
      if (todayRecord.onBreak || todayRecord.onTeaBreak) {
        return res.status(400).json({ error: 'Already on a break' });
      }
      const mealCount = todayRecord.breaks?.filter(b => b.type === 'meal').length || 0;
      const maxAllowed = settings.mealBreaksMax !== undefined ? settings.mealBreaksMax : 5;
      if (mealCount >= maxAllowed) {
        return res.status(400).json({ error: 'Meal Break limit reached' });
      }
      todayRecord.onBreak = true;
      if (!todayRecord.breaks) todayRecord.breaks = [];
      todayRecord.breaks.push({ start: time, end: null, type: 'meal' });
      await todayRecord.save();
    } else if (action === 'end-break') {
      if (!todayRecord) return res.status(400).json({ error: 'Not clocked in' });
      todayRecord.onBreak = false;
      if (!todayRecord.breaks) todayRecord.breaks = [];
      const activeBreak = todayRecord.breaks.find((b) => b.type !== 'tea' && b.type !== 'tea_exceed' && !b.end);
      if (activeBreak) activeBreak.end = time;

      let totalBreakSecs = 0;
      todayRecord.breaks.forEach((b) => {
        if (b.type !== 'tea' && b.type !== 'tea_exceed') {
          if (b.start && b.end) {
            const bIn = getSecsFromTime(b.start);
            let bOut = getSecsFromTime(b.end);
            if (bOut < bIn) bOut += 86400;
            totalBreakSecs += bOut - bIn;
          }
        }
      });
      todayRecord.breakMinutes = Math.round(totalBreakSecs / 60);
      await todayRecord.save();
    } else if (action === 'start-tea-break') {
      if (!todayRecord) return res.status(400).json({ error: 'Not clocked in' });
      if (settings.teaBreakEnabled === false) {
        return res.status(400).json({ error: 'Tea Break feature is currently disabled' });
      }
      if (emp.teaBreakAllowed === false) {
        return res.status(400).json({ error: 'Tea Break is not allowed for your profile' });
      }
      if (emp.companyId) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(emp.companyId);
        const compQuery = isValidObjectId
          ? { $or: [{ legacyId: emp.companyId }, { _id: emp.companyId }] }
          : { legacyId: emp.companyId };
        const comp = await Company.findOne(compQuery);
        if (comp && comp.teaBreakAllowed === false) {
          return res.status(400).json({ error: 'Tea Break is not allowed for your company' });
        }
      }
      if (todayRecord.onBreak || todayRecord.onTeaBreak) {
        return res.status(400).json({ error: 'Already on a break' });
      }
      const teaCount = todayRecord.breaks?.filter(b => b.type === 'tea').length || 0;
      const maxAllowed = settings.teaBreaksMax !== undefined ? settings.teaBreaksMax : 2;
      if (teaCount >= maxAllowed) {
        return res.status(400).json({ error: 'Tea Break limit reached' });
      }

      // Check gap between tea breaks
      if (teaCount > 0) {
        const lastTeaBreak = [...todayRecord.breaks]
          .reverse()
          .find(b => (b.type === 'tea' || b.type === 'tea_exceed') && b.end);
        if (lastTeaBreak) {
          const gapMin = settings.teaBreakGap !== undefined ? settings.teaBreakGap : 120;
          const lastEndSecs = getSecsFromTime(lastTeaBreak.end);
          let currentStartSecs = getSecsFromTime(time);
          if (currentStartSecs < lastEndSecs) {
            currentStartSecs += 86400;
          }
          const elapsedSecs = currentStartSecs - lastEndSecs;
          if (elapsedSecs < gapMin * 60) {
            const remainingMins = Math.ceil((gapMin * 60 - elapsedSecs) / 60);
            return res.status(400).json({ error: `Please wait ${remainingMins} min before the next Tea Break.` });
          }
        }
      }

      todayRecord.onTeaBreak = true;
      if (!todayRecord.breaks) todayRecord.breaks = [];
      todayRecord.breaks.push({ start: time, end: null, type: 'tea', startTimestamp: Date.now() });
      await todayRecord.save();
    } else if (action === 'end-tea-break') {
      if (!todayRecord) return res.status(400).json({ error: 'Not clocked in' });
      todayRecord.onTeaBreak = false;
      if (!todayRecord.breaks) todayRecord.breaks = [];
      const activeTeaBreak = todayRecord.breaks.find((b) => b.type === 'tea' && !b.end);
      if (activeTeaBreak) activeTeaBreak.end = time;
      await todayRecord.save();
    } else if (action === 'end-tea-exceed') {
      if (!todayRecord) return res.status(400).json({ error: 'Not clocked in' });
      todayRecord.onTeaExceed = false;
      if (!todayRecord.breaks) todayRecord.breaks = [];
      const activeExceedBreak = todayRecord.breaks.find((b) => b.type === 'tea_exceed' && !b.end);
      if (activeExceedBreak) activeExceedBreak.end = time;
      await todayRecord.save();
    } else if (action === 'clock-out') {
      if (!todayRecord) return res.status(400).json({ error: 'Not clocked in' });

      let breaksModified = false;
      todayRecord.onBreak = false;
      todayRecord.onTeaBreak = false;
      todayRecord.onTeaExceed = false;
      if (todayRecord.breaks) {
        todayRecord.breaks.forEach((b) => {
          if (!b.end) {
            b.end = time;
            breaksModified = true;
          }
        });
      }
      if (breaksModified) {
        todayRecord.markModified('breaks');
      }

      finalizeClockOut(todayRecord, time, settings);
      await todayRecord.save();
    } else if (action === 'add-task') {
      if (!todayRecord) {
        return res.status(400).json({ error: 'You can only log tasks for days you have attended.' });
      }
      const { description, timeContext } = req.body;
      if (!description) {
        return res.status(400).json({ error: 'Task description is required.' });
      }
      const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 50) {
        return res.status(400).json({ error: 'Task description cannot exceed 50 words.' });
      }
      if (!todayRecord.tasks) todayRecord.tasks = [];
      todayRecord.tasks.push({ description, timeContext });
      await todayRecord.save();
    } else if (action === 'edit-task') {
      if (!todayRecord) {
        return res.status(400).json({ error: 'You can only edit tasks for days you have attended.' });
      }
      const { taskId, description, timeContext } = req.body;
      if (!taskId) return res.status(400).json({ error: 'Task ID is required.' });
      if (!description) return res.status(400).json({ error: 'Task description is required.' });
      const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 50) {
        return res.status(400).json({ error: 'Task description cannot exceed 50 words.' });
      }
      if (!todayRecord.tasks) return res.status(404).json({ error: 'Task not found.' });

      const taskIndex = todayRecord.tasks.findIndex(t => (t._id && t._id.toString() === taskId) || (t.id && t.id.toString() === taskId));
      if (taskIndex === -1) return res.status(404).json({ error: 'Task not found.' });

      todayRecord.tasks[taskIndex].description = description;
      todayRecord.tasks[taskIndex].timeContext = timeContext;
      await todayRecord.save();
    }

    if (req.io) {
      req.io.emit('attendance_update', {
        employeeId: empId,
        action,
        time,
        date
      });
    }

    res.json({ message: `Successfully executed ${action}`, record: toAttendanceJSON(todayRecord) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmOvertime = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const empId = getEmployeeLegacyId(emp);
    const todayRecord = await Attendance.findOne({ employeeId: empId, checkOut: null });
    
    if (!todayRecord) {
      return res.status(400).json({ error: 'Not currently checked in' });
    }

    if (todayRecord.overtimeState?.status !== 'pending') {
      return res.status(400).json({ error: 'No overtime confirmation pending' });
    }

    // Reset status and increment confirmed hours
    todayRecord.overtimeState.status = 'idle';
    todayRecord.overtimeState.confirmedHours = (todayRecord.overtimeState.confirmedHours || 0) + 1;
    todayRecord.overtimeState.nextConfirmDueAt = null;
    
    await todayRecord.save();

    if (req.io) {
      req.io.emit('attendance_update', {
        employeeId: empId,
        action: 'confirm-overtime',
        time: new Date().toISOString()
      });
    }

    res.json({ message: 'Overtime confirmed successfully', record: toAttendanceJSON(todayRecord) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    // Auto-reject any pending leaves whose end dates have passed
    await autoRejectPassedLeaves();

    const leaves = await LeaveRequest.find({ employeeId: getEmployeeLegacyId(emp), hiddenForEmployee: { $ne: true } }).sort({ createdAt: -1 }).lean();
    res.json(leaves.map(toLeaveJSON));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLeaveRequest = async (req, res) => {
  try {
    const { id, leaveId } = req.params;
    const leave = await LeaveRequest.findOne({ _id: leaveId, employeeId: id });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    
    leave.hiddenForEmployee = true;
    await leave.save();
    
    if (req.io) {
      req.io.emit('attendance_update', { action: 'leave_deleted', time: new Date().toISOString() });
    }
    
    res.json({ message: 'Leave request removed from dashboard' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelLeaveRequest = async (req, res) => {
  try {
    const { id, leaveId } = req.params;
    const leave = await LeaveRequest.findOne({ _id: leaveId, employeeId: id });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    
    const emp = await findEmployee(id);
    
    leave.status = 'cancelled';
    if (emp) {
      leave.cancelledBy = emp.name;
    }
    await leave.save();
    
    if (emp) {
      await syncLeaveBalance(getEmployeeLegacyId(emp), emp.joinDate);
    }
    
    if (req.io) {
      req.io.emit('attendance_update', { action: 'leave_cancelled', time: new Date().toISOString() });
    }
    
    res.json({ message: 'Leave request cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createLeaveRequest = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { type, startDate, endDate, days, reason } = req.body;
    const empId = getEmployeeLegacyId(emp);

    const numericDays = Number(days);
    const balance = await syncLeaveBalance(empId, emp.joinDate);
    
    const pendingLeaves = await LeaveRequest.find({ employeeId: empId, type, status: 'pending' });
    const pendingDays = pendingLeaves.reduce((sum, l) => sum + Number(l.days), 0);

    const remaining = balance[type] ? (balance[type].total - balance[type].used) : 0;
    const actualRemaining = remaining - pendingDays;

    if (numericDays > actualRemaining) {
      if (pendingDays > 0) {
        return res.status(400).json({ error: `Insufficient leave balance. Remaining: ${actualRemaining} days (${pendingDays} days already pending approval).` });
      }
      return res.status(400).json({ error: `Insufficient leave balance. Remaining: ${remaining} days.` });
    }

    const newLeave = await LeaveRequest.create({
      employeeId: empId,
      employeeName: emp.name,
      department: emp.department,
      type,
      startDate,
      endDate,
      days: numericDays,
      reason,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
    });

    if (req.io) {
      req.io.emit('attendance_update', { action: 'leave_requested', time: new Date().toISOString() });
    }

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave: toLeaveJSON(newLeave),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { clientId } = req.body;
    if (!clientId || clientId === 'unassigned' || clientId === 'Unassigned' || clientId === 'Our Company') {
      emp.companyId = null;
      emp.company = 'Our Company';
    } else {
      let query;
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(clientId);
      if (isValidObjectId) {
        query = { $or: [{ legacyId: clientId }, { _id: clientId }] };
      } else {
        query = { legacyId: clientId };
      }
      const comp = await Company.findOne(query);
      if (!comp) return res.status(404).json({ error: 'Client not found' });
      emp.companyId = comp.legacyId || comp._id.toString();
      emp.company = comp.name;
    }
    await emp.save();
    await syncCompanyEmployeeCounts();

    res.json({ message: 'Employee client updated successfully', employee: toEmployeeJSON(emp) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { teamId } = req.body;
    if (!teamId || teamId === 'unassigned' || teamId === 'Unassigned') {
      emp.teamId = null;
      emp.team = 'None';
    } else {
      let query;
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);
      if (isValidObjectId) {
        query = { $or: [{ legacyId: teamId }, { _id: teamId }] };
      } else {
        query = { legacyId: teamId };
      }
      const comp = await Company.findOne(query);
      if (!comp) return res.status(404).json({ error: 'Team not found' });
      emp.teamId = comp.legacyId || comp._id.toString();
      emp.team = comp.name;
    }
    await emp.save();

    res.json({ message: 'Employee team assignment updated successfully', employee: toEmployeeJSON(emp) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateShift = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { shift } = req.body;
    if (!['morning', 'night'].includes(shift)) {
      return res.status(400).json({ error: 'Invalid shift value. Must be morning or night.' });
    }

    emp.shift = shift;
    await emp.save();

    res.json({ message: 'Employee shift updated successfully', employee: toEmployeeJSON(emp) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { phone, address, password, cvName, cvData, avatar } = req.body;

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (phone !== undefined) emp.phone = phone;
    if (address !== undefined) emp.address = address;
    if (cvName !== undefined) emp.cvName = cvName;
    if (cvData !== undefined) emp.cvData = cvData;
    if (avatar !== undefined) emp.avatar = avatar;

    await emp.save();

    // Sync password and avatar to auth User model
    const userQuery = emp.userId ? { _id: emp.userId } : { email: emp.email.toLowerCase() };
    const user = await User.findOne(userQuery);
    if (user) {
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      if (avatar !== undefined) {
        user.avatar = avatar;
      }
      await user.save();
    }

    res.json({
      message: 'Profile updated successfully',
      employee: toEmployeeJSON(emp),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeShiftNotices = async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await findEmployee(id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const eid = emp.legacyId || emp._id.toString();

    // Query notices targeting this employee specifically, or targeting all employees under this client/company
    const query = {
      $or: [
        { employeeId: eid },
        { employeeId: 'all', companyId: emp.companyId }
      ]
    };

    const notices = await ShiftNotice.find(query).sort({ createdAt: -1 }).lean();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCelebrations = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const employees = await Employee.find({ status: 'active' })
      .select('name dateOfBirth joinDate')
      .lean();

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    const celebrations = [];

    employees.forEach(e => {
      if (e.dateOfBirth) {
        const dob = new Date(e.dateOfBirth);
        if (!isNaN(dob) && dob.getMonth() === currentMonth && dob.getDate() === currentDay) {
          celebrations.push({
            _id: `bday_${e._id}`,
            title: `${e.name}'s Birthday! 🎂`,
            conductor: 'Company Celebration',
            date: new Date(currentYear, currentMonth, dob.getDate()).toISOString().split('T')[0],
            time: '00:00',
            meetingLink: null,
            createdAt: new Date(currentYear, currentMonth, currentDay).toISOString(),
            type: 'birthday',
            employeeName: e.name
          });
        }
      }

      if (e.joinDate) {
        const join = new Date(e.joinDate);
        if (!isNaN(join) && join.getMonth() === currentMonth && join.getDate() === currentDay && join.getFullYear() < currentYear) {
          const years = currentYear - join.getFullYear();
          celebrations.push({
            _id: `anniv_${e._id}`,
            title: `${e.name}'s ${years} Year Work Anniversary! 🎉`,
            conductor: 'Company Celebration',
            date: new Date(currentYear, currentMonth, join.getDate()).toISOString().split('T')[0],
            time: '00:00',
            meetingLink: null,
            createdAt: new Date(currentYear, currentMonth, currentDay).toISOString(),
            type: 'anniversary',
            employeeName: e.name,
            years
          });
        }
      }
    });

    res.json(celebrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

