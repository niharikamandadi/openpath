require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/explain', async (req, res) => {
  const { prompt } = req.body;
  console.log('Explain request received');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing from environment variables');
    return res.status(500).json({ error: 'Server misconfigured: missing API key' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: `Gemini API error: ${response.status}`, details: errText });
    }

    const data = await response.json();
    console.log('Gemini raw response:', JSON.stringify(data));
    res.json(data);
  } catch (err) {
    console.error('Explain route crashed:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OpenPath running on port ${PORT}`);
});