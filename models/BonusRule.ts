import mongoose, { Schema, Document } from 'mongoose';

export interface IBonusRule extends Document {
  user: mongoose.Types.ObjectId;
  campaign: mongoose.Types.ObjectId;
  productGrade: string; // e.g., "small egg", "bigger egg", "12 eggs"
  bonusAmount: number; // Bonus amount for this product grade
  target?: number; // Optional base target for this product grade
  isActive: boolean;
  note?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BonusRuleSchema = new Schema<IBonusRule>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    productGrade: {
      type: String,
      required: true,
      trim: true,
    },
    bonusAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    target: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one rule per user, campaign, and product grade
BonusRuleSchema.index({ user: 1, campaign: 1, productGrade: 1 }, { unique: true });

export default mongoose.models.BonusRule || mongoose.model<IBonusRule>('BonusRule', BonusRuleSchema);

