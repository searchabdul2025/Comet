const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const lines = envFile.split('\n');
const env = {};
lines.forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    env[key.trim()] = value.join('=').trim();
  }
});

const MONGODB_URI = env.MONGODB_URI;

async function checkAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@cometportal.com' });
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }

    const passwordsToTry = ['admin123', 'admin', 'password', 'comet123'];
    for (const pw of passwordsToTry) {
      const isValid = await bcrypt.compare(pw, admin.password);
      console.log(`Trying password "${pw}": ${isValid ? 'VALID' : 'INVALID'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminPassword();
