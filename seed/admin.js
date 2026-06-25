const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/preethi_nutrition';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for admin seeding...');

    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@preethinutrition.com').toLowerCase();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`Admin account (${adminEmail}) updated successfully with password.`);
    } else {
      await User.create({
        name: process.env.DEFAULT_ADMIN_NAME || 'Admin Preethi',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '1234567890'
      });
      console.log(`Admin account (${adminEmail}) seeded successfully.`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

seedAdmin();
