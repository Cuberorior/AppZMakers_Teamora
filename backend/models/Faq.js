import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    targetRole: {
      type: String,
      required: true,
      enum: ['employee', 'company'],
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Faq', faqSchema);
