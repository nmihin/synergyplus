require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('follow-redirects').https;

const API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

  return new Promise((resolve) => {
    const httpsReq = https.request(options, (response) => {
      let chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));

      response.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        const responseData = JSON.parse(body);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(res.status(200).json({ success: true, response: responseData }));
        } else {
          resolve(
            res.status(response.statusCode).json({
              success: false,
              error: responseData.requestError || 'Unknown error occurred',
            })
          );
        }
      });
    });

    httpsReq.on('error', (error) => {
      console.error('Error sending SMS:', error.message);
      resolve(res.status(500).json({ success: false, error: error.message }));
    });

    httpsReq.write(reqData);
    httpsReq.end();
  });
};

module.exports = handler;
