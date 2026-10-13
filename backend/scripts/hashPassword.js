/**
 * Generate bcrypt hash for MongoDB Compass insert.
 * Run: node scripts/hashPassword.js yourPassword
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2] || '123456';
const hash = await bcrypt.hash(password, 10);
console.log('Password:', password);
console.log('Hash (paste into MongoDB):');
console.log(hash);
