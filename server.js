require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// POST /webhook endpoint
app.post('/webhook', (req, res) => {
    const payload = req.body;

    console.log('\n================================');
    console.log('NEW GHL WEBHOOK RECEIVED');
    console.log('========================\n');

    // Detect ContactTagUpdate
    if (payload.type === 'ContactTagUpdate') {
        console.log(`Event Type: ${payload.type}`);
        console.log(`Contact ID: ${payload.contactId}`);
        console.log(`Location ID: ${payload.locationId}\n`);

        console.log('Tags:');
        if (Array.isArray(payload.tags) && payload.tags.length > 0) {
            payload.tags.forEach(tag => {
                console.log(`* ${tag}`);
            });
        } else {
            console.log('* No tags');
        }
        console.log('');
    } else {
        // Fallback for other events
        console.log(`Event Type: ${payload.type || 'Unknown'}\n`);
    }

    console.log('Full Payload:');
    console.log(JSON.stringify(payload, null, 2));

    console.log('\n================================\n');

    // Return proper HTTP 200 response
    res.status(200).send('Webhook received');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Waiting for webhooks at http://localhost:${PORT}/webhook`);
});
