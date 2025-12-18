import mongoose, { Schema, Document } from 'mongoose';

export interface IFormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  placeholder?: string;
  validation?: string;
  options?: string[];
}

export interface IForm extends Document {
  title: string;
  formId: string;
  description?: string;
  campaign?: mongoose.Types.ObjectId;
  fields: IFormField[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'email', 'tel', 'number', 'date', 'select', 'radio', 'checkbox', 'textarea'],
    required: true,
  },
  required: { type: Boolean, default: false },
  placeholder: String,
  validation: String,
  options: [String],
});

const FormSchema = new Schema<IForm>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    formId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true,
    },
    fields: {
      type: [FormFieldSchema],
      default: [],
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

export default mongoose.models.Form || mongoose.model<IForm>('Form', FormSchema);

