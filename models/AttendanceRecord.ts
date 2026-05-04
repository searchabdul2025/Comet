import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRecord extends Document {
  userId: mongoose.Types.ObjectId;
  biometricId: string;
  checkInTime: Date;
  status: 'Present' | 'Late' | 'Absent';
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    biometricId: { type: String, required: true },
    checkInTime: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Late', 'Absent'], default: 'Present' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
