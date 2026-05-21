# GoHighLevel Webhook Server

A very simple, beginner-friendly Node.js server to receive and log GoHighLevel Marketplace App webhooks.

## Setup Instructions

### 1. Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/) if you haven't already.

### 2. Create project
*(Skip if you downloaded this repository directly)*
```bash
mkdir ghl-webhook-server
cd ghl-webhook-server
npm init -y
```

### 3. Install dependencies
Install the required packages (Express and dotenv):
```bash
npm install express dotenv
```

### 4. Run server
Start the application:
```bash
node server.js
```
You should see: `Server running on http://localhost:3000`

### 5. Install ngrok
Since GoHighLevel cannot reach `localhost` directly, we need a way to expose your local server to the internet.
- Download and install [ngrok](https://ngrok.com/download)
- Follow their instructions to add your auth token.

### 6. Expose localhost
In a **new terminal window**, run:
```bash
ngrok http 3000
```
Copy the `Forwarding` URL that starts with `https://` (e.g., `https://abcd-1234.ngrok-free.app`).

### 7. Configure webhook URL in GoHighLevel
1. Go to your GoHighLevel account.
2. Navigate to Automations -> Create Workflow.
3. Add a Trigger (e.g., Contact Tag).
4. Add an Action: **Webhook**.
5. Set Method to `POST`.
6. Paste your ngrok URL with `/webhook` at the end (e.g., `https://abcd-1234.ngrok-free.app/webhook`).
7. Save and Publish.

### 8. How to trigger tag update
1. Go to the **Contacts** tab in GoHighLevel.
2. Select a test contact.
3. Add a new tag (e.g., `VIP`) or remove one.

### 9. How to verify webhook is working
Look at the terminal where `node server.js` is running. You should see a log like this:

```
================================
NEW GHL WEBHOOK RECEIVED
========================

Event Type: ContactTagUpdate
Contact ID: abc123
Location ID: loc123

Tags:
* VIP
* Booked Call

Full Payload:
{
  ...
}

================================
```
