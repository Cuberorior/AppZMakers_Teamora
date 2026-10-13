import mongoose from 'mongoose';

const knowledgeSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    conductor: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM
    meetingLink: { type: String, default: '' },
    participants: [{ type: String }], // Array of employee legacyIds or _id strings
    responses: [
      {
        employeeId: { type: String, required: true },
        status: { type: String, enum: ['accepted', 'rejected'], required: true },
        respondedAt: { type: Date, default: Date.now },
      },
    ],
    sessionType: { type: String, enum: ['knowledge-sharing', 'mentor-session'], default: 'knowledge-sharing' },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

knowledgeSessionSchema.index({ date: 1 });
knowledgeSessionSchema.index({ participants: 1 });

export default mongoose.model('KnowledgeSession', knowledgeSessionSchema);
