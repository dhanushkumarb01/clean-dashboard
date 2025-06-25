// recreate-googleid-index.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dhanushkumar:JcEI%403098@internship-dashboard.r6iodbd.mongodb.net/test?retryWrites=true&w=majority&appName=internship-dashboard';

async function recreateIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').createIndex(
      { googleId: 1 },
      { unique: true, background: true, sparse: true } // <- safer version
    );

    console.log('Index recreated:', result);
  } catch (err) {
    console.error('Error recreating index:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

recreateIndex();
