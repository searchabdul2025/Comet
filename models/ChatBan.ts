import mongoose, { Schema, Document } from 'mongoose';

export interface IChatBan extends Document {
  userId: string;
  userName: string;
  reason?: string;
  bannedBy: string;
  bannedByName?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  liftedAt?: Date;
}

const ChatBanSchema = new Schema<IChatBan>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    userName: { type: String, required: true, trim: true },
    reason: { type: String, trim: true },
    bannedBy: { type: String, required: true },
    bannedByName: { type: String, trim: true },
    active: { type: Boolean, default: true },
    liftedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ChatBan || mongoose.model<IChatBan>('ChatBan', ChatBanSchema);











