# Dólar Scraper - DolarHoy.com

Scraper que obtiene las cotizaciones de diferentes tipos de dólar desde DolarHoy.com cada 10 minutos.

## Tipos de dólar extraídos

- **Dólar Blue**: compra y venta
- **Dólar Oficial**: compra y venta
- **Dólar MEP**: compra y venta
- **Dólar Cripto (USDT)**: compra y venta
- **Contado con Liqui**: compra y venta
- **Dólar Tarjeta**: venta

## Instalación

```bash
npm install
```

## Uso

### Ejecutar el scraper

```bash
npm run scrape
```

El scraper se ejecutará cada 10 minutos y guardará los datos en `data/dolar.json`.

### Ejecutar el servidor web

```bash
npm start
```

Esto iniciará un servidor Express en `http://localhost:3000` que mostrará los datos en una interfaz web.

## Despliegue Online

### Opción 1: Railway

1. Crea una cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio
3. Railway detectará automáticamente el proyecto Node.js
4. Asegúrate de que el script `start` esté configurado en `package.json`
5. Railway asignará una URL pública automáticamente

### Opción 2: Render

1. Crea una cuenta en [Render](https://render.com)
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Render asignará una URL pública

### Opción 3: Heroku

1. Crea una cuenta en [Heroku](https://heroku.com)
2. Instala Heroku CLI
3. Ejecuta:
   ```bash
   heroku create
   git push heroku main
   ```

### Opción 4: Vercel / Netlify

Para servicios estáticos, necesitarás separar el scraper del servidor:
- El scraper puede ejecutarse en un servicio separado (Railway, Render, etc.)
- El frontend puede desplegarse en Vercel/Netlify

## Variables de Entorno

- `PORT`: Puerto del servidor (por defecto: 3000)
- `LOG_LEVEL`: Nivel de logging (por defecto: 'info')

## Estructura del Proyecto

```
.
├── src/
│   └── index.js          # Scraper principal
├── data/
│   └── dolar.json        # Datos guardados
├── index.html            # Interfaz web
├── server.js             # Servidor Express
└── package.json
```

## Notas

- El scraper respeta los términos del sitio web
- Los datos se actualizan cada 10 minutos
- Los datos históricos se guardan en formato JSON
