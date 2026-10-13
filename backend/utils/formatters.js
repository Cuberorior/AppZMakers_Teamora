/** Shape Mongoose documents for frontend (expects `id` string fields). */
import { standardizeDepartment } from './helpers.js';

export const toEmployeeJSON = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o.legacyId || o._id?.toString(),
    _id: o._id?.toString(),
    name: o.name,
    email: o.email,
    position: o.position,
    department: standardizeDepartment(o.department),
    company: o.company,
    companyId: o.companyId,
    team: o.team,
    teamId: o.teamId,
    avatar: o.avatar,
    joinDate: o.joinDate,
    status: o.status,
    phone: o.phone,
    address: o.address,
    cvName: o.cvName,
    cvData: o.cvData,
    country: o.country,
    office: o.office,
    teaBreakAllowed: o.teaBreakAllowed,
    dateOfBirth: o.dateOfBirth,
    shift: o.shift,
  };
};

export const toCompanyJSON = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o.legacyId || o._id?.toString(),
    name: o.name,
    industry: o.industry,
    contact: o.contact,
    email: o.email,
    phone: o.phone,
    employeeCount: o.employeeCount,
    status: o.status,
    joinedDate: o.joinedDate,
    address: o.address,
    country: o.country,
    avatar: o.avatar || '',
    teaBreakAllowed: o.teaBreakAllowed,
    isTeam: o.isTeam,
  };
};

export const toHRJSON = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o.legacyId || o._id?.toString(),
    name: o.name,
    email: o.email,
    department: standardizeDepartment(o.department),
    status: o.status,
    joinDate: o.joinDate,
    avatar: o.avatar || '',
    dateOfBirth: o.dateOfBirth,
  };
};

export const toAttendanceJSON = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id?.toString(),
    employeeId: o.employeeId,
    date: o.date,
    checkIn: o.checkIn,
    checkOut: o.checkOut,
    checkOutDate: o.checkOutDate,
    status: o.status,
    totalHours: o.totalHours,
    breakMinutes: o.breakMinutes,
    extraHours: o.extraHours,
    lessHours: o.lessHours,
    onBreak: o.onBreak,
    onTeaBreak: o.onTeaBreak,
    onTeaExceed: o.onTeaExceed,
    breaks: o.breaks,
    adjusted: o.adjusted,
    adjustedBy: o.adjustedBy,
    adjustedReason: o.adjustedReason,
    tasks: o.tasks || [],
    overtimeState: o.overtimeState || { status: 'idle', confirmedHours: 0, nextConfirmDueAt: null },
  };
};

export const toLeaveJSON = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id?.toString(),
    employeeId: o.employeeId,
    employeeName: o.employeeName,
    department: standardizeDepartment(o.department),
    type: o.type,
    startDate: o.startDate,
    endDate: o.endDate,
    days: o.days,
    reason: o.reason,
    status: o.status,
    appliedOn: o.appliedOn,
    hrNote: o.hrNote,
    rejectionReason: o.rejectionReason,
    cancelledBy: o.cancelledBy,
  };
};

export const toLeaveBalanceJSON = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    employeeId: o.employeeId,
    annual: o.annual,
    casual: o.casual,
    medical: o.medical,
  };
};
