export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  const userData = await userRes.json();
  if (!userRes.ok || !userData.id) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const profileRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role`,
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const profileData = await profileRes.json();
  if (!profileRes.ok || !profileData[0] || profileData[0].role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

 const { recipients, subject, message, isHtml } = req.body;
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
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
          to: [{ email: r.email, name: r.name || r.email }],
          subject: subject,
          htmlContent: buildBrandedHtml(subject, message, isHtml)
        })
      });
      if (response.ok) sent++; else failed++;
    } catch {
      failed++;
    }
  }

  return res.status(200).json({ success: true, sent, failed, total: recipients.length });
}

function buildBrandedHtml(subject, message, isHtml) {
  const body = isHtml
    ? message
    : `<p style="font-size:15px; line-height:1.6; color:#3d3d3a; white-space:pre-line;">${message}</p>`;
  return `
  <div style="background:#F6F7F9; padding:32px 0; font-family:Arial,sans-serif;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #E7E9EE;">
      <div style="background:#0A1628; padding:24px 32px;">
        <span style="color:#ffffff; font-weight:bold; font-size:18px;">BINet Funnel Digitals</span>
      </div>
      <div style="padding:32px; color:#0A1628;">
        <h2 style="margin:0 0 16px; font-size:20px;">${subject}</h2>
        ${body}
      </div>
      <div style="background:#F6F7F9; padding:20px 32px; border-top:1px solid #E7E9EE;">
        <p style="margin:0; font-size:13px; color:#5B6472;">Visibility. Customers. Growth.</p>
      </div>
    </div>
  </div>`;
}