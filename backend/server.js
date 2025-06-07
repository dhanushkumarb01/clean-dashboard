require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const connectDB = require('./config/db');
connectDB();

// Import routes
const youtubeRoutes = require('./routes/youtube');
app.use('/api/youtube', youtubeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
