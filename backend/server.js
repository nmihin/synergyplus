const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Added CORS middleware
const twilio = require('twilio');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const accountSid = 'AC183da6b3fb4e76482cbf0716f5358889';
const authToken = '344caad38f0b814b0252c7b8ff9858ab';
const client = twilio(accountSid, authToken);

app.post('/send-sms', (req, res) => {
    console.log('Incoming request:', req.body);

    const { to, message } = req.body;

    client.messages
        .create({
            body: message,
            from: '+16282126933',
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
