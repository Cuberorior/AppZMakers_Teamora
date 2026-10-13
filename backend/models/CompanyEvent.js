import mongoose from 'mongoose';

const companyEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    start: { type: String, required: true }, // Format: YYYY-MM-DD (or Date)
    end: { type: String, required: true },   // Format: YYYY-MM-DD (or Date)
    type: {
      type: String,
      enum: ['holiday', 'bank-holiday', 'festival', 'company-holiday', 'team-event', 'meeting', 'training', 'day-off', 'special'],
      default: 'team-event',
    },
    targetLocation: {
      type: String,
      enum: ['all', 'country', 'branch'],
      default: 'all',
    },
    targetValue: { type: String, default: '' }, // e.g. "Sri Lanka" or "Colombo"
    googleEventId: { type: String, default: null },
    createdBy: { type: String, default: 'HR Manager' },
  },
  { timestamps: true }
);

companyEventSchema.index({ googleEventId: 1 }, { sparse: true });
companyEventSchema.index({ start: 1, end: 1 });

export default mongoose.model('CompanyEvent', companyEventSchema);
