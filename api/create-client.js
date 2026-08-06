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

  const { email, password, business_name, contact_name, phone } = req.body;
  if (!email || !password || !business_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const createRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { business_name, contact_name, phone }
    })
  });
  const createData = await createRes.json();

  if (!createRes.ok) {
    return res.status(createRes.status).json({ error: createData });
  }

  return res.status(200).json({ success: true, user: createData });
}