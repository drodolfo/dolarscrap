// api/scrape.js - Vercel serverless function to run the scraper
// This will be called by Vercel Cron every 10 minutes
import { chromium } from 'playwright';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the scrape function logic
const TARGET_URL = 'https://www.dolarhoy.com/';
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8'
};

function parsePrice(text) {
  if (!text) return null;
  const norm = text
    .replace(/[^\d.,-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(norm);
  return Number.isFinite(num) ? num : null;
}

export default async function handler(req, res) {
  // Only allow POST requests (from Vercel Cron) or GET for manual triggers
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: DEFAULT_HEADERS
  });
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 60000 });
    
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Compra') && bodyText.includes('Venta') && /\d[\d\.,]+/.test(bodyText);
    }, { timeout: 30000 });

    const data = await page.evaluate(() => {
      function findCardByTitle(titleText) {
        const all = Array.from(document.querySelectorAll('body *'));
        const titleEl = all.find((el) => {
          if (el.closest('nav') || el.closest('header') || el.tagName === 'A') {
            return false;
          }
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
          const text = el.textContent?.trim().toLowerCase() || '';
          return text === titleText.trim().toLowerCase();
        });
        if (!titleEl) return null;

        let container = titleEl.parentElement;
        for (let i = 0; i < 10 && container; i++) {
          const txt = container.textContent?.toLowerCase() || '';
          if (txt.includes('compra') && txt.includes('venta') && /\d[\d\.,]+/.test(txt)) {
            break;
          }
          container = container.parentElement;
        }
        return container || titleEl.parentElement;
      }

      function extractCompraVenta(card) {
        if (!card) return { compraText: null, ventaText: null };

        function findValueAfterLabel(label) {
          const els = Array.from(card.querySelectorAll('*'));
          const elLabel = els.find((el) => el.textContent?.trim().toLowerCase() === label);
          if (!elLabel) return null;

          const candidates = Array.from(elLabel.parentElement?.querySelectorAll('*') || []);
          const priceEl =
            candidates.find((el) => /\d[\d\.,]*$/.test(el.textContent?.trim() || '')) ||
            els.find((el) => {
              const txt = el.textContent?.trim() || '';
              return /\$?\d[\d\.,]*$/.test(txt) && el !== elLabel;
            });

          return priceEl?.textContent?.trim() || null;
        }

        const compraText = findValueAfterLabel('compra') ||
          (Array.from(card.querySelectorAll('*'))
            .map((el) => el.textContent?.trim() || '')
            .find((t) => /\$?\d[\d\.,]*$/.test(t)) || null);

        const ventaText = findValueAfterLabel('venta') ||
          (Array.from(card.querySelectorAll('*'))
            .map((el) => el.textContent?.trim() || '')
            .find((t) => /\$?\d[\d\.,]*$/.test(t) && t !== compraText) || null);

        return { compraText, ventaText };
      }

      function extractVentaTarjeta(card) {
        if (!card) return null;
        const allElements = Array.from(card.querySelectorAll('*'));
        const ventaLabel = allElements.find((el) => {
          const text = el.textContent?.trim().toLowerCase() || '';
          return text === 'venta';
        });
        if (!ventaLabel) return null;

        const parent = ventaLabel.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const labelIndex = siblings.indexOf(ventaLabel);
          
          for (let i = labelIndex + 1; i < siblings.length; i++) {
            const text = siblings[i].textContent?.trim() || '';
            const priceMatch = text.match(/[\$]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
            if (priceMatch) {
              return priceMatch[0].trim();
            }
          }
          
          const parentText = parent.textContent || '';
          const parts = parentText.split(/venta/i);
          if (parts.length > 1) {
            const afterVenta = parts[1].substring(0, 100);
            const priceMatch = afterVenta.match(/[\$]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
            if (priceMatch) {
              return priceMatch[0].trim();
            }
          }
        }
        
        const cardText = card.textContent || '';
        const cardParts = cardText.split(/venta/i);
        if (cardParts.length > 1) {
          const afterVenta = cardParts[1].substring(0, 100);
          const priceMatch = afterVenta.match(/[\$]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
          if (priceMatch) {
            return priceMatch[0].trim();
          }
        }
        
        return null;
      }

      const blueCard = findCardByTitle('Dólar blue');
      const oficialCard = findCardByTitle('Dólar Oficial');
      const mepCard = findCardByTitle('Dólar MEP');
      const criptoCard = findCardByTitle('Dólar cripto (USDT)') || findCardByTitle('Dólar Cripto (USDT)') || findCardByTitle('Dólar cripto USDT') || findCardByTitle('Dólar Cripto USDT');
      const cclCard = findCardByTitle('Contado con liqui') || findCardByTitle('Contado con Liqui') || findCardByTitle('Contado con Liquidación') || findCardByTitle('CCL');
      const tarjetaCard = findCardByTitle('Dólar Tarjeta');

      const { compraText: blueCompraText, ventaText: blueVentaText } = extractCompraVenta(blueCard);
      const { compraText: oficialCompraText, ventaText: oficialVentaText } = extractCompraVenta(oficialCard);
      const { compraText: mepCompraText, ventaText: mepVentaText } = extractCompraVenta(mepCard);
      const { compraText: criptoCompraText, ventaText: criptoVentaText } = extractCompraVenta(criptoCard);
      const { compraText: cclCompraText, ventaText: cclVentaText } = extractCompraVenta(cclCard);
      const tarjetaVentaText = extractVentaTarjeta(tarjetaCard);

      return {
        blue: { compraRaw: blueCompraText, ventaRaw: blueVentaText },
        oficial: { compraRaw: oficialCompraText, ventaRaw: oficialVentaText },
        mep: { compraRaw: mepCompraText, ventaRaw: mepVentaText },
        cripto: { compraRaw: criptoCompraText, ventaRaw: criptoVentaText },
        ccl: { compraRaw: cclCompraText, ventaRaw: cclVentaText },
        tarjeta: { ventaRaw: tarjetaVentaText }
      };
    });

    const result = {
      blue: { compra: parsePrice(data?.blue?.compraRaw || null), venta: parsePrice(data?.blue?.ventaRaw || null) },
      oficial: { compra: parsePrice(data?.oficial?.compraRaw || null), venta: parsePrice(data?.oficial?.ventaRaw || null) },
      mep: { compra: parsePrice(data?.mep?.compraRaw || null), venta: parsePrice(data?.mep?.ventaRaw || null) },
      cripto: { compra: parsePrice(data?.cripto?.compraRaw || null), venta: parsePrice(data?.cripto?.ventaRaw || null) },
      ccl: { compra: parsePrice(data?.ccl?.compraRaw || null), venta: parsePrice(data?.ccl?.ventaRaw || null) },
      tarjeta: { venta: parsePrice(data?.tarjeta?.ventaRaw || null) }
    };

    const timestamp = new Date().toISOString();
    const record = {
      timestamp,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      source: TARGET_URL,
      data: result
    };

    // Note: Vercel file system is read-only, so we'll return the data
    // For persistent storage, consider using Vercel KV or external storage
    res.status(200).json({ 
      success: true, 
      message: 'Scraping completed',
      data: record 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

