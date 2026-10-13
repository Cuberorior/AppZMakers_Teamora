import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const companyEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

const CompanyEvent = mongoose.model('CompanyEvent', companyEventSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const events = await CompanyEvent.find({
      start: { $regex: /^2026-06/ }
    });
    console.log("June 2026 events:", events.map(e => ({ title: e.title, start: e.start })));
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
