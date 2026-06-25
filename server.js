const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
// Serve general public folder
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploads folder specifically if needed
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/preethi_nutrition';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    seedAdmin();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Admin Account Seeding function
async function seedAdmin() {
  try {
    // Dynamically require User model so server doesn't crash on boot if the file is being created
    const User = require('./models/User');
    const adminEmails = [
      (process.env.DEFAULT_ADMIN_EMAIL || 'admin@preethinutrition.com').toLowerCase(),
      'preethiherbalife@gmail.com'
    ];
    
    for (const email of adminEmails) {
      const adminExists = await User.findOne({ email });
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      if (!adminExists) {
        await User.create({
          name: email === 'preethiherbalife@gmail.com' ? "Preethi Ma'am" : (process.env.DEFAULT_ADMIN_NAME || 'Admin Preethi'),
          email: email,
          password: hashedPassword,
          role: 'admin',
          phone: '9293604899'
        });
        console.log(`Default admin account seeded successfully (${email}).`);
      } else {
        adminExists.password = hashedPassword;
        adminExists.role = 'admin';
        await adminExists.save();
        console.log(`Admin account updated successfully with password (${email}).`);
      }
    }
  } catch (error) {
    console.error('Error seeding default admin accounts:', error);
  }
}

// Frontend Clean Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});
app.get('/diet', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'diet.html'));
});
app.get('/zumba', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'zumba.html'));
});
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/admin-login', (req, res) => {
  res.redirect('/login');
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Program Specific Routes
app.get('/weight-loss', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'weight-loss.html'));
});
app.get('/weight-gain', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'weight-gain.html'));
});
app.get('/diet-consultation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'diet-consultation.html'));
});
app.get('/nutrition-counseling', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'nutrition-counseling.html'));
});
app.get('/healthy-meal-planning', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'healthy-meal-planning.html'));
});
app.get('/fitness-guidance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fitness-guidance.html'));
});

// Backend API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/products', require('./routes/products'));
app.use('/api/success', require('./routes/success'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/content', require('./routes/content'));
app.use('/api/about', require('./routes/content'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/appointments', require('./routes/appointments'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
