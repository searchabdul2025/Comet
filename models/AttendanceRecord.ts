import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRecord extends Document {
  userId: mongoose.Types.ObjectId;
  biometricId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  breakStartTime?: Date;
  breakEndTime?: Date;
  status: 'Present' | 'Late' | 'Absent' | 'Holiday';
  fineAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    biometricId: { type: String, required: true },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    breakStartTime: { type: Date },
    breakEndTime: { type: Date },
    status: { type: String, enum: ['Present', 'Late', 'Absent', 'Holiday'], default: 'Present' },
    fineAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
