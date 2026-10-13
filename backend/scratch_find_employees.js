import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const emps = await Employee.find({});
  console.log('Employees:', emps.map(e => ({ id: e._id, legacyId: e.legacyId, name: e.name, country: e.country })));
  await mongoose.disconnect();
}

run().catch(console.error);
