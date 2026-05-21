require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const verifySignature = require('./utils/verifySignature');
const WebhookLog = require('./models/WebhookLog');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// IMPORTANT: We must grab the raw request body BEFORE it gets parsed as JSON
// This is required for accurate signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        // Save the raw body buffer as a string on the request object
        req.rawBody = buf.toString('utf8');
    }
}));

// POST /webhook endpoint
app.post('/webhook', (req, res) => {
    // 1. Get raw body and headers
    const rawBody = req.rawBody || '';
    const headers = req.headers;

    // 2. Verify signature
    const verification = verifySignature(rawBody, headers);

    if (!verification.ok) {
        console.log('\n================================');
        console.log('INVALID GHL WEBHOOK');
        console.log('===================\n');
        console.log('Reason:');
        console.log(verification.reason);
        console.log('\n================================\n');

        // 3. Reject invalid requests
        return res.status(401).send('Unauthorized: Invalid Signature');
    }

    // 4. Accept valid requests and parse JSON
    const payload = req.body;

    console.log('\n================================');
    console.log('GHL WEBHOOK VERIFIED');
    console.log('====================\n');
    console.log('Verification: SUCCESS');

    // 5. Save to MongoDB
    const logEntry = new WebhookLog({
        eventType: payload.type || 'Unknown',
        contactId: payload.contactId || payload.id,
        contactName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
        email: payload.email,
        phone: payload.phone,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        payload: payload
    });
    
    logEntry.save()
        .then(() => console.log('✅ Webhook saved to MongoDB successfully.'))
        .catch(err => console.error('❌ Error saving to MongoDB:', err));

    // 6. Print webhook data
    if (payload.type === 'ContactTagUpdate') {
        console.log(`Event Type: ${payload.type}`);
        console.log(`Contact ID: ${payload.contactId || payload.id || 'N/A'}`);
        
        const fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
        console.log(`Name: ${fullName || 'N/A'}`);
        console.log(`Email: ${payload.email || 'N/A'}`);
        console.log(`Phone: ${payload.phone || 'N/A'}`);
        console.log('');
        console.log('Tags:');
        
        if (Array.isArray(payload.tags) && payload.tags.length > 0) {
            payload.tags.forEach(tag => {
                console.log(`* ${tag}`);
            });
        } else {
            console.log('* No tags');
        }
    } else {
        console.log(`Event Type: ${payload.type || 'Unknown'}`);
    }

    console.log('\nFull Payload:');
    console.log(JSON.stringify(payload, null, 2));

    console.log('\n================================\n');

    // 7. Return 200
    res.status(200).send('Webhook received and verified');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Secure server running on http://localhost:${PORT}`);
    console.log(`Waiting for signed webhooks at http://localhost:${PORT}/webhook`);
});
