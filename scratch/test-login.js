const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://officialclientrecords_db_user:oe9Xgv4Hx7PpdkjC@cluster0.t4kn5tu.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0';

async function testLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const email = 'admin@cometportal.com';
    const pass = 'admin123'; // Assuming this is the password
    
    const user = await mongoose.connection.db.collection('users').findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found:', user.email);
    console.log('Hashed Password in DB:', user.password);
    
    const isValid = await bcrypt.compare(pass, user.password);
    console.log('Password valid for "admin123":', isValid);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLogin();
