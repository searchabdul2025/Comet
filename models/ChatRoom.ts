import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId; // Admin who created it
  isActive: boolean;
  maxParticipants?: number;
  visibility: 'public' | 'private' | 'invite-only'; // Who can see/access this chatroom
  allowedRoles?: ('Admin' | 'Supervisor' | 'User')[]; // Roles that can access (if visibility is 'public' or 'invite-only')
  allowedUsers?: mongoose.Types.ObjectId[]; // Specific users that can access (if visibility is 'invite-only')
  showInSidebar: boolean; // Whether to show in sidebar
  requireApproval: boolean; // Whether to require admin approval to join
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
    visibility: {
      type: String,
      enum: ['public', 'private', 'invite-only'],
      default: 'private',
      index: true,
    },
    allowedRoles: {
      type: [String],
      enum: ['Admin', 'Supervisor', 'User'],
      default: [],
    },
    allowedUsers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    showInSidebar: {
      type: Boolean,
      default: true,
      index: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ChatRoomSchema.index({ createdBy: 1, isActive: 1 });

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

