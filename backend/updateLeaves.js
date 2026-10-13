import mongoose from 'mongoose';
import LeaveRequest from './models/LeaveRequest.js';
import dotenv from 'dotenv';
dotenv.config();

async function updateDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await LeaveRequest.updateMany(
    { rejectionReason: /Auto-rejected/i },
    { $set: { rejectionReason: 'Expired: Leave date has passed without approval.' } }
  );
  console.log('Updated:', res);
  process.exit(0);
}
updateDB();
