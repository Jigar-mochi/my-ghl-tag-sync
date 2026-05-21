require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const verifySignature = require('./utils/verifySignature');
const WebhookLog = require('./models/WebhookLog');
const Contact = require('./models/Contact');

const app = express();
app.use(cors()); // Allow frontend to fetch data
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

    // 5. Calculate Tag Diffs & Save to MongoDB
    (async () => {
        try {
            const incomingTags = Array.isArray(payload.tags) ? payload.tags : [];
            const contactId = payload.contactId || payload.id;
            
            let addedTags = [];
            let removedTags = [];

            if (contactId && payload.type === 'ContactTagUpdate') {
                // Find existing contact to get previous tags
                let contact = await Contact.findOne({ contactId: contactId });
                
                if (contact) {
                    const previousTags = contact.tags || [];
                    addedTags = incomingTags.filter(t => !previousTags.includes(t));
                    removedTags = previousTags.filter(t => !incomingTags.includes(t));
                    
                    contact.tags = incomingTags;
                    contact.contactName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
                    contact.email = payload.email;
                    contact.phone = payload.phone;
                    contact.lastUpdated = new Date();
                    await contact.save();
                } else {
                    // First time seeing this contact
                    addedTags = incomingTags;
                    contact = new Contact({
                        contactId: contactId,
                        contactName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
                        email: payload.email,
                        phone: payload.phone,
                        tags: incomingTags
                    });
                    await contact.save();
                }
            }

            const logEntry = new WebhookLog({
                eventType: payload.type || 'Unknown',
                contactId: contactId,
                contactName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
                email: payload.email,
                phone: payload.phone,
                tags: incomingTags,
                addedTags: addedTags,
                removedTags: removedTags,
                payload: payload
            });
            
            await logEntry.save();
            console.log('✅ Webhook & Tag diffs saved to MongoDB successfully.');
            
            if (addedTags.length > 0) console.log(`[++] Added Tags: ${addedTags.join(', ')}`);
            if (removedTags.length > 0) console.log(`[--] Removed Tags: ${removedTags.join(', ')}`);
            
        } catch (err) {
            console.error('❌ Error saving to MongoDB:', err);
        }
    })();

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

// GET /api/logs - Fetch recent webhook logs for the frontend
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await WebhookLog.find().sort({ receivedAt: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /api/stats - Fetch analytics for the frontend dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const totalWebhooks = await WebhookLog.countDocuments();
        
        // Aggregate tags added and removed from recent logs
        const recentLogs = await WebhookLog.find({ eventType: 'ContactTagUpdate' }).sort({ receivedAt: -1 }).limit(100);
        
        let tagsAddedCount = 0;
        let tagsRemovedCount = 0;
        
        recentLogs.forEach(log => {
            tagsAddedCount += (log.addedTags && log.addedTags.length) || 0;
            tagsRemovedCount += (log.removedTags && log.removedTags.length) || 0;
        });

        res.json({
            totalWebhooks,
            recentTagsAdded: tagsAddedCount,
            recentTagsRemoved: tagsRemovedCount,
            recentLogs
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Secure server running on http://localhost:${PORT}`);
    console.log(`Waiting for signed webhooks at http://localhost:${PORT}/webhook`);
});
