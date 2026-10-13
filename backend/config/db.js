import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in backend/.env');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected');
  return mongoose.connection;
};
