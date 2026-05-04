import connectDB from './mongodb';
import Setting from '@/models/Setting';

export async function getSetting(key: string): Promise<string | null> {
  await connectDB();
  const doc = await Setting.findOne({ key }).lean<{ value?: string }>();
  if (!doc) return null;
  return doc.value ?? null;
}

export async function setSettings(settings: Record<string, string>) {
  await connectDB();
  const ops = Object.entries(settings).map(([key, value]) =>
    Setting.updateOne({ key }, { $set: { value } }, { upsert: true })
  );
  await Promise.all(ops);
}

