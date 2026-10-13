import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import Attendance from './models/Attendance.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const emp = await Employee.findOne({ email: 'gajan@gmail.com' });
  const att = await Attendance.findOne({
    employeeId: { $in: [emp._id, emp.legacyId] },
    checkOut: null,
    status: { $ne: 'absent' }
  });
  console.log('Attendance:', JSON.stringify(att, null, 2));
  process.exit(0);
});
