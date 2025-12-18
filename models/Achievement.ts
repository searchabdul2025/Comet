import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  employee: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  targets?: number;
  achieved?: number;
  remaining?: number;
  revenue?: number;
  bonuses?: number;
  dealsClosed?: number;
  dealsRejected?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true },
    targets: { type: Number },
    achieved: { type: Number },
    remaining: { type: Number },
    revenue: { type: Number },
    bonuses: { type: Number },
    dealsClosed: { type: Number },
    dealsRejected: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

AchievementSchema.index({ employee: 1, month: 1 }, { unique: true });

export default mongoose.models.Achievement ||
  mongoose.model<IAchievement>('Achievement', AchievementSchema);

