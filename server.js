// server.js - Simple Express server to serve the HTML and JSON data
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, etc.)
app.use(express.static(__dirname));

// API endpoint to get the latest data
app.get('/api/data', (req, res) => {
  const dataPath = join(__dirname, 'data', 'dolar.json');
  
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      const jsonData = JSON.parse(data);
      
      // Return the latest record
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        res.json(jsonData[jsonData.length - 1]);
      } else {
        res.json({ error: 'No data available' });
      }
    } else {
      res.json({ error: 'Data file not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get all historical data
app.get('/api/history', (req, res) => {
  const dataPath = join(__dirname, 'data', 'dolar.json');
  
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Start the scraper in the background
// This allows the scraper to run alongside the web server
async function startScraper() {
  if (process.env.START_SCRAPER === 'false') {
    console.log('⏸️  Scraper disabled (START_SCRAPER=false)');
    return;
  }

  try {
    console.log('🔄 Starting scraper in background...');
    // Import and start the scraper - it will run schedule() automatically
    await import('./src/index.js');
    console.log('✅ Scraper started successfully');
  } catch (err) {
    console.error('❌ Error starting scraper:', err.message);
    // Don't crash the server if scraper fails to start
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 View the dashboard at http://localhost:${PORT}`);
  
  // Start scraper in background (non-blocking)
  startScraper();
});

