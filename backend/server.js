require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Added CORS middleware
const twilio = require('twilio');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Retrieve sensitive data from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

app.post('/send-sms', (req, res) => {
    console.log('Incoming request:', req.body);

    const { to, message } = req.body;

    client.messages
        .create({
            body: message,
            from: fromPhoneNumber,
            to: to,
        })
        .then((message) => {
            console.log('Message sent:', message.sid);
            res.status(200).send({ success: true, messageSid: message.sid });
        })
        .catch((error) => {
            console.error('Error sending message:', error.message);
            res.status(500).send({ success: false, error: error.message });
        });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
