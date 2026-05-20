import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Secure server-side initialization of the GoogleGenAI client with AI Studio build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Check if Gemini API key is configured
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// Proxy text/JSON generation requests securely
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, model = 'gemini-3.5-flash', jsonSchema } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured. Please add it via the Secrets panel in AI Studio Settings."
      });
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (jsonSchema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = jsonSchema;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config
    });

    res.json({
      text: response.text
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during generative processing." });
  }
});

// Proxy image generation requests securely (doodles for nodes)
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured. Please add it via the Secrets panel in AI Studio Settings."
      });
    }

    // Call generateContent using the default image generation model gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Design a high-quality, clean, simple minimalist vector icon, visual symbol, or neat monochrome line-art illustration representing the concept: "${prompt}". Create it on a solid pure white background with smooth lines and zero clutter.`,
    });

    let base64Image = '';
    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      return res.status(500).json({ error: "The model did not return image data for this concept." });
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`
    });
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during illustration generation." });
  }
});

// Configure Vite integration for SPA Dev environments and production builds
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  console.log('Vite development server loaded in middleware mode.');
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
  console.log('Production build serving static directory: /dist');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MindFlow AI] custom full-stack server running at http://0.0.0.0:${PORT}`);
});
