export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  try {
    const templatesRes = await fetch('https://api.brevo.com/v3/smtp/templates?templateStatus=true&limit=50', {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });
    const templatesData = await templatesRes.json();

    if (!templatesRes.ok) {
      return res.status(templatesRes.status).json({ error: templatesData });
    }

    const simplified = (templatesData.templates || []).map(t => ({
      id: t.id,
      name: t.name,
      subject: t.subject
    }));

    return res.status(200).json({ templates: simplified });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}