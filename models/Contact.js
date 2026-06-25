const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  service: { type: String, default: '' },
  message: { type: String, default: '' },
  responded: { type: Boolean, default: false },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
