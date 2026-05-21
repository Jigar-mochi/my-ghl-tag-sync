# Secure GoHighLevel Webhook Server

A secure, beginner-friendly Node.js server that receives GoHighLevel Marketplace App webhooks and verifies their authenticity using official GHL cryptographic signatures (Ed25519 & RSA).

## Features
- **Official Security**: Uses native Node.js crypto to verify `X-GHL-Signature` and `X-WH-Signature`.
- **Raw Body Handling**: Implements Express.js `req.rawBody` correctly to prevent signature corruption.
- **Zero Dependencies**: Relies solely on native Node.js `crypto`. No Axios, Redis, MongoDB, or complex architecture.

## Setup Instructions

### 1. Configure MongoDB
This project requires a MongoDB database to permanently store your webhook logs.
Open the `.env` file and make sure `MONGODB_URI` points to your active database (e.g., local MongoDB or MongoDB Atlas):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/ghl-webhooks
```

### 2. Run the Backend Server
Install dependencies (if you haven't) and start the Node.js API server on port 3000:
```bash
npm install
npm start
```
You should see: `Secure server running on http://localhost:3000`

### 3. Run the React Frontend Dashboard
We have built a premium React dashboard to visualize your webhook data and tag additions/removals!
Open a **second terminal window** and run:
```bash
cd frontend
npm run dev
```
You can now visit your dashboard at `http://localhost:5173`.

### 4. Expose Localhost (for webhooks)
Since GHL cannot send webhooks directly to `localhost`, expose it using `ngrok` in a new terminal window:
```bash
ngrok http 3000
```
Copy the `https://` Forwarding URL.

### 3. Test Using GoHighLevel
1. In your GoHighLevel agency/sub-account, go to **Automations -> Create Workflow**.
2. Add a Trigger: **Contact Tag** (Tag Added or Removed).
3. Add an Action: **Webhook**.
4. Set Method to `POST`.
5. Paste your ngrok URL with `/webhook` at the end.
6. **Save and Publish**.
7. Go to **Contacts**, pick a test contact, and add a tag (e.g., `VIP`).

### 4. Verify Security Works
In your terminal, you should see a successful verification log:
```text
================================
GHL WEBHOOK VERIFIED
====================

Verification: SUCCESS
Event Type: ContactTagUpdate

Tags:
* VIP
* Customer

================================
```

### 5. Intentionally Test Failed Requests
You can verify the security by intentionally sending a fake request. Open another terminal and use `curl` to send a fake payload without a valid signature:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"ContactTagUpdate","tags":["FakeTag"]}'
```
In your server terminal, you will see it get cleanly rejected:
```text
================================
INVALID GHL WEBHOOK
===================

Reason:
Missing signature header

================================
```
The fake request will receive an `HTTP 401 Unauthorized` response.
