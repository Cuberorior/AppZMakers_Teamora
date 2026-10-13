import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import Attendance from './models/Attendance.js';
import SystemSettings from './models/SystemSettings.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const emp = await Employee.findOne({ email: 'nilusana07gobalakrishnar@gmail.com' });
  const attendance = await Attendance.findOne({
    employeeId: { $in: [emp._id, emp.legacyId] },
    checkOut: null,
    status: { $ne: 'absent' }
  });
  const settings = await SystemSettings.findOne();
  const departmentRules = settings?.departmentOvertimeRules || [];
  
  const rule = departmentRules.find(r => r.department === emp.department);
  console.log('Rule:', rule); console.log('OvertimeState:', attendance.overtimeState);
  
  const now = new Date();
  const nowMs = now.getTime();
  
  if (attendance.checkIn) {
     const checkInDateStr = attendance.date + 'T' + attendance.checkIn;
     const checkInDate = new Date(checkInDateStr);
     let totalElapsed = (nowMs - checkInDate.getTime()) / 1000;
     
     let totalBreakSecs = attendance.breakMinutes * 60;
     let sessionSecs = totalElapsed - totalBreakSecs;
     
     const elapsedHours = sessionSecs / 3600;
     
     const baseWorkHours = 8;
     const confirmedHours = attendance.overtimeState?.confirmedHours || 0;
     const intervalHours = rule.intervalMinutes / 60;
     const targetThreshold = baseWorkHours + confirmedHours + intervalHours;
     
     console.log('CheckIn Date Str:', checkInDateStr);
     console.log('CheckIn Date Obj:', checkInDate);
     console.log('Now:', now);
     console.log('Elapsed Hours:', elapsedHours);
     console.log('Target Threshold:', targetThreshold);
     console.log('Would trigger?', elapsedHours >= targetThreshold);
  }
  process.exit(0);
});
