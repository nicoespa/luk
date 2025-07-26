export default function handler(req, res) {
  res.status(200).json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY
  });
}
