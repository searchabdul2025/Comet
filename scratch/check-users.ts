import connectDB from './lib/mongodb';
import User from './models/User';

async function checkUsers() {
  try {
    await connectDB();
    const users = await User.find({}).select('email username name role').lean();
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
