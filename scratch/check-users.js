const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://officialclientrecords_db_user:oe9Xgv4Hx7PpdkjC@cluster0.t4kn5tu.mongodb.net/comet-portal?retryWrites=true&w=majority&appName=Cluster0';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('--- USERS IN DATABASE ---');
    users.forEach(u => {
      console.log(`- ${u.email} | ${u.username} | ${u.role}`);
    });
    console.log('-------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
