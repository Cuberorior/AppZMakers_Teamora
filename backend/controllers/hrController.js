import Employee from '../models/Employee.js';
import ShiftNotice from '../models/ShiftNotice.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Attendance from '../models/Attendance.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import HRUser from '../models/HRUser.js';
import bcrypt from 'bcryptjs';
import { finalizeClockOut, getSecsFromTime, parseBreakMinutes, parseStdHours, autoEndOverdueTeaBreaks } from '../utils/attendanceMath.js';
import {
  getTodayString,
  formatDisplayDate,
  getTodayAttendanceForEmployees,
  computeEmployeeStats,
  getWeeklyAttendanceData,
  getDeptAttendanceData,
  computeLeaveTypeData,
  computeMonthlyTrend,
  isEmployeeOnLeave,
  standardizeDepartment,
} from '../utils/helpers.js';
import { findEmployee, findLeave, getEmployeeLegacyId, getNextEmployeeLegacyId, findHRUser } from '../utils/entityLookup.js';
import { toEmployeeJSON, toLeaveJSON, toLeaveBalanceJSON, toAttendanceJSON, toHRJSON } from '../utils/formatters.js';
import { getSettings } from '../services/settingsService.js';
import { syncCompanyEmployeeCounts } from '../services/companyService.js';
import { syncLeaveBalance, autoRejectPassedLeaves } from '../services/leaveService.js';
import { sendEmail } from '../services/emailService.js';

export const getLeaves = async (req, res) => {
  try {
    await autoRejectPassedLeaves();
    const leaves = await LeaveRequest.find({ hiddenForAdmins: { $ne: true } }).sort({ createdAt: -1 }).lean();
    res.json(leaves.map(toLeaveJSON));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reviewLeave = async (req, res) => {
  try {
    const { status, note, rejectionReason } = req.body;
    const leave = await findLeave(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request has already been reviewed' });
    }

    leave.status = status;
    if (note) leave.hrNote = note;
    if (rejectionReason) leave.rejectionReason = rejectionReason;
    await leave.save();

    if (status === 'approved') {
      const emp = await findEmployee(leave.employeeId);
      if (emp) {
        await syncLeaveBalance(leave.employeeId, emp.joinDate);
      }
    }

    if (req.io) {
      req.io.emit('attendance_update', { action: 'leave_reviewed', time: new Date().toISOString() });
    }

    res.json({ message: `Leave request ${status} successfully`, leave: toLeaveJSON(leave) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-cvData -cvName').sort({ createdAt: -1 }).lean();
    res.json(employees.map(toEmployeeJSON));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeDetail = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const empId = getEmployeeLegacyId(emp);
    const balance = await syncLeaveBalance(empId, emp.joinDate);
    const attendance = await Attendance.find({ employeeId: empId }).sort({ date: -1 }).limit(10).lean();
    let targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() - 90);
    const startDateStr = targetDateObj.toISOString().split('T')[0];
    const allAttendance = await Attendance.find({ employeeId: empId, date: { $gte: startDateStr } }).lean();
    const stats = computeEmployeeStats(empId, allAttendance.map(toAttendanceJSON));

    res.json({
      employee: toEmployeeJSON(emp),
      leaveBalance: balance ? toLeaveBalanceJSON(balance) : null,
      attendance: attendance.map(toAttendanceJSON),
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, position, department, companyId, phone, address, country, joinDate, dateOfBirth, shift } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 30) {
      return res.status(400).json({ error: 'Name must be between 2 and 30 characters long.' });
    }
    if (!/^[a-zA-Z\s.\-]+$/.test(name)) {
      return res.status(400).json({ error: 'Name contains invalid characters.' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!position || position.trim().length < 2 || position.trim().length > 20) {
      return res.status(400).json({ error: 'Position must be between 2 and 20 characters long.' });
    }
    if (!/^[a-zA-Z\s.\-()&/,]+$/.test(position)) {
      return res.status(400).json({ error: 'Position contains invalid characters.' });
    }

    if (!department || department.trim().length < 2 || department.trim().length > 20) {
      return res.status(400).json({ error: 'Department must be between 2 and 20 characters long.' });
    }
    if (!/^[a-zA-Z\s.\-()&/,]+$/.test(department)) {
      return res.status(400).json({ error: 'Department contains invalid characters.' });
    }

    if (!address || address.trim().length < 5 || address.trim().length > 50) {
      return res.status(400).json({ error: 'Address must be between 5 and 50 characters long.' });
    }

    if (!country || country.trim() === '') {
      return res.status(400).json({ error: 'Working location (country) is required.' });
    }

    if (!joinDate) {
      return res.status(400).json({ error: 'Join date is required.' });
    }
    const today = new Date().toISOString().split('T')[0];
    if (joinDate > today) {
      return res.status(400).json({ error: 'Join date cannot be a future date.' });
    }

    const settings = await getSettings();

    let comp = null;
    if (companyId) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(companyId);
      if (isValidObjectId) {
        comp = await Company.findOne({ $or: [{ legacyId: companyId }, { _id: companyId }] });
      } else {
        comp = await Company.findOne({ legacyId: companyId });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'This email address is already registered.' });
    }

    const legacyId = await getNextEmployeeLegacyId();

    // 1. Generate 10-digit password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let plainPassword = '';
    for (let i = 0; i < 10; i++) {
      plainPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 2. Hash password and create User
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'employee',
      profileId: legacyId,
    });

    // 3. Create Employee linked to User
    const newEmp = await Employee.create({
      legacyId,
      name,
      email: email.toLowerCase(),
      position,
      department: standardizeDepartment(department),
      company: comp ? comp.name : 'General',
      companyId: comp ? comp.legacyId || comp._id.toString() : null,
      avatar: name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      phone: phone || null,
      address: address || null,
      country: country,
      status: 'active',
      joinDate: joinDate,
      dateOfBirth: dateOfBirth || null,
      shift: shift && ['morning', 'night'].includes(shift) ? shift : 'morning',
      userId: newUser._id,
    });

    await LeaveBalance.deleteOne({ employeeId: legacyId });
    await LeaveBalance.create({
      employeeId: legacyId,
      annual: { total: settings.leaveAllocations?.annual || 15, used: 0 },
      casual: { total: settings.leaveAllocations?.casual || 10, used: 0 },
      medical: { total: settings.leaveAllocations?.medical || 10, used: 0 },
    });

    await syncCompanyEmployeeCounts();

    // 4. Send email via Nodemailer
    let emailStatus = 'sent';
    let emailError = null;

    try {
      const subject = 'Your AppZ Makers Account Credentials';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hello ${name},</p>
          <p>To verify your identity and continue with your AppZ Makers account, please use the One-Time Password (OTP) below:</p>
          <br>
          <h2>${plainPassword}</h2>
          <br>
          <p>Please do not share this code with anyone.</p>
          <p>If you did not request this verification code, you can safely ignore this email. Your account will remain secure.</p>
          <p>AppZ Makers will never ask you to share your OTP, password, or other security information through email, phone calls, or messages. Please be aware of phishing attempts.</p>
          <p>Thank you for using AppZ Makers.</p>
          <p>Best regards,<br><strong>AppZ Makers Team</strong></p>
        </div>
      `;

      await sendEmail(email.toLowerCase(), subject, html);
      console.log('Email sent successfully via Nodemailer');
    } catch (emailErr) {
      console.error('Error occurred while sending email via Nodemailer:', emailErr.message);
      emailStatus = 'error';
      emailError = emailErr.message;
    }

    res.status(201).json({
      message: emailStatus === 'sent'
        ? 'Employee created successfully and credentials emailed.'
        : `Employee created successfully, but email failed: ${emailError}`,
      employee: toEmployeeJSON(newEmp),
      password: plainPassword,
      emailStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    autoRejectPassedLeaves().catch(console.error);
    let targetDateObj = new Date();
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDateObj = new Date(year, month - 1, day);
    }
    const today = getTodayString(targetDateObj);
    const todayLabel = formatDisplayDate(targetDateObj);

    const startOfWeek = new Date(targetDateObj);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startDateStr = getTodayString(startOfWeek);

    const endOfWeek = new Date(targetDateObj);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const endDateStr = getTodayString(endOfWeek);

    const [
      employees,
      settings,
      attendanceRecords,
      leaveRequests
    ] = await Promise.all([
      Employee.find().select('-cvData -cvName').sort({ createdAt: -1 }).lean(),
      getSettings(),
      Attendance.find({ date: { $gte: startDateStr, $lte: endDateStr } }).lean(),
      LeaveRequest.find({
        hiddenForAdmins: { $ne: true },
        $or: [
          { startDate: { $gte: startDateStr, $lte: endDateStr } },
          { endDate: { $gte: startDateStr, $lte: endDateStr } },
          { startDate: { $lte: startDateStr }, endDate: { $gte: endDateStr } }
        ]
      }).lean()
    ]);

    const employeesJson = employees.map(toEmployeeJSON);
    const activeEmployees = employeesJson.filter((e) => e.status === 'active');

    await autoEndOverdueTeaBreaks(attendanceRecords, settings);

    const attJson = attendanceRecords.map(toAttendanceJSON);
    const leavesJson = leaveRequests.map(toLeaveJSON);

    const todayAttendance = getTodayAttendanceForEmployees(activeEmployees, attJson, today, leavesJson);
    const present = todayAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const absent = todayAttendance.filter((a) => a.status === 'absent').length;
    const late = todayAttendance.filter((a) => a.status === 'late').length;
    const pendingLeaves = leavesJson.filter((l) => l.status === 'pending');
    const onLeaveToday = todayAttendance.filter((a) => a.status.startsWith('on leave')).length;

    res.json({
      todayDate: today,
      todayLabel: todayLabel,
      employees: employeesJson,
      todayAttendance,
      weeklyAttendanceData: getWeeklyAttendanceData(
        attJson,
        activeEmployees.map((e) => e.id),
        targetDateObj,
        leavesJson
      ),
      deptData: getDeptAttendanceData(activeEmployees, todayAttendance),
      leaveCounts: {
        all: leavesJson.length,
        pending: pendingLeaves.length,
        approved: leavesJson.filter((l) => l.status === 'approved').length,
        rejected: leavesJson.filter((l) => l.status === 'rejected').length,
        cancelled: leavesJson.filter((l) => l.status === 'cancelled').length,
      },
      pendingLeaves,
      stats: {
        totalEmployees: employeesJson.length,
        activeEmployees: activeEmployees.length,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
        onLeaveToday,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    const employeesJson = employees.map(toEmployeeJSON);
    const activeEmployees = employeesJson.filter((e) => e.status === 'active');
    const employeeIds = activeEmployees.map((e) => e.id);
    const today = getTodayString();

    let attendanceFilter = {};
    if (startDate && endDate) {
      attendanceFilter.date = { $gte: startDate, $lte: endDate };
    }
    const attendanceRecords = await Attendance.find(attendanceFilter).lean();
    const attJson = attendanceRecords.map(toAttendanceJSON);

    let leaveFilter = {};
    if (startDate && endDate) {
      leaveFilter.$or = [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ];
    }
    const leaveRequests = await LeaveRequest.find(leaveFilter).lean();
    const leavesJson = leaveRequests.map(toLeaveJSON);

    const todayAttendance = getTodayAttendanceForEmployees(activeEmployees, attJson, today, leavesJson);
    const employeeStats = {};
    activeEmployees.forEach((emp) => {
      employeeStats[emp.id] = computeEmployeeStats(emp.id, attJson);
    });

    const allStats = Object.values(employeeStats);
    const avgAttendance =
      allStats.length > 0
        ? Math.round(allStats.reduce((sum, s) => sum + s.pct, 0) / allStats.length)
        : 0;
    const totalHours = allStats.reduce((sum, s) => sum + s.hours, 0);

    // If a range is provided, compute weekly and monthly charts relative to the end date of that range.
    let referenceDateObj = endDate ? new Date(endDate) : new Date();
    if (referenceDateObj > new Date()) referenceDateObj = new Date();

    res.json({
      employees: employeesJson,
      leaves: leavesJson,
      todayAttendance,
      weeklyAttendanceData: getWeeklyAttendanceData(attJson, employeeIds, referenceDateObj, leavesJson),
      leaveTypeData: computeLeaveTypeData(leavesJson),
      monthlyTrend: computeMonthlyTrend(attJson, employeeIds),
      employeeStats,
      summary: {
        totalEmployees: employeesJson.length,
        activeEmployees: activeEmployees.length,
        avgAttendance,
        totalHours,
        leaveDaysUsed: leavesJson
          .filter((l) => l.status === 'approved')
          .reduce((s, l) => s + l.days, 0),
      },
      attendanceData: attJson,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const hr = await findHRUser(req.params.id);
    if (!hr) return res.status(404).json({ error: 'HR User not found' });
    res.json({
      hr: toHRJSON(hr),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const hr = await findHRUser(req.params.id);
    if (!hr) return res.status(404).json({ error: 'HR User not found' });

    const { name, email, department, password, avatar } = req.body;

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (name !== undefined) hr.name = name;
    if (email !== undefined) hr.email = email;
    if (department !== undefined) hr.department = standardizeDepartment(department);
    if (avatar !== undefined) hr.avatar = avatar;

    await hr.save();

    const userQuery = hr.userId ? { _id: hr.userId } : { email: hr.email.toLowerCase() };
    const user = await User.findOne(userQuery);
    if (user) {
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email.toLowerCase();
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
      hr: toHRJSON(hr),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adjustAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, checkOutDate, status, reason, adjustedBy, breakMinutes, tasks } = req.body;

    const record = await Attendance.findById(id);
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });

    const settings = await getSettings();

    if (checkIn !== undefined) record.checkIn = checkIn;
    if (status !== undefined) record.status = status;

    if (checkOut) {
      record.onBreak = false;
      record.onTeaBreak = false;
      record.onTeaExceed = false;
      if (record.breaks) {
        record.breaks.forEach((b) => {
          if (!b.end) b.end = checkOut;
        });
        record.markModified('breaks');
      }
      finalizeClockOut(record, checkOut, settings);

      if (checkOutDate) {
        record.checkOutDate = checkOutDate;
      }
    } else {
      record.checkOut = null;
      record.totalHours = 0;
      record.extraHours = 0;
      record.lessHours = 0;
    }

    if (breakMinutes !== undefined) {
      record.breakMinutes = Number(breakMinutes);
      // Re-calculate totalHours and extra/less hours since breakMinutes changed!
      const allowedBreakMin = parseBreakMinutes(settings.breakTime);
      const stdHours = parseStdHours(settings.workHours);
      const inSecs = getSecsFromTime(record.checkIn);
      let outSecs = getSecsFromTime(record.checkOut || record.checkIn);
      if (outSecs < inSecs) outSecs += 86400;

      let elapsedHrs = (outSecs - inSecs) / 3600;
      let totalHr = elapsedHrs - (record.breakMinutes / 60);
      totalHr = Math.max(0, Math.round(totalHr * 100) / 100);
      record.totalHours = totalHr;

      let targetHours = stdHours;
      if (totalHr > targetHours) {
        record.extraHours = Math.round((totalHr - targetHours) * 100) / 100;
        record.lessHours = 0;
      } else {
        record.extraHours = 0;
        record.lessHours = Math.round((targetHours - totalHr) * 100) / 100;
      }
    }

    if (tasks !== undefined) record.tasks = tasks;

    record.adjusted = true;
    record.adjustedBy = adjustedBy || 'HR Manager';
    record.adjustedReason = reason || 'Manual adjustment';

    await record.save();

    res.json({
      message: 'Attendance record adjusted successfully',
      record: toAttendanceJSON(record),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createManualAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, reason, adjustedBy, breakMinutes, isAdmin, tasks } = req.body;

    const existingRecord = await Attendance.findOne({ employeeId, date });
    if (existingRecord) {
      if (!isAdmin) {
        return res.status(400).json({ error: 'Attendance record already exists for this date. Adjust the existing record instead.' });
      }

      // Admin Override: update the existing record directly
      const settings = await getSettings();
      existingRecord.checkIn = checkIn || '09:00:00';
      existingRecord.status = status || 'present';
      if (checkOut) {
        existingRecord.onBreak = false;
        existingRecord.onTeaBreak = false;
        existingRecord.onTeaExceed = false;
        if (existingRecord.breaks) {
          existingRecord.breaks.forEach((b) => {
            if (!b.end) b.end = checkOut;
          });
          existingRecord.markModified('breaks');
        }
        finalizeClockOut(existingRecord, checkOut, settings);
      } else {
        existingRecord.checkOut = null;
        existingRecord.totalHours = 0;
        existingRecord.extraHours = 0;
        existingRecord.lessHours = 0;
      }

      if (breakMinutes !== undefined) {
        existingRecord.breakMinutes = Number(breakMinutes);
        const allowedBreakMin = parseBreakMinutes(settings.breakTime);
        const stdHours = parseStdHours(settings.workHours);
        const inSecs = getSecsFromTime(existingRecord.checkIn);
        let outSecs = getSecsFromTime(existingRecord.checkOut || existingRecord.checkIn);
        if (outSecs < inSecs) outSecs += 86400;

        let elapsedHrs = (outSecs - inSecs) / 3600;
        let totalHr = elapsedHrs - (existingRecord.breakMinutes / 60);
        totalHr = Math.max(0, Math.round(totalHr * 100) / 100);
        existingRecord.totalHours = totalHr;

        let targetHours = stdHours;
        if (totalHr > targetHours) {
          existingRecord.extraHours = Math.round((totalHr - targetHours) * 100) / 100;
          existingRecord.lessHours = 0;
        } else {
          existingRecord.extraHours = 0;
          existingRecord.lessHours = Math.round((targetHours - totalHr) * 100) / 100;
        }
      }

      if (tasks !== undefined) existingRecord.tasks = tasks;

      existingRecord.adjusted = true;
      existingRecord.adjustedBy = adjustedBy || 'Administrator';
      existingRecord.adjustedReason = reason || 'Manual override';

      await existingRecord.save();

      return res.status(200).json({
        message: 'Attendance record updated successfully via admin override',
        record: toAttendanceJSON(existingRecord),
      });
    }

    const settings = await getSettings();

    const record = new Attendance({
      employeeId,
      date,
      checkIn: checkIn || '09:00:00',
      status: status || 'present',
      adjusted: true,
      adjustedBy: adjustedBy || 'HR Manager',
      adjustedReason: reason || 'Manual entry',
      breaks: [],
      tasks: tasks || [],
    });

    if (checkOut) {
      record.onBreak = false;
      record.onTeaBreak = false;
      record.onTeaExceed = false;
      if (record.breaks) {
        record.breaks.forEach((b) => {
          if (!b.end) b.end = checkOut;
        });
        record.markModified('breaks');
      }
      finalizeClockOut(record, checkOut, settings);
    }

    if (breakMinutes !== undefined) {
      record.breakMinutes = Number(breakMinutes);
      // Re-calculate totalHours and extra/less hours since breakMinutes changed!
      const allowedBreakMin = parseBreakMinutes(settings.breakTime);
      const stdHours = parseStdHours(settings.workHours);
      const inSecs = getSecsFromTime(record.checkIn);
      let outSecs = getSecsFromTime(record.checkOut || record.checkIn);
      if (outSecs < inSecs) outSecs += 86400;

      let elapsedHrs = (outSecs - inSecs) / 3600;
      let totalHr = elapsedHrs - (record.breakMinutes / 60);
      totalHr = Math.max(0, Math.round(totalHr * 100) / 100);
      record.totalHours = totalHr;

      let targetHours = stdHours;
      if (totalHr > targetHours) {
        record.extraHours = Math.round((totalHr - targetHours) * 100) / 100;
        record.lessHours = 0;
      } else {
        record.extraHours = 0;
        record.lessHours = Math.round((targetHours - totalHr) * 100) / 100;
      }
    }

    await record.save();

    res.status(201).json({
      message: 'Attendance record created manually successfully',
      record: toAttendanceJSON(record),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Valid status ("active" or "inactive") is required.' });
    }

    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    emp.status = status;
    await emp.save();

    res.json({
      message: `Employee account status updated to ${status} successfully.`,
      employee: toEmployeeJSON(emp),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHRShiftNotices = async (req, res) => {
  try {
    const notices = await ShiftNotice.find().sort({ createdAt: -1 }).lean();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLeaveApproval = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    leave.hiddenForAdmins = true;
    await leave.save();

    res.json({ message: 'Leave history deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
