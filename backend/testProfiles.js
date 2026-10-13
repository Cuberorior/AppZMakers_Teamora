import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './config/db.js';
import { ensureUserProfiles } from './scripts/ensureUserProfiles.js';

async function run() {
  await connectDatabase();
  console.log("DB connected");
  
  const start = Date.now();
  console.log("Running ensureUserProfiles...");
  await ensureUserProfiles();
  console.log("Done ensureUserProfiles in", Date.now() - start, "ms");

  process.exit(0);
}

run();
