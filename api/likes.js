const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const likes = (await kv.get(`likes:${userId}`)) || [];
      return res.status(200).json(Array.isArray(likes) ? likes : []);
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId, tournamentId, liked } = data;

          if (!userId || !tournamentId) {
            return res.status(400).json({ error: 'userId and tournamentId are required' });
          }

          const key = `likes:${userId}`;
          const current = (await kv.get(key)) || [];
          const set = new Set(Array.isArray(current) ? current : []);

          if (liked) {
            set.add(tournamentId);
          } else {
            set.delete(tournamentId);
          }

          const updated = Array.from(set);
          await kv.set(key, updated);

          return res.status(200).json({ ok: true, likes: updated });
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      });
      return;
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('Likes API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
