import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    department: { type: String, default: '' },
    type: { type: String, enum: ['annual', 'casual', 'medical', 'client-assigned'], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
    appliedOn: { type: String, default: () => new Date().toISOString().split('T')[0] },
    hrNote: { type: String },
    rejectionReason: { type: String },
    cancelledBy: { type: String },
    hiddenForEmployee: { type: Boolean, default: false },
    hiddenForAdmins: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
