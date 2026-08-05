export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, toName, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'BINet Funnel Digitals', email: 'binet.enquiries@gmail.com' },
        to: [{ email: to, name: toName || to }],
        subject: subject,
        htmlContent: `<div style="font-family:sans-serif; font-size:15px; color:#0A1628;">
          <p>${message}</p>
          <p style="margin-top:24px; color:#5B6472; font-size:13px;">— BINet Funnel Digitals</p>
        </div>`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}