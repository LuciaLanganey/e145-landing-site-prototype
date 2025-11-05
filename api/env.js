export default function handler(req, res) {
  res.status(200).json({
    siteName: process.env.SITE_NAME,
  });
}
