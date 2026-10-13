import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    workHours: { type: String, default: '8 hours' },
    breakTime: { type: String, default: '1 hour' },
    lateThreshold: { type: String, default: '15 minutes' },
    overtimeRate: { type: String, default: '1.5x' },
    sessionTimeout: { type: String, default: '30 minutes' },
    morningShiftStartTime: { type: String, default: '09:00' },
    nightShiftStartTime: { type: String, default: '21:00' },
    backupSchedule: { type: String, default: 'Daily at 2 AM' },
    leaveAllocations: {
      medical: { type: Number, default: 10 },
    },
    mealBreaksMax: { type: Number, default: 5 },
    teaBreakEnabled: { type: Boolean, default: true },
    teaBreaksMax: { type: Number, default: 2 },
    teaBreakDuration: { type: Number, default: 15 },
    teaBreakGap: { type: Number, default: 120 },
    gameTimeLimitMinutes: { type: Number, default: 10 },
    gameCooldownMinutes: { type: Number, default: 120 },
    departments: { type: [String], default: [] },
    departmentOvertimeRules: [
      {
        department: { type: String, required: true },
        enabled: { type: Boolean, default: false },
        intervalMinutes: { type: Number, default: 60 },
        timeoutMinutes: { type: Number, default: 30 },
        emailNotification: { type: Boolean, default: true },
        maxOvertimeHours: { type: Number, default: 4 },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model('SystemSettings', systemSettingsSchema);
