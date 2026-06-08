const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS - allow both local and production domains
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads folder as static
app.use('/uploads', express.static(uploadsDir));

// Import routes
const authRoutes = require('./routes/auth');
const violationRoutes = require('./routes/violations');
const detectRoutes = require('./routes/detect');
const analyticsRoutes = require('./routes/analytics');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/detect', detectRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Traffic Violation Detection System API is running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const User = require('./models/User');

const seedUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('MongoDB is empty. Seeding default testing credentials...');
      
      // Admin user
      await User.create({
        name: 'System Administrator',
        email: 'admin@traffic.gov.in',
        password: 'admin123', // password automatically hashed by mongoose pre-save hook
        role: 'admin'
      });

      // Operator user
      await User.create({
        name: 'Traffic Operator',
        email: 'officer@traffic.gov.in',
        password: 'officer123', // password automatically hashed by mongoose pre-save hook
        role: 'user'
      });

      console.log('Testing users seeded successfully:');
      console.log('  - Admin: admin@traffic.gov.in / admin123');
      console.log('  - Operator: officer@traffic.gov.in / officer123');
    }
  } catch (err) {
    console.error('Error seeding default database users:', err);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB database successfully.');
    // Seed default users
    await seedUsers();
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection failure:', err);
    process.exit(1);
  });
