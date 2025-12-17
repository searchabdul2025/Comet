import mongoose, { Schema, Document } from 'mongoose';

export interface IFormSubmission extends Document {
  formId: mongoose.Types.ObjectId;
  formData: Record<string, any>; // Dynamic data based on form fields
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt: Date;
  ipAddress?: string;
  phoneNumber?: string; // normalized 10-digit US phone for de-dup + reporting
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
    },
    formData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    phoneNumber: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.FormSubmission || mongoose.model<IFormSubmission>('FormSubmission', FormSubmissionSchema);

