import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    legacyId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    position: { type: String, default: '' },
    department: { type: String, default: '' },
    company: { type: String, default: 'General' },
    companyId: { type: String, default: null },
    team: { type: String, default: 'None' },
    teamId: { type: String, default: null },
    avatar: { type: String, default: '' },
    joinDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    dateOfBirth: { type: String, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cvName: { type: String, default: '' },
    cvData: { type: String, default: '' },
    country: { type: String, default: 'Sri Lanka' },
    office: { type: String, default: 'Colombo' },
    shift: { type: String, enum: ['morning', 'night'], default: 'morning' },
    teaBreakAllowed: { type: Boolean, default: true },
    isTeamLead: { type: Boolean, default: false },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    isClientSide: { type: Boolean, default: false },
  },
  { timestamps: true }
);

employeeSchema.index({ email: 1 });
employeeSchema.index({ companyId: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ userId: 1 });

export default mongoose.model('Employee', employeeSchema);
