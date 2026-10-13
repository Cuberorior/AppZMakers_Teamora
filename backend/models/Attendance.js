import mongoose from 'mongoose';

const breakSchema = new mongoose.Schema(
  { start: String, end: String, type: { type: String, enum: ['normal', 'meal', 'tea', 'tea_exceed'], default: 'meal' }, startTimestamp: { type: Number, default: null } },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    checkOutDate: { type: String, default: null },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day'],
      default: 'present',
    },
    totalHours: { type: Number, default: 0 },
    breakMinutes: { type: Number, default: 0 },
    extraHours: { type: Number, default: 0 },
    lessHours: { type: Number, default: 0 },
    onBreak: { type: Boolean, default: false },
    onTeaBreak: { type: Boolean, default: false },
    onTeaExceed: { type: Boolean, default: false },
    breaks: [breakSchema],
    adjusted: { type: Boolean, default: false },
    adjustedBy: { type: String, default: null },
    adjustedReason: { type: String, default: null },
    tasks: [
      {
        description: { type: String, required: true },
        timeContext: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    overtimeState: {
      status: { type: String, enum: ['idle', 'pending', 'confirmed'], default: 'idle' },
      confirmedHours: { type: Number, default: 0 },
      nextConfirmDueAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

attendanceSchema.index({ status: 1 });
attendanceSchema.index({ checkIn: 1 });

export default mongoose.model('Attendance', attendanceSchema);
