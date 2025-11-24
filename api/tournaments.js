import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 1. Получаем массив турниров (или пустой)
      const tournaments = (await kv.get('tournaments')) || [];

      // 2. Нормализуем "сегодня" до полуночи
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 3. Фильтруем: оставляем только те, у которых дата >= сегодня
      const filtered = tournaments.filter((t) => {
        if (!t.date) return true; // без даты не трогаем
        const d = new Date(t.date + 'T00:00:00'); // формат YYYY-MM-DD
        if (Number.isNaN(d.getTime())) return true; // если дата битая — тоже оставляем
        return d >= today;
      });

      // 4. Если что-то удалилось — сохраняем очищенный массив
      if (filtered.length !== tournaments.length) {
        await kv.set('tournaments', filtered);
      }

      // 5. Возвращаем уже очищенный список
      return res.status(200).json(filtered);
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);

          if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Body must be an array' });
          }

          await kv.set('tournaments', data);
          return res.status(200).json({ ok: true });
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      });
      return;
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('Tournaments API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
