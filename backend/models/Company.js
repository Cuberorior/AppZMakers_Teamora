import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    legacyId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    industry: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    employeeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    address: { type: String, default: '' },
    country: { type: String, default: 'Sri Lanka' },
    avatar: { type: String, default: '' },
    teaBreakAllowed: { type: Boolean, default: true },
    isTeam: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
