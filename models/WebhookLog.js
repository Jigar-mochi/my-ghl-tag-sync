const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
    eventType: { type: String, required: true },
    contactId: { type: String },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    tags: [{ type: String }],
    addedTags: [{ type: String }],
    removedTags: [{ type: String }],
    payload: { type: mongoose.Schema.Types.Mixed }, // Store the entire raw JSON payload
    receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
