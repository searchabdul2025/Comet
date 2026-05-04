import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  userName: string;
  userRole: 'Admin' | 'Supervisor' | 'User';
  content: string;
  chatroomId?: mongoose.Types.ObjectId; // Optional: if null, it's the main team chat
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
    chatroomId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      index: true,
    },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ChatMessageSchema.index({ chatroomId: 1, createdAt: -1 });

export default mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);











