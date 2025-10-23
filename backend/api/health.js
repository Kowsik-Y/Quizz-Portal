// Vercel API route example: /api/health
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    status: 'OK',
    message: 'Quiz Portal API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
}