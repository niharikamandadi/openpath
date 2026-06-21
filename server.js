require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/explain', async (req, res) => {
  const { prompt } = req.body;
  console.log('Explain request received');
  const GEMINI_API_KEY = 'AQ.Ab8RN6LREyz1DI2zPg0nkwTcUKjsnE08tvpCr6j3mEMCBBkg1g';
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await response.json();
    console.log('Gemini raw response:', JSON.stringify(data));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OpenPath running on port ${PORT}`);
});