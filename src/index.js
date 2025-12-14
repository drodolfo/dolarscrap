// src/index.js
import cron from 'node-cron';
import { chromium } from 'playwright';
import fs from 'fs-extra';
import pino from 'pino';
import { fileURLToPath } from 'url';

/**
 * Scraper de DÓLAR OFICIAL y DÓLAR BLUE de DolarHoy.com cada 10 minutos.
 * Consideraciones:
 * - Respeta robots.txt y Términos del sitio.
 * - Evita solicitar con demasiada frecuencia (10 min es razonable).
 * - No hardcodea credenciales.
 */

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty' }
});

const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url));
const OUTPUT_FILE = fileURLToPath(new URL('../data/dolar.json', import.meta.url));

// Página principal donde aparecen “Dólar blue” y “Dólar Oficial”
const TARGET_URL = 'https://www.dolarhoy.com/';

// Cabeceras amables para evitar bloqueos simples
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8'
};

// Utilidad: convierte textos tipo "$1.475,90" a número 1475.90
function parsePrice(text) {
  if (!text) return null;
  const norm = text
    .replace(/[^\d.,-]/g, '') // quita todo lo no numérico, $ y espacios
    .replace(/\./g, '') // remueve separador de miles
    .replace(',', '.'); // convierte decimal de coma a punto
  const num = Number(norm);
  return Number.isFinite(num) ? num : null;
}

/**
 * Extrae de la home de DolarHoy:
 * - Dólar blue: compra y venta
 * - Dólar oficial: compra y venta
 * - Dólar MEP: compra y venta
 * - Dólar cripto (USDT): compra y venta
 * - Contado con liqui: compra y venta
 *
 * Se basa en buscar tarjetas/secciones por título y luego sus campos "Compra" y "Venta".
 * Si la estructura de HTML cambia, habrá que ajustar selectores.
 */
async function scrape() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: DEFAULT_HEADERS
  });
  const page = await context.newPage();

  try {
    logger.info({ TARGET_URL }, 'Navegando a DolarHoy');
    // Usar 'load' en lugar de 'networkidle' para evitar timeouts por actividad continua
    await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 60000 });

    // Espera a que se rendericen las tarjetas con cotizaciones
    // Usamos evaluate para verificar que el contenido esté disponible
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      // Verificar que hay contenido de precios y las palabras clave
      return bodyText.includes('Compra') && bodyText.includes('Venta') && /\d[\d\.,]+/.test(bodyText);
    }, { timeout: 30000 });

    // Evalúa en el DOM: busca los bloques por título y extrae compra/venta
    const data = await page.evaluate(() => {
      // Helper para ubicar una tarjeta por su título visible
      // Excluye elementos de navegación (nav, header, links)
      function findCardByTitle(titleText) {
        // Busca elementos que contengan exactamente el título
        // Excluye elementos de navegación y links
        const all = Array.from(document.querySelectorAll('body *'));
        const titleEl = all.find(
          (el) => {
            // Excluir elementos de navegación
            if (el.closest('nav') || el.closest('header') || el.tagName === 'A') {
              return false;
            }
            // Verificar visibilidad básica
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return false;
            }
            // Buscar el texto exacto
            const text = el.textContent?.trim().toLowerCase() || '';
            return text === titleText.trim().toLowerCase();
          }
        );
        if (!titleEl) return null;

        // Sube al contenedor padre que tenga Compra/Venta cerca
        // Heurística: subir hasta encontrar un nodo que contenga ambos textos "Compra" y "Venta"
        let container = titleEl.parentElement;
        for (let i = 0; i < 10 && container; i++) {
          const txt = container.textContent?.toLowerCase() || '';
          // Buscar un contenedor que tenga "compra" y "venta" y números que parezcan precios
          if (txt.includes('compra') && txt.includes('venta') && /\d[\d\.,]+/.test(txt)) {
            break;
          }
          container = container.parentElement;
        }
        return container || titleEl.parentElement;
      }

      // Extrae los valores compra/venta dentro de un contenedor de tarjeta
      function extractCompraVenta(card) {
        if (!card) return { compra: null, venta: null };

        // Estrategia:
        // - Buscar nodos que digan “Compra” y tomar el siguiente número visible
        // - Buscar “Venta” y tomar el siguiente número visible
        function findValueAfterLabel(label) {
          const els = Array.from(card.querySelectorAll('*'));
          const elLabel = els.find(
            (el) => el.textContent?.trim().toLowerCase() === label
          );
          if (!elLabel) return null;

          // Buscar en el mismo contenedor cercano algún texto que luzca como precio
          // Ej: $1425, 1425,00 etc.
          const candidates = Array.from(elLabel.parentElement?.querySelectorAll('*') || []);
          const priceEl =
            candidates.find((el) => /\d[\d\.,]*$/.test(el.textContent?.trim() || '')) ||
            els.find((el) => {
              const txt = el.textContent?.trim() || '';
              return /\$?\d[\d\.,]*$/.test(txt) && el !== elLabel;
            });

          return priceEl?.textContent?.trim() || null;
        }

        const compraText =
          findValueAfterLabel('compra') ||
          // fallback: buscar el primer número en la tarjeta
          (Array.from(card.querySelectorAll('*'))
            .map((el) => el.textContent?.trim() || '')
            .find((t) => /\$?\d[\d\.,]*$/.test(t)) || null);

        const ventaText =
          findValueAfterLabel('venta') ||
          (Array.from(card.querySelectorAll('*'))
            .map((el) => el.textContent?.trim() || '')
            .find((t) => /\$?\d[\d\.,]*$/.test(t) && t !== compraText) || null);

        return { compraText, ventaText };
      }

      // Ubicar tarjetas
      const blueCard = findCardByTitle('Dólar blue');
      const oficialCard = findCardByTitle('Dólar Oficial');
      const mepCard = findCardByTitle('Dólar MEP');
      const criptoCard = findCardByTitle('Dólar cripto (USDT)') || findCardByTitle('Dólar Cripto (USDT)') || findCardByTitle('Dólar cripto USDT') || findCardByTitle('Dólar Cripto USDT');
      const cclCard = findCardByTitle('Contado con liqui') || findCardByTitle('Contado con Liqui') || findCardByTitle('Contado con Liquidación') || findCardByTitle('CCL');

      const { compraText: blueCompraText, ventaText: blueVentaText } =
        extractCompraVenta(blueCard);
      const { compraText: oficialCompraText, ventaText: oficialVentaText } =
        extractCompraVenta(oficialCard);
      const { compraText: mepCompraText, ventaText: mepVentaText } =
        extractCompraVenta(mepCard);
      const { compraText: criptoCompraText, ventaText: criptoVentaText } =
        extractCompraVenta(criptoCard);
      const { compraText: cclCompraText, ventaText: cclVentaText } =
        extractCompraVenta(cclCard);

      return {
        blue: {
          compraRaw: blueCompraText,
          ventaRaw: blueVentaText
        },
        oficial: {
          compraRaw: oficialCompraText,
          ventaRaw: oficialVentaText
        },
        mep: {
          compraRaw: mepCompraText,
          ventaRaw: mepVentaText
        },
        cripto: {
          compraRaw: criptoCompraText,
          ventaRaw: criptoVentaText
        },
        ccl: {
          compraRaw: cclCompraText,
          ventaRaw: cclVentaText
        }
      };
    });

    // Parseo seguro a número
    const result = {
      blue: {
        compra: parsePrice(data?.blue?.compraRaw || null),
        venta: parsePrice(data?.blue?.ventaRaw || null)
      },
      oficial: {
        compra: parsePrice(data?.oficial?.compraRaw || null),
        venta: parsePrice(data?.oficial?.ventaRaw || null)
      },
      mep: {
        compra: parsePrice(data?.mep?.compraRaw || null),
        venta: parsePrice(data?.mep?.ventaRaw || null)
      },
      cripto: {
        compra: parsePrice(data?.cripto?.compraRaw || null),
        venta: parsePrice(data?.cripto?.ventaRaw || null)
      },
      ccl: {
        compra: parsePrice(data?.ccl?.compraRaw || null),
        venta: parsePrice(data?.ccl?.ventaRaw || null)
      }
    };

    const timestamp = new Date().toISOString();
    const record = {
      timestamp,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      source: TARGET_URL,
      data: result
    };

    // Validación: al menos un valor numérico
    const hasValues =
      [result.blue.compra, result.blue.venta, result.oficial.compra, result.oficial.venta, result.mep.compra, result.mep.venta, result.cripto.compra, result.cripto.venta, result.ccl.compra, result.ccl.venta]
        .some((v) => typeof v === 'number' && Number.isFinite(v));

    if (!hasValues) {
      throw new Error('No se obtuvieron valores válidos. Ajusta selectores; el sitio puede haber cambiado.');
    }

    await fs.ensureDir(DATA_DIR);
    
    // Leer archivo existente con manejo de errores
    let previous = [];
    if (await fs.pathExists(OUTPUT_FILE)) {
      try {
        const existing = await fs.readJSON(OUTPUT_FILE);
        // Asegurar que es un array
        previous = Array.isArray(existing) ? existing : [];
      } catch (err) {
        logger.warn({ error: err.message }, 'Error leyendo archivo existente, se creará uno nuevo');
        previous = [];
      }
    }
    
    previous.push(record);
    await fs.writeJSON(OUTPUT_FILE, previous, { spaces: 2 });

    logger.info(record, 'Cotizaciones guardadas');
  } catch (err) {
    logger.error({ error: err.message }, 'Error durante el scraping');
    throw err;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

function schedule() {
  // Ejecutar inmediatamente
  scrape().catch((e) => logger.error({ e: e.message }, 'Fallo en ejecución inicial'));

  // Cada 10 minutos
  cron.schedule('*/10 * * * *', async () => {
    logger.info('Ejecución programada: cada 10 minutos');
    try {
      await scrape();
    } catch (e) {
      logger.error({ e: e.message }, 'Fallo en ejecución programada');
    }
  });
}

// Entrada
schedule();
