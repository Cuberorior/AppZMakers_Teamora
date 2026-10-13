import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import HRUser from '../models/HRUser.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Attendance from '../models/Attendance.js';

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

export const findEmployee = async (id) => {
  if (!id) return null;
  if (id.includes('@')) {
    return Employee.findOne({ email: id.toLowerCase() });
  }
  if (isObjectId(id)) {
    let emp = await Employee.findById(id);
    if (!emp) emp = await Employee.findOne({ userId: id });
    return emp;
  }
  return Employee.findOne({ legacyId: id });
};

export const findCompany = async (id) => {
  if (!id) return null;
  if (id.includes('@')) {
    return Company.findOne({ email: id.toLowerCase() });
  }
  if (isObjectId(id)) {
    let co = await Company.findById(id);
    if (!co) co = await Company.findOne({ userId: id });
    return co;
  }
  return Company.findOne({ legacyId: id });
};

export const findHRUser = async (id) => {
  if (!id) return null;
  if (id.includes('@')) {
    return HRUser.findOne({ email: id.toLowerCase() });
  }
  if (isObjectId(id)) {
    let hr = await HRUser.findById(id);
    if (!hr) hr = await HRUser.findOne({ userId: id });
    return hr;
  }
  return HRUser.findOne({ legacyId: id });
};

export const findLeave = async (id) => {
  if (!id) return null;
  return LeaveRequest.findById(id);
};

export const getEmployeeLegacyId = (emp) => emp?.legacyId || emp?._id?.toString();

export const getCompanyLegacyId = (co) => co?.legacyId || co?._id?.toString();

export const getNextEmployeeLegacyId = async () => {
  const lastEmp = await Employee.findOne({ legacyId: /^emp\d+$/ }).sort({ legacyId: -1 });
  if (!lastEmp || !lastEmp.legacyId) return 'emp001';
  const num = parseInt(lastEmp.legacyId.replace('emp', ''), 10);
  return `emp${String(num + 1).padStart(3, '0')}`;
};

export const getNextHRLegacyId = async () => {
  const lastHR = await HRUser.findOne({ legacyId: /^hr\d+$/ }).sort({ legacyId: -1 });
  if (!lastHR || !lastHR.legacyId) return 'hr001';
  const num = parseInt(lastHR.legacyId.replace('hr', ''), 10);
  return `hr${String(num + 1).padStart(3, '0')}`;
};

export const getNextCompanyLegacyId = async () => {
  const lastCo = await Company.findOne({ legacyId: /^co\d+$/ }).sort({ legacyId: -1 });
  if (!lastCo || !lastCo.legacyId) return 'co001';
  const num = parseInt(lastCo.legacyId.replace('co', ''), 10);
  return `co${String(num + 1).padStart(3, '0')}`;
};
