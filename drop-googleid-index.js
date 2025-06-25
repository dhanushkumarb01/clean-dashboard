// drop-googleid-index.js
const mongoose = require('mongoose');

// Use your actual MongoDB URI and database name
const MONGODB_URI = 'mongodb+srv://dhanushkumar:JcEI%403098@internship-dashboard.r6iodbd.mongodb.net/test?retryWrites=true&w=majority&appName=internship-dashboard';

async function dropIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Indexes on users:', indexes);
    const result = await mongoose.connection.db.collection('users').dropIndex('googleId_1');
    console.log('Index dropped:', result);
  } catch (err) {
    console.error('Error dropping index:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropIndex();