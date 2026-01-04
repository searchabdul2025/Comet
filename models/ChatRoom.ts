import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId; // Admin who created it
  isActive: boolean;
  maxParticipants?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxParticipants: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

ChatRoomSchema.index({ createdBy: 1, isActive: 1 });

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

