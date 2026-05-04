import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesApproval extends Document {
  agent: mongoose.Types.ObjectId; // The agent who made the sale
  submission: mongoose.Types.ObjectId; // Reference to FormSubmission
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'unpaid';
  amount?: number; // Sale amount
  comments?: string; // Comments from admin/supervisor
  reviewedBy?: mongoose.Types.ObjectId; // Admin or Supervisor who reviewed
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalesApprovalSchema = new Schema<ISalesApproval>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submission: {
      type: Schema.Types.ObjectId,
      ref: 'FormSubmission',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid', 'unpaid'],
      default: 'pending',
      index: true,
    },
    amount: {
      type: Number,
    },
    comments: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
SalesApprovalSchema.index({ agent: 1, status: 1 });
SalesApprovalSchema.index({ submission: 1 }, { unique: true }); // One approval per submission

export default mongoose.models.SalesApproval || mongoose.model<ISalesApproval>('SalesApproval', SalesApprovalSchema);

