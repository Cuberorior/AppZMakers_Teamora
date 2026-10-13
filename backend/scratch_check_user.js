import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Employee from './models/Employee.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({});
  console.log('Users in DB:');
  for (const u of users) {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, ProfileId: ${u.profileId}, _id: ${u._id}`);
  }

  const emps = await Employee.find({});
  console.log('\nEmployees in DB:');
  for (const e of emps) {
    console.log(`- Name: ${e.name}, Email: ${e.email}, legacyId: ${e.legacyId}, userId: ${e.userId}, _id: ${e._id}, Country: ${e.country}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
