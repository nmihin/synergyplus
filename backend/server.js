require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('follow-redirects').https;

const app = express();
app.use(bodyParser.json());
app.use(cors());

const API_KEY = process.env.INFOBIP_API_KEY; // Infobip API key
const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;

app.post('/send-sms', (req, res) => {
    const { to, message } = req.body;

    const options = {
        method: 'POST',
        hostname: INFOBIP_BASE_URL,
        path: '/sms/2/text/advanced',
        headers: {
            Authorization: `App ${API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        maxRedirects: 20,
    };

    const reqData = JSON.stringify({
        messages: [
            {
                destinations: [{ to }],
                from: 'ServiceSMS',
                text: message,
            },
        ],
    });

    const httpsReq = https.request(options, (response) => { // Renamed variable to avoid conflict
        let chunks = [];

        response.on('data', (chunk) => chunks.push(chunk));

        response.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            const responseData = JSON.parse(body);

            if (response.statusCode >= 200 && response.statusCode < 300) {
                res.status(200).send({ success: true, response: responseData });
            } else {
                res.status(response.statusCode).send({
                    success: false,
                    error: responseData.requestError || 'Unknown error occurred',
                });
            }
        });
    });

    httpsReq.on('error', (error) => {
        console.error('Error sending SMS:', error.message);
        res.status(500).send({ success: false, error: error.message });
    });

    httpsReq.write(reqData);
    httpsReq.end();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
