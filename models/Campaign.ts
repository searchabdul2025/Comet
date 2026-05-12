import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  campaignId: string;
  name: string;
  description?: string;
  googleSheetId?: string;
  sheetTabs?: {
    name: string;
    label: string;
    purpose: 'submissions' | 'daily_reports' | 'duplicates' | 'custom';
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    googleSheetId: {
      type: String,
      trim: true,
    },
    sheetTabs: [
      {
        name: { type: String, required: true },
        label: { type: String, required: true },
        purpose: { 
          type: String, 
          required: true, 
          enum: ['submissions', 'daily_reports', 'duplicates', 'custom'],
          default: 'custom'
        },
      }
    ],
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

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

