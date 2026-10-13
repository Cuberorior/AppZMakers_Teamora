import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const emp = await Employee.findOne({ name: /Thanushan/i });
  console.log('Employee:', emp);
  if (emp) {
    const att = await Attendance.find({ employeeId: emp.legacyId || emp._id.toString() });
    console.log('Attendance Records:', att);
  }
  await mongoose.disconnect();
};

run().catch(console.error);
