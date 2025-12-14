// netlify/functions/history.js - Netlify serverless function to get all historical data
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event, context) => {
  try {
    const dataPath = join(__dirname, '../../data/dolar.json');
    
    try {
      const data = await readFile(dataPath, 'utf-8');
      const jsonData = JSON.parse(data);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify(jsonData)
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify([])
        };
      } else {
        throw error;
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};


