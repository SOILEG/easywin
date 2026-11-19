import { createHash } from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (Date.now() > Date.parse('2026-11-19T14:15:00Z')) return res.status(410).end();
  if (req.method === 'GET') return res.status(200).send('<form method="post"><button>Send both test events</button></form>');
  if (req.method !== 'POST') return res.status(405).end();
  const pixel = process.env.TIKTOK_PIXEL_ID;
  if (pixel !== 'DBV42BBC77U657ENQ410' || !process.env.TIKTOK_ACCESS_TOKEN) return res.status(409).send('Check Production pixel or token');
  const events = ['CompleteRegistration', 'Purchase'].map(event => ({
    event,
    event_time: Math.floor(Date.now() / 1000),
    event_id: 'easywin-token-retest-1911-' + event,
    page: { url: 'https://easymine67.vercel.app/' },
    user: { external_id: createHash('sha256').update('easywin-test-28155').digest('hex') },
    ...(event === 'Purchase' ? { properties: { currency: 'EUR', value: 1 } } : {})
  }));
  const result = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': process.env.TIKTOK_ACCESS_TOKEN },
    body: JSON.stringify({ event_source: 'web', event_source_id: pixel, test_event_code: 'TEST28155', data: events })
  });
  const { code, message, request_id } = await result.json();
  return res.status(result.ok && code === 0 ? 200 : 502).json({ code, message, request_id });
}
