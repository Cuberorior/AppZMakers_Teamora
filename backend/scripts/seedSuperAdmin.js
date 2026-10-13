/**
 * Creates a superadmin user in MongoDB.
 * Run: node scripts/seedSuperAdmin.js
 * Required env: ADMIN_EMAIL, ADMIN_PASSWORD
 * Optional env: ADMIN_NAME
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Super Admin';

const run = async () => {
  const missingVariables = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
    .filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    console.error(`Missing required environment variables: ${missingVariables.join(', ')}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Superadmin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'superadmin',
  });

  console.log('✅ Superadmin created');
  console.log(`   Email:    ${email}`);
  console.log('   Role:     superadmin');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
