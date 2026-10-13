import Employee from '../models/Employee.js';
import HRUser from '../models/HRUser.js';
import Company from '../models/Company.js';

export const normalizeRole = (role) => {
  if (role === 'admin') return 'superadmin';
  return role;
};

export const resolveProfileId = async (user) => {
  const role = normalizeRole(user.role);

  if (user.profileId) {
    return user.profileId;
  }

  const email = user.email?.toLowerCase();
  if (!email) return null;

  if (role === 'employee') {
    let emp = await Employee.findOne({ email }).select('_id legacyId');
    if (emp) return emp.legacyId || emp._id.toString();
    const firstName = user.name?.split(' ')[0]?.toLowerCase();
    if (firstName) {
      emp = await Employee.findOne({ name: new RegExp(`^${firstName}`, 'i') }).select('_id legacyId');
      if (emp) return emp.legacyId || emp._id.toString();
    }
    return null;
  }

  if (role === 'hr') {
    const hr = await HRUser.findOne({ email }).select('_id legacyId');
    return hr ? hr.legacyId || hr._id.toString() : null;
  }

  if (role === 'company') {
    const co = await Company.findOne({ email }).select('_id legacyId');
    return co ? co.legacyId || co._id.toString() : null;
  }

  return null;
};
