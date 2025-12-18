import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadApproval {
  role: 'Supervisor' | 'Admin';
  decision: 'approved' | 'rejected';
  note?: string;
  decidedBy: mongoose.Types.ObjectId;
  decidedAt: Date;
}

export interface IEmployeeLead extends Document {
  employee: mongoose.Types.ObjectId;
  customerName: string;
  phone?: string;
  meetingDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvals: ILeadApproval[];
  majorFormSubmission?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadApprovalSchema = new Schema<ILeadApproval>(
  {
    role: { type: String, enum: ['Supervisor', 'Admin'], required: true },
    decision: { type: String, enum: ['approved', 'rejected'], required: true },
    note: { type: String },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    decidedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EmployeeLeadSchema = new Schema<IEmployeeLead>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    meetingDate: { type: String, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
    approvals: { type: [LeadApprovalSchema], default: [] },
    majorFormSubmission: { type: Schema.Types.ObjectId, ref: 'FormSubmission' },
  },
  { timestamps: true }
);

EmployeeLeadSchema.index({ employee: 1, createdAt: -1 });

export default mongoose.models.EmployeeLead ||
  mongoose.model<IEmployeeLead>('EmployeeLead', EmployeeLeadSchema);

