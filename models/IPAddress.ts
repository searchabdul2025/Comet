import mongoose, { Schema, Document } from 'mongoose';

export interface IIPAddress extends Document {
  ip: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IPAddressSchema = new Schema<IIPAddress>(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.IPAddress || mongoose.model<IIPAddress>('IPAddress', IPAddressSchema);

