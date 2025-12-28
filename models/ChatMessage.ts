import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  userName: string;
  userRole: 'Admin' | 'Supervisor' | 'User';
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isSystem?: boolean;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userRole: { type: String, enum: ['Admin', 'Supervisor', 'User'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);








