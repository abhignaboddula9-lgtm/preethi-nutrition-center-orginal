require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Mongoose Configuration
// Disable query buffering globally so we do not hide connection dropouts or failure hangs
mongoose.set('bufferCommands', false);

// Connection event logging
mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established successfully.');
  console.log('Database Name:', mongoose.connection.name);
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error occurred:', err.stack || err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose connection disconnected!');
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongoose connection reestablished.');
});

const app = express();
const PORT = process.env.PORT || 5001;

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
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

// Serve React dist folder first if it exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
// Fallback to public folder
app.use(express.static(publicPath));
// Serve uploads folder specifically if needed
app.use('/uploads', express.static(uploadsDir));



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

// Frontend Clean Page Routes Removed (Now handled by wildcard router)

// Database connection status check middleware for all API requests
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is currently offline. Please ensure MongoDB Atlas IP Whitelisting is set to 0.0.0.0/0.'
    });
  }
  next();
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

// Wildcard route to handle clean URLs for the multi-page HTML frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  // Clean URL mapping for HTML files (e.g., /about -> /about.html)
  const cleanPath = req.path === '/' ? '/index.html' : req.path;
  let htmlPath = path.join(publicPath, cleanPath);
  
  if (!path.extname(cleanPath)) {
    htmlPath += '.html';
  }

  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }

  // React Router fallback (if they ever switch to React)
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }

  // Final fallback to public/index.html
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// MongoDB Connection Logic & Server Boot (Resilient in Production)
const startServer = async () => {
  const rawMongoURI = process.env.MONGO_URI;
  if (!rawMongoURI) {
    console.warn('WARNING: MONGO_URI environment variable is not defined.');
    console.warn('Database features will be offline.');
  } else {
    const mongoURI = rawMongoURI.trim();
    console.log('MONGO_URI environment variable exists.');

    try {
      // Sanitize credentials out of connection string before logging
      const connStrLog = mongoURI.replace(/mongodb(\+srv)?:\/\/([^@]+)@/, 'mongodb$1://***:***@');
      console.log(`Connecting to MongoDB at: ${connStrLog}...`);

      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000 // fail fast if Atlas is not reachable
      });
      
      // Seed admin accounts after successful connection
      await seedAdmin();
    } catch (err) {
      console.error('CRITICAL STARTUP ERROR: MongoDB connection failed! Running in degraded mode.');
      console.error(err.stack || err);
      // Removed process.exit(1) to allow Render zero-downtime deployment to succeed
    }
  }

  // Start listening REGARDLESS of database connection status
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  });
};

startServer();
