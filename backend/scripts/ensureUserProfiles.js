/**
 * Links existing User accounts to Employee/HR/Company records by email.
 * Runs after seed on every startup when employees already exist.
 */
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import HRUser from '../models/HRUser.js';
import Company from '../models/Company.js';
import LeaveBalance from '../models/LeaveBalance.js';
import { getSettings } from '../services/settingsService.js';
import {
  getEmployeeLegacyId,
  getNextEmployeeLegacyId,
  getNextHRLegacyId,
  getNextCompanyLegacyId,
} from '../utils/entityLookup.js';

export const ensureUserProfiles = async () => {
  const users = await User.find().select('name email role profileId');
  const settings = await getSettings();

  await Promise.all(users.map(async (user) => {
    const email = user.email.toLowerCase();

    if (user.role === 'employee') {
      let emp = await Employee.findOne({ email }).select('_id legacyId');
      if (!emp) {
        const legacyId = await getNextEmployeeLegacyId();
        emp = await Employee.create({
          legacyId,
          name: user.name,
          email,
          position: 'Staff',
          department: 'General',
          company: 'Our Company',
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
      const newProfileId = getEmployeeLegacyId(emp);
      if (user.profileId !== newProfileId) {
        user.profileId = newProfileId;
        await user.save();
      }
    }

    if (user.role === 'hr') {
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
      const newProfileId = hr.legacyId || hr._id.toString();
      if (user.profileId !== newProfileId) {
        user.profileId = newProfileId;
        await user.save();
      }
    }

    if (user.role === 'company') {
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
      const newProfileId = co.legacyId || co._id.toString();
      if (user.profileId !== newProfileId) {
        user.profileId = newProfileId;
        await user.save();
      }
    }
  }));
};
