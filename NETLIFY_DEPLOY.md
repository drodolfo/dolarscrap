# 🚀 Guía de Despliegue en Netlify

Netlify es excelente para el frontend, pero tiene limitaciones para procesos de larga duración. Esta guía explica cómo desplegar con datos dinámicos.

## ⚠️ Limitaciones de Netlify

- **Sistema de archivos**: Solo lectura (no puedes escribir archivos)
- **Funciones serverless**: Timeout de 10 segundos (plan gratuito) o 26 segundos (Pro)
- **Sin cron nativo**: No hay soporte para cron jobs

## Solución: Datos Dinámicos en Netlify

Para tener datos dinámicos en Netlify, tienes dos opciones:

### Opción 1: JSON en el Repositorio (Recomendado para Simplicidad)

El archivo `data/dolar.json` se actualiza en GitHub y Netlify lo lee:

1. **Ejecuta el scraper localmente o en otro servicio** (Railway, Render, etc.)
2. **El scraper actualiza el archivo** `data/dolar.json` en GitHub
3. **Netlify lee el archivo** a través de las funciones serverless
4. **Netlify se actualiza automáticamente** cuando detecta cambios en GitHub

### Opción 2: Base de Datos Externa

Usa una base de datos externa (MongoDB, Supabase, etc.) y las funciones de Netlify leen de ahí.

## Pasos para Desplegar

### 1. Preparación

- Crea una cuenta en [Netlify](https://netlify.com) (gratis)
- Asegúrate de que tu proyecto esté en GitHub, GitLab o Bitbucket

### 2. Desplegar desde GitHub

1. Ve a [app.netlify.com](https://app.netlify.com)
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio del proyecto

### 3. Configurar el Build

Netlify detectará automáticamente la configuración desde `netlify.toml`, pero verifica:

```
Build command: (déjalo vacío o: npm install)
Publish directory: . (raíz del proyecto)
```

### 4. Variables de Entorno (Opcional)

Si necesitas variables de entorno:
- Ve a **Site settings** → **Environment variables**
- Agrega las variables necesarias

### 5. Desplegar

1. Haz clic en **"Deploy site"**
2. Espera a que termine el build (1-2 minutos)
3. ¡Listo! Tu sitio estará en `https://tu-sitio.netlify.app`

## Configuración del Scraper

Como Netlify no puede ejecutar el scraper directamente, tienes estas opciones:

### Opción A: Scraper en GitHub Actions (Recomendado)

Crea `.github/workflows/scrape.yml`:

```yaml
name: Scrape Dolar Data

on:
  schedule:
    - cron: '*/10 * * * *'  # Cada 10 minutos
  workflow_dispatch:  # Permite ejecución manual

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run scrape
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/dolar.json
          git commit -m "Update dolar data" || exit 0
          git push
```

Esto ejecutará el scraper cada 10 minutos y actualizará el JSON en GitHub, que Netlify leerá automáticamente.

### Opción B: Scraper en Otro Servicio

Ejecuta el scraper en Railway, Render, o similar, y que actualice el archivo en GitHub vía API.

### Opción C: Netlify Build Hook + Servicio Externo

1. Crea un Build Hook en Netlify
2. Ejecuta el scraper en otro servicio
3. Después de actualizar el JSON, dispara el Build Hook para que Netlify se actualice

## Estructura para Netlify

```
.
├── netlify/
│   └── functions/
│       ├── data.js        # GET /.netlify/functions/data
│       └── history.js     # GET /.netlify/functions/history
├── data/
│   └── dolar.json         # Datos (se actualiza vía GitHub)
├── index.html             # Frontend
└── netlify.toml           # Configuración
```

## URLs Generadas

Después del despliegue:
- **Sitio**: `https://tu-sitio.netlify.app`
- **API Data**: `https://tu-sitio.netlify.app/.netlify/functions/data`
- **API History**: `https://tu-sitio.netlify.app/.netlify/functions/history`

## Actualización Automática

Con GitHub Actions:
1. El scraper se ejecuta cada 10 minutos
2. Actualiza `data/dolar.json` en GitHub
3. Netlify detecta el cambio automáticamente
4. Netlify redeploya (opcional) o las funciones leen el nuevo archivo

## Monitoreo

- **Deploys**: Ve a **Deploys** para ver el historial
- **Functions**: Ve a **Functions** para ver logs de las funciones serverless
- **Analytics**: Ve a **Analytics** para ver estadísticas del sitio

## Solución de Problemas

### Las funciones no funcionan

1. Verifica que `netlify.toml` esté configurado correctamente
2. Revisa los logs en **Functions** → **Logs**
3. Asegúrate de que las funciones estén en `netlify/functions/`

### Los datos no se actualizan

1. Verifica que el scraper esté ejecutándose (GitHub Actions, etc.)
2. Revisa que `data/dolar.json` se esté actualizando en GitHub
3. Las funciones de Netlify leen el archivo en cada request

### Error de timeout

- Las funciones tienen límite de 10 segundos (gratis)
- Si el archivo es muy grande, considera optimizar o usar base de datos externa

## Recomendación

Para este proyecto, la mejor opción es:
1. **Frontend en Netlify** (rápido y gratuito)
2. **Scraper en GitHub Actions** (gratis, ejecuta cada 10 minutos)
3. **Datos en el repositorio** (simple y efectivo)

Esto te da lo mejor de ambos mundos: hosting rápido y gratuito para el frontend, y scraping automático sin costo adicional.

