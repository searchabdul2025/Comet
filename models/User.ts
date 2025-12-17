import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPermissions {
  canManageUsers?: boolean;
  canManageForms?: boolean;
  canManageIPs?: boolean;
  canViewSubmissions?: boolean;
  canManageRequests?: boolean;
  canDeleteForms?: boolean;
  canEditForms?: boolean;
  canCreateForms?: boolean;
  canManageSettings?: boolean;
}

export interface IUser extends Document {
  name: string;
  email?: string;
  username?: string;
  password: string;
  role: 'Admin' | 'Supervisor' | 'User';
  permissions?: IUserPermissions;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Supervisor', 'User'],
      default: 'User',
    },
    permissions: {
      canManageUsers: { type: Boolean },
      canManageForms: { type: Boolean },
      canManageIPs: { type: Boolean },
      canViewSubmissions: { type: Boolean },
      canManageRequests: { type: Boolean },
      canDeleteForms: { type: Boolean },
      canEditForms: { type: Boolean },
      canCreateForms: { type: Boolean },
      canManageSettings: { type: Boolean },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

