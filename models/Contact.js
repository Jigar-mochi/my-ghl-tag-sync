const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    contactId: { type: String, required: true, unique: true },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    tags: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);
