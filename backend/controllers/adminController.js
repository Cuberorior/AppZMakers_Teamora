import Company from '../models/Company.js';
import KnowledgeSession from '../models/KnowledgeSession.js';
import HRUser from '../models/HRUser.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import ShiftNotice from '../models/ShiftNotice.js';
import bcrypt from 'bcryptjs';
import {
  getTodayString,
  getTodayAttendanceForEmployees,
  getWeeklyAttendanceData,
  getDeptAttendanceData,
  isEmployeeOnLeave,
  formatDisplayDate,
  standardizeDepartment
} from '../utils/helpers.js';
import { findEmployee, findHRUser, findCompany, findLeave, getNextHRLegacyId, getNextCompanyLegacyId } from '../utils/entityLookup.js';
import { toCompanyJSON, toHRJSON, toEmployeeJSON, toLeaveJSON, toAttendanceJSON } from '../utils/formatters.js';
import {
  getSettings as fetchSystemSettings,
  updateSettings as updateSettingsDoc,
} from '../services/settingsService.js';
import { syncCompanyEmployeeCounts } from '../services/companyService.js';
import { syncLeaveBalance, autoRejectPassedLeaves } from '../services/leaveService.js';
import { sendEmail } from '../services/emailService.js';

export const getDashboard = async (req, res) => {
  try {
    autoRejectPassedLeaves().catch(console.error);
    syncCompanyEmployeeCounts().catch(console.error);
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
      companiesRaw,
      hrUsersRaw,
      employeesRaw,
      attendanceRecords,
      leaveRequests
    ] = await Promise.all([
      Company.find().sort({ createdAt: -1 }).lean(),
      HRUser.find().sort({ createdAt: -1 }).lean(),
      Employee.find().select('-cvData -cvName').sort({ createdAt: -1 }).lean(),
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

    const companies = companiesRaw.map(toCompanyJSON);
    const hrUsers = hrUsersRaw.map(toHRJSON);
    const employees = employeesRaw.map(toEmployeeJSON);
    
    const leavesJson = leaveRequests.map(toLeaveJSON);
    const pendingLeaves = leavesJson.filter(l => l.status === 'pending');
    
    const activeEmployees = employees.filter((e) => e.status === 'active');
    const attJson = attendanceRecords.map(toAttendanceJSON);

    const todayAttendance = getTodayAttendanceForEmployees(activeEmployees, attJson, today, leavesJson);
    const present = todayAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const absent = todayAttendance.filter((a) => a.status === 'absent').length;
    const late = todayAttendance.filter((a) => a.status === 'late').length;
    const onLeaveToday = todayAttendance.filter((a) => a.status.startsWith('on leave')).length;

    res.json({
      todayDate: today,
      todayLabel: todayLabel,
      companies,
      hrUsers,
      employees,
      todayAttendance,
      weeklyAttendanceData: getWeeklyAttendanceData(
        attJson,
        activeEmployees.map((e) => e.id),
        targetDateObj,
        leavesJson
      ),
      deptData: getDeptAttendanceData(activeEmployees, todayAttendance),
      stats: {
        totalCompanies: companies.length,
        activeCompanies: companies.filter((c) => c.status === 'active').length,
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalHR: hrUsers.length,
        activeHR: hrUsers.filter((h) => h.status === 'active').length,
        pendingLeaveApprovals: pendingLeaves.length,
        todayAttendanceRecords: todayAttendance.length,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
        onLeaveToday,
      },
      pendingLeaves,
      leaveCounts: {
        pending: pendingLeaves.length,
        approved: leavesJson.filter(l => l.status === 'approved').length,
        rejected: leavesJson.filter(l => l.status === 'rejected').length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    await autoRejectPassedLeaves();
    const leaves = await LeaveRequest.find({ hiddenForAdmins: { $ne: true } }).sort({ createdAt: -1 }).lean();
    res.json(leaves.map(toLeaveJSON));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    res.json(companies.map(toCompanyJSON));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHRUsers = async (req, res) => {
  try {
    const hrs = await HRUser.find().sort({ createdAt: -1 }).lean();
    res.json(hrs.map(toHRJSON));
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

export const createHR = async (req, res) => {
  try {
    const { name, email, department, joinDate, dateOfBirth } = req.body;

    const today = new Date().toISOString().split('T')[0];
    if (joinDate && joinDate > today) {
      return res.status(400).json({ error: 'Join date cannot be a future date.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'This email address is already registered.' });
    }

    const legacyId = await getNextHRLegacyId();

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
      role: 'hr',
      profileId: legacyId,
    });

    // 3. Create HRUser linked to User
    const newHr = await HRUser.create({
      legacyId,
      name,
      email: email.toLowerCase(),
      department: department || 'Human Resources',
      status: 'active',
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      dateOfBirth: dateOfBirth || null,
      userId: newUser._id,
    });

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
    } catch (emailErr) {
      console.error('Error occurred while sending email via Nodemailer:', emailErr.message);
      emailStatus = 'error';
      emailError = emailErr.message;
    }

    res.status(201).json({
      message: emailStatus === 'sent'
        ? 'HR Manager created successfully and credentials emailed.'
        : `HR Manager created successfully, but email failed: ${emailError}`,
      hrUser: toHRJSON(newHr),
      password: plainPassword,
      emailStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, industry, contact, email, phone, joinedDate, joinDate, address, country, isTeam } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 30) {
      return res.status(400).json({ error: 'Company name must be between 2 and 30 characters long.' });
    }
    if (!isTeam && (!industry || industry.trim().length < 2 || industry.trim().length > 30)) {
      return res.status(400).json({ error: 'Industry sector must be between 2 and 30 characters long.' });
    }
    if (!contact || contact.trim().length < 2 || contact.trim().length > 30) {
      return res.status(400).json({ error: 'Contact person must be between 2 and 30 characters long.' });
    }
    if (!isTeam && (!phone || !/^\+?[0-9\s\-()]{7,20}$/.test(phone))) {
      return res.status(400).json({ error: 'Please enter a valid phone number (7-20 digits).' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && !isTeam) {
      return res.status(400).json({ error: 'This email address is already registered.' });
    }

    const legacyId = await getNextCompanyLegacyId();

    // 1. Generate 10-digit password if not a team
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let plainPassword = '';
    if (!isTeam) {
      for (let i = 0; i < 10; i++) {
        plainPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // 2. Hash password and create User with role: 'company'
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'company',
        profileId: legacyId,
      });
    }

    // 3. Create Company
    const newComp = await Company.create({
      legacyId,
      name,
      industry: industry || 'General',
      contact: contact || name,
      email: email.toLowerCase(),
      phone: phone || '',
      employeeCount: 0,
      status: 'active',
      joinedDate: joinedDate || joinDate || getTodayString(),
      address: address || '',
      country: country || 'Sri Lanka',
      isTeam: !!isTeam,
    });

    // 4. Send email via Nodemailer if not a team
    let emailStatus = isTeam ? 'skipped' : 'sent';
    let emailError = null;

    if (!isTeam) {
      try {
        const subject = 'Your AppZ Makers Account Credentials';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hello ${contact || name},</p>
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
      } catch (emailErr) {
        console.error('Error occurred while sending email via Nodemailer:', emailErr.message);
        emailStatus = 'error';
        emailError = emailErr.message;
      }
    }

    res.status(201).json({
      message: isTeam 
        ? 'Lead assigned successfully.'
        : (emailStatus === 'sent'
          ? 'Client created successfully and credentials emailed.'
          : `Client created successfully, but email failed: ${emailError}`),
      company: toCompanyJSON(newComp),
      password: plainPassword,
      emailStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const empId = emp.legacyId || emp._id.toString();

    // Delete linked login User credentials
    if (emp.userId) {
      await User.deleteOne({ _id: emp.userId });
    } else {
      await User.deleteOne({ email: emp.email.toLowerCase() });
    }

    await Employee.deleteOne({ _id: emp._id });
    await LeaveBalance.deleteOne({ employeeId: empId });
    await LeaveRequest.deleteMany({ employeeId: empId });
    await Attendance.deleteMany({ employeeId: empId });
    await syncCompanyEmployeeCounts();

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHR = async (req, res) => {
  try {
    const hr = await findHRUser(req.params.id);
    if (!hr) return res.status(404).json({ error: 'HR user not found' });

    // Delete linked login User credentials
    if (hr.userId) {
      await User.deleteOne({ _id: hr.userId });
    } else {
      await User.deleteOne({ email: hr.email.toLowerCase() });
    }

    await HRUser.deleteOne({ _id: hr._id });
    res.json({ message: 'HR user deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const comp = await findCompany(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    const cid = comp.legacyId || comp._id.toString();
    await Employee.updateMany({ companyId: cid }, { companyId: null, company: 'Our Company' });
    await Company.deleteOne({ _id: comp._id });
    await syncCompanyEmployeeCounts();

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    res.json(await fetchSystemSettings());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const newSettings = req.body;
    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;

    if (newSettings.morningShiftStartTime !== undefined) {
      const val = String(newSettings.morningShiftStartTime || '').trim();
      if (!val || !timeRegex.test(val)) {
        return res.status(400).json({ error: 'Invalid Morning Shift Start Time format. Must be HH:MM (00:00 - 23:59).' });
      }
    }

    if (newSettings.nightShiftStartTime !== undefined) {
      const val = String(newSettings.nightShiftStartTime || '').trim();
      if (!val || !timeRegex.test(val)) {
        return res.status(400).json({ error: 'Invalid Night Shift Start Time format. Must be HH:MM (00:00 - 23:59).' });
      }
    }

    if (newSettings.breakTime !== undefined) {
      const num = Number(newSettings.breakTime);
      if (isNaN(num) || num < 0 || num > 24) {
        return res.status(400).json({ error: 'Daily meal break time must be between 0 and 24 hours.' });
      }
    }

    if (newSettings.workHours !== undefined) {
      const num = Number(newSettings.workHours);
      if (isNaN(num) || num <= 0 || num > 24) {
        return res.status(400).json({ error: 'Standard daily work hours must be between 0.5 and 24 hours.' });
      }
    }

    if (newSettings.mealBreaksMax !== undefined) {
      const num = Number(newSettings.mealBreaksMax);
      if (isNaN(num) || num < 1 || num > 20) {
        return res.status(400).json({ error: 'Meal breaks limit must be between 1 and 20.' });
      }
    }

    if (newSettings.teaBreaksMax !== undefined) {
      const num = Number(newSettings.teaBreaksMax);
      if (isNaN(num) || num < 0 || num > 20) {
        return res.status(400).json({ error: 'Tea breaks limit must be between 0 and 20.' });
      }
    }

    if (newSettings.teaBreakDuration !== undefined) {
      const num = Number(newSettings.teaBreakDuration);
      if (isNaN(num) || num < 1 || num > 480) {
        return res.status(400).json({ error: 'Tea break duration must be between 1 and 480 minutes.' });
      }
    }

    if (newSettings.teaBreakGap !== undefined) {
      const num = Number(newSettings.teaBreakGap);
      if (isNaN(num) || num < 0 || num > 1440) {
        return res.status(400).json({ error: 'Gap between tea breaks must be between 0 and 1440 minutes.' });
      }
    }

    if (newSettings.gameTimeLimitMinutes !== undefined) {
      const num = Number(newSettings.gameTimeLimitMinutes);
      if (isNaN(num) || num < 1 || num > 1440) {
        return res.status(400).json({ error: 'Daily game time limit must be between 1 and 1440 minutes.' });
      }
    }

    if (newSettings.gameCooldownMinutes !== undefined) {
      const num = Number(newSettings.gameCooldownMinutes);
      if (isNaN(num) || num < 0 || num > 1440) {
        return res.status(400).json({ error: 'Game cooldown must be between 0 and 1440 minutes.' });
      }
    }

    if (newSettings.sessionTimeout !== undefined) {
      const num = Number(newSettings.sessionTimeout);
      if (isNaN(num) || num < 1 || num > 1440) {
        return res.status(400).json({ error: 'Session timeout must be between 1 and 1440 minutes.' });
      }
    }

    if (newSettings.leaveAllocations?.medical !== undefined) {
      const num = Number(newSettings.leaveAllocations.medical);
      if (isNaN(num) || num < 0 || num > 365) {
        return res.status(400).json({ error: 'Medical leave allocation must be between 0 and 365 days.' });
      }
    }

    const current = await fetchSystemSettings();
    const merged = { ...current };

    Object.keys(newSettings).forEach((key) => {
      if (key !== 'leaveAllocations') {
        merged[key] = newSettings[key];
      }
    });

    if (newSettings.leaveAllocations) {
      merged.leaveAllocations = {
        ...merged.leaveAllocations,
        ...newSettings.leaveAllocations,
      };

      const medicalTotal = Number(merged.leaveAllocations.medical);

      const balances = await LeaveBalance.find();
      for (const balance of balances) {
        balance.medical = balance.medical || { total: 0, used: 0 };
        balance.medical.total = medicalTotal;
        await balance.save();
      }
    }

    const settings = await updateSettingsDoc(merged);
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { name, email, position, department, joinDate, dateOfBirth, address, country, teaBreakAllowed, shift } = req.body;

    if (shift !== undefined) {
      if (!['morning', 'night'].includes(shift)) {
        return res.status(400).json({ error: 'Shift must be either morning or night.' });
      }
      emp.shift = shift;
    }

    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 30) {
        return res.status(400).json({ error: 'Name must be between 2 and 30 characters long.' });
      }
      if (!/^[a-zA-Z\s.\-]+$/.test(name)) {
        return res.status(400).json({ error: 'Name contains invalid characters.' });
      }
      emp.name = name;
      if (emp.userId) {
        await User.updateOne({ _id: emp.userId }, { name });
      }
    }
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      const emailLower = email.toLowerCase();
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        const isSelf = (emp.userId && String(existingUser._id) === String(emp.userId)) ||
                       (existingUser.profileId && existingUser.profileId === emp.legacyId) ||
                       (existingUser.email.toLowerCase() === emp.email.toLowerCase());
        if (!isSelf) {
          return res.status(400).json({ error: 'This email address is already registered.' });
        }
      }

      emp.email = emailLower;
      if (emp.userId) {
        await User.updateOne({ _id: emp.userId }, { email: emailLower });
      }
    }
    if (position !== undefined) {
      if (position.trim().length < 2 || position.trim().length > 20) {
        return res.status(400).json({ error: 'Position must be between 2 and 20 characters long.' });
      }
      if (!/^[a-zA-Z\s.\-()&/,]+$/.test(position)) {
        return res.status(400).json({ error: 'Position contains invalid characters.' });
      }
      emp.position = position;
    }
    if (department !== undefined) {
      if (department.trim().length < 2 || department.trim().length > 20) {
        return res.status(400).json({ error: 'Department must be between 2 and 20 characters long.' });
      }
      if (!/^[a-zA-Z\s.\-()&/,]+$/.test(department)) {
        return res.status(400).json({ error: 'Department contains invalid characters.' });
      }
      emp.department = standardizeDepartment(department);
    }
    if (address !== undefined) {
      if (address.trim().length < 5 || address.trim().length > 50) {
        return res.status(400).json({ error: 'Address must be between 5 and 50 characters long.' });
      }
      emp.address = address;
    }
    if (country !== undefined) {
      if (country.trim() === '') {
        return res.status(400).json({ error: 'Working location (country) is required.' });
      }
      emp.country = country;
    }
    if (joinDate !== undefined) {
      if (!joinDate) {
        return res.status(400).json({ error: 'Join date is required.' });
      }
      const today = new Date().toISOString().split('T')[0];
      if (joinDate > today) {
        return res.status(400).json({ error: 'Join date cannot be a future date.' });
      }
      emp.joinDate = joinDate;
    }
    if (dateOfBirth !== undefined) emp.dateOfBirth = dateOfBirth;
    if (teaBreakAllowed !== undefined) emp.teaBreakAllowed = teaBreakAllowed;

    await emp.save();
    res.json({ message: 'Employee updated successfully', employee: toEmployeeJSON(emp) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHR = async (req, res) => {
  try {
    const hr = await findHRUser(req.params.id);
    if (!hr) return res.status(404).json({ error: 'HR User not found' });

    const { name, email, department, joinDate, dateOfBirth } = req.body;

    const today = new Date().toISOString().split('T')[0];
    if (joinDate && joinDate > today) {
      return res.status(400).json({ error: 'Join date cannot be a future date.' });
    }

    if (name !== undefined) {
      hr.name = name;
      if (hr.userId) {
        await User.updateOne({ _id: hr.userId }, { name });
      }
    }
    if (email !== undefined) {
      const emailLower = email.toLowerCase();
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        const isSelf = (hr.userId && String(existingUser._id) === String(hr.userId)) ||
                       (existingUser.profileId && existingUser.profileId === hr.legacyId) ||
                       (existingUser.email.toLowerCase() === hr.email.toLowerCase());
        if (!isSelf) {
          return res.status(400).json({ error: 'This email address is already registered.' });
        }
      }

      hr.email = emailLower;
      if (hr.userId) {
        await User.updateOne({ _id: hr.userId }, { email: emailLower });
      }
    }
    if (department !== undefined) hr.department = standardizeDepartment(department);
    if (joinDate !== undefined) hr.joinDate = joinDate;
    if (dateOfBirth !== undefined) hr.dateOfBirth = dateOfBirth;

    await hr.save();
    res.json({ message: 'HR User updated successfully', hrUser: toHRJSON(hr) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const comp = await findCompany(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    const { name, industry, contact, email, phone, joinedDate, joinDate, address, country, teaBreakAllowed, isTeam } = req.body;

    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 30) {
        return res.status(400).json({ error: 'Company name must be between 2 and 30 characters long.' });
      }
      comp.name = name;
    }
    if (industry !== undefined) {
      if (industry.trim().length < 2 || industry.trim().length > 30) {
        return res.status(400).json({ error: 'Industry sector must be between 2 and 30 characters long.' });
      }
      comp.industry = industry;
    }
    if (contact !== undefined) {
      if (contact.trim().length < 2 || contact.trim().length > 30) {
        return res.status(400).json({ error: 'Contact person must be between 2 and 30 characters long.' });
      }
      comp.contact = contact;
    }
    if (phone !== undefined) comp.phone = phone;
    if (joinedDate !== undefined) comp.joinedDate = joinedDate;
    else if (joinDate !== undefined) comp.joinedDate = joinDate;
    if (address !== undefined) comp.address = address;
    if (country !== undefined) comp.country = country;
    if (teaBreakAllowed !== undefined) comp.teaBreakAllowed = teaBreakAllowed;
    if (isTeam !== undefined) comp.isTeam = isTeam;

    if (email !== undefined) {
      const emailLower = email.toLowerCase();
      const linkedUser = await User.findOne({ email: comp.email.toLowerCase() });
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        const isSelf = (linkedUser && String(existingUser._id) === String(linkedUser._id)) ||
                       (existingUser.profileId && existingUser.profileId === comp.legacyId) ||
                       (existingUser.email.toLowerCase() === comp.email.toLowerCase());
        if (!isSelf && !isTeam) {
          return res.status(400).json({ error: 'This email address is already registered.' });
        }
      }

      if (linkedUser) {
        linkedUser.name = name || linkedUser.name;
        linkedUser.email = emailLower;
        await linkedUser.save();
      }
      comp.email = emailLower;
    }

    await comp.save();
    res.json({ message: 'Company updated successfully', company: toCompanyJSON(comp) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Admin User not found' });
    res.json({ admin: user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Admin User not found' });

    const { name, email, password, avatar } = req.body;

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      admin: user.toSafeJSON(),
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

    const emp = await Employee.findById(req.params.id);
    if (!emp && req.params.id.startsWith('emp_')) {
      const matched = await Employee.findOne({ legacyId: req.params.id });
      if (matched) {
        matched.status = status;
        await matched.save();
        return res.json({
          message: `Employee account status updated to ${status} successfully.`,
          employee: { id: matched.legacyId, status: matched.status },
        });
      }
    }
    
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    emp.status = status;
    await emp.save();

    res.json({
      message: `Employee account status updated to ${status} successfully.`,
      employee: { id: emp.legacyId || emp._id.toString(), status: emp.status },
    });
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

// ==========================================
// KNOWLEDGE SHARING SESSION CONTROLLERS
// ==========================================

export const getSessions = async (req, res) => {
  try {
    const sessions = await KnowledgeSession.find().sort({ date: -1, time: -1 }).lean();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const { title, conductor, date, time, meetingLink, participants, createdBy, sessionType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Session topic/heading is required.' });
    }
    if (!conductor || !conductor.trim()) {
      return res.status(400).json({ error: 'Conductor name is required.' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Session date is required.' });
    }
    if (!time) {
      return res.status(400).json({ error: 'Session time is required.' });
    }

    const session = await KnowledgeSession.create({
      title: title.trim(),
      conductor: conductor.trim(),
      date,
      time,
      meetingLink: meetingLink || '',
      participants: participants || [],
      sessionType: sessionType || 'knowledge-sharing',
      createdBy: createdBy || 'Admin',
    });

    res.status(201).json({ message: 'Knowledge session created successfully.', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await KnowledgeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const { title, conductor, date, time, meetingLink, participants, sessionType } = req.body;

    if (title !== undefined) session.title = title.trim();
    if (conductor !== undefined) session.conductor = conductor.trim();
    if (date !== undefined) session.date = date;
    if (time !== undefined) session.time = time;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (participants !== undefined) session.participants = participants;
    if (sessionType !== undefined) session.sessionType = sessionType;

    await session.save();
    res.json({ message: 'Knowledge session updated successfully.', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await KnowledgeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    await KnowledgeSession.deleteOne({ _id: session._id });
    res.json({ message: 'Knowledge session deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeSessions = async (req, res) => {
  try {
    const empId = req.params.id;
    const sessions = await KnowledgeSession.find({
      participants: empId,
    }).sort({ date: 1, time: 1 }).lean();

    const withMyStatus = sessions.map((session) => {
      const myResponse = (session.responses || []).find((r) => r.employeeId === empId);
      const { responses, ...rest } = session;
      return { ...rest, myResponseStatus: myResponse ? myResponse.status : 'pending' };
    });

    res.json(withMyStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const respondToSession = async (req, res) => {
  try {
    const { id: empId, sessionId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'." });
    }

    const session = await KnowledgeSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    if (!session.participants.includes(empId)) {
      return res.status(403).json({ error: 'You are not a participant of this session.' });
    }

    const existing = session.responses.find((r) => r.employeeId === empId);
    if (existing) {
      existing.status = status;
      existing.respondedAt = new Date();
    } else {
      session.responses.push({ employeeId: empId, status, respondedAt: new Date() });
    }

    await session.save();
    res.json({ message: `Session ${status}.`, myResponseStatus: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
