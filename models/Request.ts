import mongoose, { Schema, Document } from 'mongoose';

export interface IRequest extends Document {
  type: string;
  requester: mongoose.Types.ObjectId;
  details: string;
  title?: string;
  name?: string;
  description?: string;
  message?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
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

export default mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema);

