import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import ShiftNotice from '../models/ShiftNotice.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  getTodayString,
  getTodayAttendanceForEmployees,
  getWeeklyAttendanceData,
  isEmployeeOnLeave,
  computeEmployeeStats,
  computeLeaveTypeData,
  computeMonthlyTrend
} from '../utils/helpers.js';
import { findCompany } from '../utils/entityLookup.js';
import { toCompanyJSON, toEmployeeJSON, toAttendanceJSON, toLeaveJSON } from '../utils/formatters.js';
import { syncCompanyEmployeeCounts } from '../services/companyService.js';
import { syncLeaveBalance } from '../services/leaveService.js';

export const getDashboard = async (req, res) => {
  try {
    const comp = await findCompany(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    await syncCompanyEmployeeCounts();

    const cid = comp.legacyId || comp._id.toString();
    const employeeQuery = comp.isTeam ? { teamId: cid } : { companyId: cid };
    const compEmployees = await Employee.find(employeeQuery).select('-cvData -cvName').sort({ createdAt: -1 }).lean();
    const employeesJson = compEmployees.map(toEmployeeJSON);
    const employeeIds = employeesJson.map((e) => e.id);

    let targetDateObj = new Date();
    const today = getTodayString(targetDateObj);
    const startOfWeek = new Date(targetDateObj);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startDateStr = getTodayString(startOfWeek);
    const endOfWeek = new Date(targetDateObj);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const endDateStr = getTodayString(endOfWeek);

    const attendanceRecords = await Attendance.find({ employeeId: { $in: employeeIds } }).sort({ date: -1 }).lean();
    const attJson = attendanceRecords.map(toAttendanceJSON);
    const allLeaves = await LeaveRequest.find({
      $or: [
        { startDate: { $gte: startDateStr, $lte: endDateStr } },
        { endDate: { $gte: startDateStr, $lte: endDateStr } },
        { startDate: { $lte: startDateStr }, endDate: { $gte: endDateStr } }
      ]
    }).lean();
    const leavesJson = allLeaves;

    const todayRecs = getTodayAttendanceForEmployees(employeesJson, attJson, today, leavesJson);

    const presentCount = todayRecs.filter((r) => r.status === 'present' || r.status === 'late').length;
    const absentCount = todayRecs.filter((r) => r.status === 'absent').length;
    const leaves = await LeaveRequest.find({ employeeId: { $in: employeeIds }, status: 'pending' }).lean();
    const pendingLeaves = leaves.length;
    const periodAttRecords = attJson.filter((r) => r.date >= startDateStr && r.date <= endDateStr);
    const totalHours = periodAttRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const onLeaveCount = todayRecs.filter((r) => r.status.startsWith('on leave')).length;

    res.json({
      company: { ...toCompanyJSON(comp), employeeCount: employeesJson.length },
      employees: employeesJson,
      todayRecs,
      attendanceHistory: attJson,
      weeklyData: getWeeklyAttendanceData(attJson, employeeIds, new Date(), leavesJson),
      stats: {
        presentCount,
        absentCount,
        pendingLeaves,
        totalHours,
        onLeaveCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const comp = await findCompany(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });
    const legacyId = comp.legacyId || comp._id.toString();

    const { startDate, endDate } = req.query;

    const employeeQuery = comp.isTeam ? { teamId: legacyId } : { companyId: legacyId };
    const employees = await Employee.find(employeeQuery).select('-cvData -cvName').sort({ createdAt: -1 }).lean();
    const employeesJson = employees.map(toEmployeeJSON);
    const activeEmployees = employeesJson.filter((e) => e.status === 'active');
    const employeeIds = activeEmployees.map((e) => e.id);
    const today = getTodayString();

    let attendanceFilter = { employeeId: { $in: employeeIds } };
    if (startDate && endDate) {
      attendanceFilter.date = { $gte: startDate, $lte: endDate };
    }
    const attendanceRecords = await Attendance.find(attendanceFilter).lean();
    const attJson = attendanceRecords.map(toAttendanceJSON);

    let leaveFilter = { employeeId: { $in: employeeIds } };
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
    const comp = await findCompany(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });
    res.json({
      company: toCompanyJSON(comp),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const comp = await findCompany(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    const { name, industry, contact, email, phone, password, avatar, address, country } = req.body;

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (name !== undefined) comp.name = name;
    if (industry !== undefined) comp.industry = industry;
    if (contact !== undefined) comp.contact = contact;
    if (email !== undefined) comp.email = email;
    if (phone !== undefined) comp.phone = phone;
    if (avatar !== undefined) comp.avatar = avatar;
    if (address !== undefined) comp.address = address;
    if (country !== undefined) comp.country = country;

    await comp.save();

    const legacyId = comp.legacyId || comp._id.toString();
    const user = await User.findOne({
      $or: [{ profileId: legacyId }, { email: comp.email.toLowerCase() }],
    });
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
      company: toCompanyJSON(comp),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createShiftNotice = async (req, res) => {
  try {
    const { id } = req.params; // Company ID
    const { employeeId, date, time, reason, noticeType, endDate, leaveType } = req.body;

    const company = await findCompany(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const cid = company.legacyId || company._id.toString();

    let empName = 'All Employees';
    if (employeeId !== 'all') {
      const emp = await Employee.findOne({
        $or: [{ legacyId: employeeId }, { _id: mongoose.isValidObjectId(employeeId) ? employeeId : null }],
      });
      if (emp) empName = emp.name;
    }

    // 6 hours check logic (only relevant for shift type)
    let informHR = false;
    if (noticeType !== 'leave') {
      const shiftStart = new Date(`${date}T${time}`);
      const now = new Date();
      const diffMs = shiftStart - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      informHR = diffHours < 6;
    }

    const notice = await ShiftNotice.create({
      companyId: cid,
      companyName: company.name,
      employeeId,
      employeeName: empName,
      date,
      time: noticeType === 'leave' ? undefined : time,
      reason,
      informHR,
      noticeType: noticeType || 'shift',
      endDate: noticeType === 'leave' ? endDate : undefined,
      leaveType: noticeType === 'leave' ? 'client-assigned' : undefined,
    });

    if (noticeType === 'leave') {
      const start = new Date(date);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

      if (employeeId !== 'all') {
        const emp = await Employee.findOne({
          $or: [{ legacyId: employeeId }, { _id: mongoose.isValidObjectId(employeeId) ? employeeId : null }],
        });
        if (emp) {
          await LeaveRequest.create({
            employeeId: emp.legacyId || emp._id.toString(),
            employeeName: emp.name,
            department: emp.department || '',
            type: 'client-assigned',
            startDate: date,
            endDate,
            days,
            reason: `Client assigned leave: ${reason}`,
            status: 'pending',
            appliedOn: new Date().toISOString().split('T')[0],
          });
          await syncLeaveBalance(emp.legacyId || emp._id.toString(), emp.joinDate);
        }
      } else {
        const employeeQuery = company.isTeam ? { teamId: cid } : { companyId: cid };
        const companyEmployees = await Employee.find(employeeQuery);
        for (const emp of companyEmployees) {
          await LeaveRequest.create({
            employeeId: emp.legacyId || emp._id.toString(),
            employeeName: emp.name,
            department: emp.department || '',
            type: 'client-assigned',
            startDate: date,
            endDate,
            days,
            reason: `Client assigned leave: ${reason}`,
            status: 'pending',
            appliedOn: new Date().toISOString().split('T')[0],
          });
          await syncLeaveBalance(emp.legacyId || emp._id.toString(), emp.joinDate);
        }
      }
    }

    if (req.io) {
      req.io.emit('attendance_update', { action: 'shift_notice_created', time: new Date().toISOString() });
    }

    res.status(201).json({
      message: noticeType === 'leave' ? 'Shift start notice & leave request sent successfully' : 'Shift start notice sent successfully',
      notice,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompanyShiftNotices = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await findCompany(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const cid = company.legacyId || company._id.toString();
    const notices = await ShiftNotice.find({ companyId: cid }).sort({ createdAt: -1 }).lean();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateShiftNotice = async (req, res) => {
  try {
    const { id, noticeId } = req.params;
    const { employeeId, date, time, reason, noticeType, endDate, leaveType } = req.body;

    const company = await findCompany(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const notice = await ShiftNotice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ error: 'Shift notice not found' });
    }

    // Delete previous LeaveRequest records created for this notice
    if (notice.noticeType === 'leave') {
      const oldLeaves = await LeaveRequest.find({
        startDate: notice.date,
        endDate: notice.endDate,
        type: notice.leaveType || 'client-assigned',
        reason: `Client assigned leave: ${notice.reason}`,
      });
      for (const oldLeave of oldLeaves) {
        await LeaveRequest.findByIdAndDelete(oldLeave._id);
        const emp = await Employee.findOne({
          $or: [{ legacyId: oldLeave.employeeId }, { _id: mongoose.isValidObjectId(oldLeave.employeeId) ? oldLeave.employeeId : null }],
        });
        if (emp) {
          await syncLeaveBalance(emp.legacyId || emp._id.toString(), emp.joinDate);
        }
      }
    }

    if (employeeId !== undefined && employeeId !== notice.employeeId) {
      let empName = 'All Employees';
      if (employeeId !== 'all') {
        const emp = await Employee.findOne({
          $or: [{ legacyId: employeeId }, { _id: mongoose.isValidObjectId(employeeId) ? employeeId : null }],
        });
        if (emp) empName = emp.name;
      }
      notice.employeeId = employeeId;
      notice.employeeName = empName;
    }

    if (date !== undefined) notice.date = date;
    if (time !== undefined) notice.time = time;
    if (reason !== undefined) notice.reason = reason;
    if (noticeType !== undefined) notice.noticeType = noticeType;
    if (endDate !== undefined) notice.endDate = endDate;
    notice.leaveType = notice.noticeType === 'leave' ? 'client-assigned' : undefined;

    if (notice.noticeType !== 'leave') {
      const shiftStart = new Date(`${notice.date}T${notice.time}`);
      const now = new Date();
      const diffMs = shiftStart - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      notice.informHR = diffHours < 6;
      notice.endDate = undefined;
      notice.leaveType = undefined;
    } else {
      notice.time = undefined;
      notice.informHR = false;
    }

    await notice.save();

    // Re-create new approved LeaveRequests if noticeType is leave
    if (notice.noticeType === 'leave') {
      const cid = company.legacyId || company._id.toString();
      const start = new Date(notice.date);
      const end = new Date(notice.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

      if (notice.employeeId !== 'all') {
        const emp = await Employee.findOne({
          $or: [{ legacyId: notice.employeeId }, { _id: mongoose.isValidObjectId(notice.employeeId) ? notice.employeeId : null }],
        });
        if (emp) {
          await LeaveRequest.create({
            employeeId: emp.legacyId || emp._id.toString(),
            employeeName: emp.name,
            department: emp.department || '',
            type: 'client-assigned',
            startDate: notice.date,
            endDate: notice.endDate,
            days,
            reason: `Client assigned leave: ${notice.reason}`,
            status: 'pending',
            appliedOn: new Date().toISOString().split('T')[0],
          });
          await syncLeaveBalance(emp.legacyId || emp._id.toString(), emp.joinDate);
        }
      } else {
        const employeeQuery = company.isTeam ? { teamId: cid } : { companyId: cid };
        const companyEmployees = await Employee.find(employeeQuery);
        for (const emp of companyEmployees) {
          await LeaveRequest.create({
            employeeId: emp.legacyId || emp._id.toString(),
            employeeName: emp.name,
            department: emp.department || '',
            type: 'client-assigned',
            startDate: notice.date,
            endDate: notice.endDate,
            days,
            reason: `Client assigned leave: ${notice.reason}`,
            status: 'pending',
            appliedOn: new Date().toISOString().split('T')[0],
          });
          await syncLeaveBalance(emp.legacyId || emp._id.toString(), emp.joinDate);
        }
      }
    }

    if (req.io) {
      req.io.emit('attendance_update', { action: 'shift_notice_updated', time: new Date().toISOString() });
    }

    res.json({ message: 'Shift notice updated successfully', notice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteShiftNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const notice = await ShiftNotice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ error: 'Shift notice not found' });
    }

    // Delete associated approved LeaveRequest records if it was a leave
    if (notice.noticeType === 'leave') {
      const oldLeaves = await LeaveRequest.find({
        startDate: notice.date,
        endDate: notice.endDate,
        type: notice.leaveType || 'client-assigned',
        reason: `Client assigned leave: ${notice.reason}`,
      });
      for (const oldLeave of oldLeaves) {
        await LeaveRequest.findByIdAndDelete(oldLeave._id);
        const emp = await Employee.findOne({
          $or: [{ legacyId: oldLeave.employeeId }, { _id: mongoose.isValidObjectId(oldLeave.employeeId) ? oldLeave.employeeId : null }],
        });
        if (emp) {
          await syncLeaveBalance(emp.legacyId || emp._id.toString(), emp.joinDate);
        }
      }
    }

    await ShiftNotice.findByIdAndDelete(noticeId);

    if (req.io) {
      req.io.emit('attendance_update', { action: 'shift_notice_deleted', time: new Date().toISOString() });
    }

    res.json({ message: 'Shift notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
