import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from '../models/Attendance.js';
import { getSettings } from '../services/settingsService.js';
import { finalizeClockOut } from '../utils/attendanceMath.js';

dotenv.config();

const run = async () => {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  const settings = await getSettings();
  console.log('System settings retrieved:', settings);

  const records = await Attendance.find({ checkOut: { $ne: null } });
  console.log(`Found ${records.length} records to process.`);

  let updatedCount = 0;
  for (const record of records) {
    const oldTotal = record.totalHours;
    const oldLess = record.lessHours;
    const oldExtra = record.extraHours;

    // Recalculate using the new rule
    finalizeClockOut(record, record.checkOut, settings);
    
    if (record.totalHours !== oldTotal || record.lessHours !== oldLess || record.extraHours !== oldExtra) {
      await record.save();
      console.log(`Updated Date: ${record.date} for Employee ${record.employeeId}:`);
      console.log(`  Old -> Total: ${oldTotal}h, Less: ${oldLess}h, Extra: ${oldExtra}h`);
      console.log(`  New -> Total: ${record.totalHours}h, Less: ${record.lessHours}h, Extra: ${record.extraHours}h`);
      updatedCount++;
    }
  }

  console.log(`Recalculation complete. Updated ${updatedCount} records.`);
  await mongoose.disconnect();
};

run().catch(console.error);
