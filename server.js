import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Middleware
app.use(express.json());
app.use(cors());

// Health check
app.get('/healthz', (req, res) => res.send('OK'));

// AI Brain conversation endpoint
app.post('/api/ai-prompt', async (req, res) => {
  const { systemPrompt, userPrompt } = req.body;

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'Missing prompts' });
  }

  if (userPrompt.length > 500) {
    return res.status(400).json({ error: 'Prompt too long' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    const aiRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      }
    );

    const aiData = await aiRes.json();
    
    if (!aiRes.ok) {
      console.error('Groq API error:', aiData);
      return res.status(500).json({ error: 'AI request failed' });
    }

    const response = aiData.choices?.[0]?.message?.content?.trim();
    
    if (!response) {
      return res.status(500).json({ error: 'Empty AI response' });
    }

    console.log(`AI: "${response}"`);
    res.json({ response });

  } catch (err) {
    console.error('AI error:', err);
    return res.status(500).json({ error: 'AI processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Groq API: ${GROQ_API_KEY ? '✓' : '✗'}`);
});