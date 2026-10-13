// Authentication Controller
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import HRUser from '../models/HRUser.js';
import Attendance from '../models/Attendance.js';
import crypto from 'crypto';
import Company from '../models/Company.js';
import LeaveBalance from '../models/LeaveBalance.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { resolveProfileId, normalizeRole } from '../utils/resolveProfile.js';
import { getSettings } from '../services/settingsService.js';
import { getEmployeeLegacyId, getNextEmployeeLegacyId, getNextHRLegacyId, getNextCompanyLegacyId } from '../utils/entityLookup.js';
import { sendEmail } from '../services/emailService.js';

const VALID_ROLES = ['employee', 'hr', 'company', 'superadmin'];

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: normalizeRole(user.role) },
    process.env.SECRET_KEY || 'dev_secret_change_me',
    { expiresIn: '7d' }
  );

const buildAuthResponse = async (user) => {
  const role = normalizeRole(user.role);
  const profileId = await resolveProfileId(user);
  const settings = await getSettings();

  const payload = {
    email: user.email,
    name: user.name,
    role,
    token: signToken(user),
    avatar: user.avatar || '',
    sessionTimeout: settings.sessionTimeout,
  };

  if (role === 'company' && profileId) {
    payload.userId = profileId;
    const co = await Company.findOne({ $or: [{ legacyId: profileId }] }).collation({ locale: 'en', strength: 2 }).catch(() => null);
    const companyDoc = co || await Company.findById(profileId).catch(() => null);
    if (companyDoc) {
      payload.isTeam = !!companyDoc.isTeam;
    }
  } else if (role !== 'superadmin' && profileId) {
    payload.userId = profileId;
  } else if (role === 'superadmin') {
    payload.userId = user._id.toString();
  }

  return payload;
};

const linkProfileOnRegister = async (user, role) => {
  const email = user.email.toLowerCase();
  const settings = await getSettings();

  if (role === 'employee') {
    let emp = await Employee.findOne({ email }).select('_id legacyId');
    if (!emp) {
      const legacyId = await getNextEmployeeLegacyId();
      emp = await Employee.create({
        legacyId,
        name: user.name,
        email,
        position: 'Staff',
        department: 'General',
        company: 'General',
        avatar: user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        userId: user._id,
      });
      await LeaveBalance.create({
        employeeId: getEmployeeLegacyId(emp),
        annual: { total: settings.leaveAllocations?.annual || 15, used: 0 },
        casual: { total: settings.leaveAllocations?.casual || 10, used: 0 },
        medical: { total: settings.leaveAllocations?.medical || 10, used: 0 },
      });
    }
    user.profileId = getEmployeeLegacyId(emp);
    await user.save();
    return user.profileId;
  }

  if (role === 'hr') {
    let hr = await HRUser.findOne({ email }).select('_id legacyId');
    if (!hr) {
      const legacyId = await getNextHRLegacyId();
      hr = await HRUser.create({
        legacyId,
        name: user.name,
        email,
        userId: user._id,
      });
    }
    user.profileId = hr.legacyId || hr._id.toString();
    await user.save();
    return user.profileId;
  }

  if (role === 'company') {
    let co = await Company.findOne({ email }).select('_id legacyId');
    if (!co) {
      const legacyId = await getNextCompanyLegacyId();
      co = await Company.create({
        legacyId,
        name: `${user.name} Company`,
        email,
        contact: user.name,
        industry: 'General',
      });
    }
    user.profileId = co.legacyId || co._id.toString();
    await user.save();
    return user.profileId;
  }

  return null;
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [employee, hr, company, superadmin] }
 *               profileId: { type: string, description: "Optional emp001 / hr001 / co001" }
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Validation error
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, profileId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const normalizedRole = normalizeRole(role);
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
      profileId: profileId || null,
    });

    await linkProfileOnRegister(user, normalizedRole);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toSafeJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, description: "Optional — must match account role if provided" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req, res) => {
  try {
    const { email, password, role: selectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let accountRole = normalizeRole(user.role);

    if (selectedRole && normalizeRole(selectedRole) !== accountRole) {
      if (accountRole === 'employee' && normalizeRole(selectedRole) === 'company') {
        const leadCompany = await Company.findOne({ email: user.email.toLowerCase(), isTeam: true });
        if (leadCompany) {
          accountRole = 'company';
          user.role = 'company';
          user.profileId = leadCompany.legacyId || leadCompany._id.toString();
        } else {
          return res.status(403).json({
            error: `This account is registered as an Employee. You are not assigned as a Lead for any team.`,
          });
        }
      } else {
        return res.status(403).json({
          error: `This account is registered as ${accountRole}. Please select the correct role.`,
        });
      }
    }

    if (accountRole === 'employee') {
      const emp = await Employee.findOne({ email: user.email.toLowerCase() }).select('status legacyId _id');
      if (emp && emp.status === 'inactive') {
        return res.status(403).json({
          error: 'Your account has been deactivated. Please contact HR.',
        });
      }

      if (emp) {
        const empId = emp.legacyId || emp._id.toString();
        const pendingRecord = await Attendance.findOne({ employeeId: empId, checkOut: null });
        
        if (pendingRecord && pendingRecord.date && pendingRecord.checkIn) {
          let checkInMs;
          if (pendingRecord.createdAt) {
            checkInMs = pendingRecord.createdAt.getTime();
          } else {
            const dateTimeStr = `${pendingRecord.date}T${pendingRecord.checkIn}`;
            checkInMs = new Date(dateTimeStr).getTime();
          }
          
          if (!isNaN(checkInMs)) {
            const elapsedHours = (Date.now() - checkInMs) / (1000 * 60 * 60);
            if (elapsedHours > 24) {
              return res.status(403).json({
                error: 'You did not checkout properly. Please contact your HR. After check out process complete you can login again.',
                requiresForceCheckout: true
              });
            }
          }
        }
      }
    }

    res.json(await buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // To prevent account enumeration attacks, always say reset link sent
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send email via Nodemailer
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello ${user.name},</p>
        <p>We received a request to reset the password for your AppZ Makers account.</p>
        <p>To create a new password, please click the button below:</p>
        <br>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <br><br>
        <p>This password reset link will expire in <strong>1 hour</strong> for security reasons.</p>
        <p>If you did not request a password reset, you can safely ignore this email. Your account will remain secure, and no changes will be made.</p>
        <p>For your security, AppZ Makers will never ask you to share your password, reset links, or other account details through email.</p>
        <p>Thank you for using AppZ Makers.</p>
        <p>Best regards,<br><strong>AppZ Makers Team</strong></p>
      </div>
    `;

    try {
      await sendEmail(user.email.toLowerCase(), subject, html);
    } catch (emailErr) {
      console.error('Error occurred while sending forgot password email via Nodemailer:', emailErr.message);
    }

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    res.json({ valid: true, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
