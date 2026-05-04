import mongoose, { Schema, Document } from 'mongoose';

export interface ITarget extends Document {
  user: mongoose.Types.ObjectId;
  period: string; // YYYY-MM
  target: number;
  note?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TargetSchema = new Schema<ITarget>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    target: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

TargetSchema.index({ user: 1, period: 1 }, { unique: true });

export default mongoose.models.Target || mongoose.model<ITarget>('Target', TargetSchema);

