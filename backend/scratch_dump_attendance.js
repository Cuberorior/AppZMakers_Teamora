import mongoose from 'mongoose';
import Attendance from './models/Attendance.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workforge');
  const records = await Attendance.find({}).lean();
  console.log(JSON.stringify(records, null, 2));
  await mongoose.disconnect();
}
run();
