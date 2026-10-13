import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    annual: { type: allocationSchema, default: () => ({ total: 0, used: 0 }) },
    casual: { type: allocationSchema, default: () => ({ total: 0, used: 0 }) },
    medical: { type: allocationSchema, default: () => ({ total: 0, used: 0 }) },
  },
  { timestamps: true }
);

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
