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
        htmlContent: buildBrandedHtml(subject, message)
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

function buildBrandedHtml(subject, message) {
  return `
  <div style="background:#F6F7F9; padding:32px 0; font-family:Arial,sans-serif;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #E7E9EE;">
      <div style="background:#0A1628; padding:24px 32px;">
        <span style="color:#ffffff; font-weight:bold; font-size:18px;">BINet Funnel Digitals</span>
      </div>
      <div style="padding:32px; color:#0A1628;">
        <h2 style="margin:0 0 16px; font-size:20px;">${subject}</h2>
        <p style="font-size:15px; line-height:1.6; color:#3d3d3a; white-space:pre-line;">${message}</p>
      </div>
      <div style="background:#F6F7F9; padding:20px 32px; border-top:1px solid #E7E9EE;">
        <p style="margin:0; font-size:13px; color:#5B6472;">Visibility. Customers. Growth.</p>
      </div>
    </div>
  </div>`;
}