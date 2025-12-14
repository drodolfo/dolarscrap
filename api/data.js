// api/data.js - Vercel serverless function to get latest data
import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  try {
    const dataPath = join(process.cwd(), 'data', 'dolar.json');
    
    try {
      const data = await readFile(dataPath, 'utf-8');
      const jsonData = JSON.parse(data);
      
      // Return the latest record
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        res.status(200).json(jsonData[jsonData.length - 1]);
      } else {
        res.status(200).json({ error: 'No data available' });
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(200).json({ error: 'Data file not found' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

