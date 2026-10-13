import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { connectDatabase } from './config/db.js';
import User from './models/User.js';

async function run() {
  await connectDatabase();
  console.log("DB connected");
  
  console.log("Counting users...");
  try {
    const count = await User.countDocuments();
    console.log("Users count:", count);
  } catch (e) {
    console.error("Error:", e);
  }
  
  process.exit(0);
}

run();
