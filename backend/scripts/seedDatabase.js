import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Company from '../models/Company.js';
import HRUser from '../models/HRUser.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import SystemSettings from '../models/SystemSettings.js';
import { connectDatabase } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const companies = [
  { legacyId: 'co001', name: 'TechVentures Ltd', industry: 'Technology', contact: 'Mark Reynolds', email: 'mark@techventures.com', phone: '+1 (555) 100-2000', employeeCount: 3, status: 'active', joinedDate: '2023-01-10' },
  { legacyId: 'co002', name: 'BuildCraft Inc', industry: 'Construction', contact: 'Diana Lee', email: 'diana@buildcraft.com', phone: '+1 (555) 200-3000', employeeCount: 2, status: 'active', joinedDate: '2023-03-22' },
  { legacyId: 'co003', name: 'MediCare Solutions', industry: 'Healthcare', contact: 'Robert Chen', email: 'robert@medicare.com', phone: '+1 (555) 300-4000', employeeCount: 2, status: 'active', joinedDate: '2022-11-05' },
  { legacyId: 'co004', name: 'EduFirst Academy', industry: 'Education', contact: 'Priya Patel', email: 'priya@edufirst.com', phone: '+1 (555) 400-5000', employeeCount: 0, status: 'inactive', joinedDate: '2023-06-14' },
];

const hrUsers = [
  { legacyId: 'hr001', name: 'Amanda Foster', email: 'amanda.foster@hrm.com', department: 'Human Resources', status: 'active' },
  { legacyId: 'hr002', name: 'James Wilson', email: 'james.wilson@hrm.com', department: 'Human Resources', status: 'active' },
  { legacyId: 'hr003', name: 'Nina Kowalski', email: 'nina.k@hrm.com', department: 'Human Resources', status: 'inactive' },
];

const employees = [
  { legacyId: 'emp001', name: 'Sarah Johnson', email: 'sarah.j@techventures.com', position: 'Senior Developer', department: 'Engineering', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'SJ', joinDate: '2022-03-15', status: 'active', phone: '+1 (555) 234-5678', address: '142 Oak Street, Austin TX 78701' },
  { legacyId: 'emp001b', name: 'Sarah', email: 'sarah@techventures.com', position: 'Senior Developer', department: 'Engineering', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'S', joinDate: '2022-03-15', status: 'active', phone: '+1 (555) 234-5678', address: '142 Oak Street, Austin TX 78701' },
  { legacyId: 'emp002', name: 'Michael Torres', email: 'michael.t@techventures.com', position: 'UI/UX Designer', department: 'Design', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'MT', joinDate: '2021-08-20', status: 'active', phone: '+1 (555) 345-6789', address: '89 Pine Avenue, Austin TX 78702' },
  { legacyId: 'emp003', name: 'Emily Chen', email: 'emily.c@techventures.com', position: 'Product Manager', department: 'Product', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'EC', joinDate: '2020-11-10', status: 'active', phone: '+1 (555) 456-7890', address: '310 Elm Road, Austin TX 78703' },
  { legacyId: 'emp004', name: 'David Park', email: 'david.p@buildcraft.com', position: 'Project Lead', department: 'Operations', company: 'BuildCraft Inc', companyId: 'co002', avatar: 'DP', joinDate: '2023-01-05', status: 'active', phone: '+1 (555) 567-8901', address: '55 Maple Drive, Denver CO 80201' },
  { legacyId: 'emp005', name: 'Aisha Williams', email: 'aisha.w@buildcraft.com', position: 'Site Engineer', department: 'Engineering', company: 'BuildCraft Inc', companyId: 'co002', avatar: 'AW', joinDate: '2022-07-18', status: 'active', phone: '+1 (555) 678-9012', address: '77 Cedar Lane, Denver CO 80202' },
  { legacyId: 'emp006', name: 'Carlos Rivera', email: 'carlos.r@medicare.com', position: 'Data Analyst', department: 'Analytics', company: 'MediCare Solutions', companyId: 'co003', avatar: 'CR', joinDate: '2021-05-30', status: 'active', phone: '+1 (555) 789-0123', address: '201 Birch Blvd, Miami FL 33101' },
  { legacyId: 'emp007', name: 'Hannah Lee', email: 'hannah.l@medicare.com', position: 'Healthcare Coordinator', department: 'Operations', company: 'MediCare Solutions', companyId: 'co003', avatar: 'HL', joinDate: '2023-02-12', status: 'active', phone: '+1 (555) 890-1234', address: '456 Walnut St, Miami FL 33102' },
  { legacyId: 'emp008', name: 'James Okonkwo', email: 'james.o@techventures.com', position: 'DevOps Engineer', department: 'Engineering', company: 'Our Company', companyId: null, avatar: 'JO', joinDate: '2022-09-01', status: 'inactive', phone: '+1 (555) 901-2345', address: '90 Spruce Way, Austin TX 78704' },
];

const leaveBalances = [
  { employeeId: 'emp001', annual: { total: 15, used: 3 }, casual: { total: 10, used: 2 }, medical: { total: 10, used: 0 } },
  { employeeId: 'emp001b', annual: { total: 15, used: 0 }, casual: { total: 10, used: 0 }, medical: { total: 10, used: 0 } },
  { employeeId: 'emp002', annual: { total: 15, used: 7 }, casual: { total: 10, used: 3 }, medical: { total: 10, used: 3 } },
  { employeeId: 'emp003', annual: { total: 15, used: 2 }, casual: { total: 10, used: 1 }, medical: { total: 10, used: 2 } },
  { employeeId: 'emp004', annual: { total: 15, used: 5 }, casual: { total: 10, used: 4 }, medical: { total: 10, used: 5 } },
  { employeeId: 'emp005', annual: { total: 15, used: 1 }, casual: { total: 10, used: 0 }, medical: { total: 10, used: 0 } },
  { employeeId: 'emp006', annual: { total: 15, used: 4 }, casual: { total: 10, used: 2 }, medical: { total: 10, used: 2 } },
  { employeeId: 'emp007', annual: { total: 15, used: 0 }, casual: { total: 10, used: 1 }, medical: { total: 10, used: 0 } },
];

export const seedIfEmpty = async () => {
  const empCount = await Employee.countDocuments();
  if (empCount > 0) {
    console.log(`📦 Database already has ${empCount} employees — skip seed`);
    return false;
  }

  console.log('🌱 Seeding MongoDB with initial workforce data...');

  await Company.deleteMany({});
  await HRUser.deleteMany({});
  await Employee.deleteMany({});
  await LeaveBalance.deleteMany({});
  await LeaveRequest.deleteMany({});

  await Company.insertMany(companies);
  await HRUser.insertMany(hrUsers);
  await Employee.insertMany(employees);
  await LeaveBalance.insertMany(leaveBalances);

  await SystemSettings.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      workHours: '8 hours',
      breakTime: '1 hour',
      lateThreshold: '15 minutes',
      overtimeRate: '1.5x',
      sessionTimeout: '30 minutes',
      backupSchedule: 'Daily at 2 AM',
      leaveAllocations: { annual: 15, casual: 10, medical: 10 },
    },
    { upsert: true }
  );

  const sampleLeaves = [
    { employeeId: 'emp002', employeeName: 'Michael Torres', department: 'Design', type: 'medical', startDate: '2026-06-05', endDate: '2026-06-06', days: 2, reason: 'Severe migraine and fever.', status: 'pending', appliedOn: '2026-05-30' },
    { employeeId: 'emp003', employeeName: 'Emily Chen', department: 'Product', type: 'annual', startDate: '2026-06-10', endDate: '2026-06-14', days: 5, reason: 'Family vacation.', status: 'pending', appliedOn: '2026-05-28' },
  ];
  await LeaveRequest.insertMany(sampleLeaves);

  console.log('✅ Seed complete');
  return true;
};

if (process.argv[1]?.includes('seedDatabase')) {
  connectDatabase()
    .then(() => seedIfEmpty())
    .then(() => mongoose.disconnect())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
