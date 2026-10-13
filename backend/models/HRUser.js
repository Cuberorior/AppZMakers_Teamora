import mongoose from 'mongoose';

const hrUserSchema = new mongoose.Schema(
  {
    legacyId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, default: 'Human Resources' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    dateOfBirth: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('HRUser', hrUserSchema);
