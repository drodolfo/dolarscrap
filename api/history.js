// api/history.js - Vercel serverless function to get all historical data
import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  try {
    const dataPath = join(process.cwd(), 'data', 'dolar.json');
    
    try {
      const data = await readFile(dataPath, 'utf-8');
      const jsonData = JSON.parse(data);
      res.status(200).json(jsonData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(200).json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

