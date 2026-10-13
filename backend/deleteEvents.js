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

const titlesToDelete = ['pongal', 'ghghghgh', 'palnday', 'newyear', 'Ts'];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await CompanyEvent.deleteMany({
      title: { $in: titlesToDelete }
    });
    
    console.log(`Deleted ${result.deletedCount} events: ${titlesToDelete.join(', ')}`);
    
    // Also delete any with lowercase or variations if needed
    // But exact match first
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
