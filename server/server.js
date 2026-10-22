const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const destinationRoutes = require('./routes/destinationRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Database Connection (SRS Section 2.1 & 2.4)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(' Connected successfully to MongoDB Atlas Cluster'))
  .catch((err) => console.error(' MongoDB Connection Error:', err));

// Route Mounts
app.use('/api/destinations', destinationRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LetsGO Visit Planner Backend is running' });
});

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
