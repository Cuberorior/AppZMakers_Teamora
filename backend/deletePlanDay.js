import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const companyEventSchema = new mongoose.Schema({ title: String }, { timestamps: true, strict: false });
const CompanyEvent = mongoose.model('CompanyEvent', companyEventSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await CompanyEvent.deleteMany({ title: /PlanDay/i });
  console.log(`Deleted ${res.deletedCount} PlanDay events.`);
  await mongoose.disconnect();
}

run();
