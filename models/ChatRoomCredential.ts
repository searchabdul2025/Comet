import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IChatRoomCredential extends Document {
  chatRoom: mongoose.Types.ObjectId; // Reference to ChatRoom
  username: string; // Unique username for this chatroom
  password: string; // Hashed password
  displayName?: string; // Optional display name
  isActive: boolean;
  lastUsedAt?: Date;
  createdBy: mongoose.Types.ObjectId; // Admin who created it
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomCredentialSchema = new Schema<IChatRoomCredential>(
  {
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
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

// Ensure unique username per chatroom
ChatRoomCredentialSchema.index({ chatRoom: 1, username: 1 }, { unique: true });

// Hash password before saving
ChatRoomCredentialSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
ChatRoomCredentialSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.ChatRoomCredential ||
  mongoose.model<IChatRoomCredential>('ChatRoomCredential', ChatRoomCredentialSchema);

