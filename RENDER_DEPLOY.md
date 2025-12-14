# 🚀 Guía de Despliegue en Render

Render es ideal para este proyecto porque soporta procesos de larga duración y almacenamiento persistente.

## Pasos para Desplegar

### 1. Preparación

- Crea una cuenta en [Render](https://render.com) (gratis)
- Asegúrate de que tu proyecto esté en GitHub, GitLab o Bitbucket

### 2. Crear un Web Service

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio:
   - Si es la primera vez, autoriza Render para acceder a tu cuenta de GitHub/GitLab
   - Selecciona el repositorio del proyecto
   - Haz clic en **"Connect"**

### 3. Configurar el Servicio

Completa la configuración:

- **Name**: `dolar-scraper` (o el nombre que prefieras)
- **Region**: Selecciona la región más cercana (ej: `Oregon (US West)`)
- **Branch**: `main` (o la rama que uses)
- **Root Directory**: (déjalo vacío, usa la raíz)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (o `Starter` si quieres más recursos)

### 4. Variables de Entorno (Opcional)

Si necesitas configurar el puerto u otras variables:

- **Key**: `PORT`
- **Value**: `10000` (Render asigna automáticamente, pero puedes especificarlo)

Render automáticamente asigna el puerto, así que no es necesario configurarlo.

### 5. Desplegar

1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. Espera a que termine (puede tomar 2-5 minutos)
4. Una vez completado, verás la URL de tu aplicación: `https://tu-app.onrender.com`

### 6. Configurar el Scraper (Opcional)

Tienes dos opciones:

#### Opción A: Ejecutar Scraper y Servidor Juntos

El `server.js` actual solo sirve el frontend. Puedes modificar para que también ejecute el scraper en segundo plano, o ejecutar ambos procesos.

#### Opción B: Crear un Background Worker Separado

1. En Render Dashboard, haz clic en **"New +"** → **"Background Worker"**
2. Conecta el mismo repositorio
3. Configura:
   - **Name**: `dolar-scraper-worker`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run scrape`
4. Haz clic en **"Create Background Worker"**

Esto ejecutará el scraper cada vez que se inicie el worker. Para ejecutarlo cada 10 minutos, el scraper ya tiene `node-cron` configurado.

## Configuración Recomendada

### Para el Web Service (Frontend + API):

```
Name: dolar-scraper
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### Para el Background Worker (Scraper):

```
Name: dolar-scraper-worker
Environment: Node
Build Command: npm install
Start Command: npm run scrape
Plan: Free
```

## Estructura del Proyecto

Render ejecutará:
- **Web Service**: `npm start` → ejecuta `server.js` → sirve el frontend y API
- **Background Worker**: `npm run scrape` → ejecuta `src/index.js` → ejecuta el scraper cada 10 minutos

## Características de Render

✅ **Almacenamiento Persistente**: Puedes escribir en `data/dolar.json`  
✅ **Procesos de Larga Duración**: Perfecto para el scraper con cron  
✅ **Plan Gratuito**: Incluye 750 horas/mes  
✅ **Auto-Deploy**: Se actualiza automáticamente con cada push a GitHub  
✅ **Logs en Tiempo Real**: Puedes ver los logs en el dashboard  

## Monitoreo

- **Logs**: Ve a tu servicio → **"Logs"** para ver logs en tiempo real
- **Metrics**: Ve a **"Metrics"** para ver uso de CPU, memoria, etc.
- **Events**: Ve a **"Events"** para ver el historial de deployments

## Actualización Automática

Cada vez que hagas `git push` a tu repositorio:
1. Render detectará los cambios automáticamente
2. Reconstruirá la aplicación
3. Redesplegará con los nuevos cambios

## Solución de Problemas

### El servicio no inicia

1. Revisa los logs en Render Dashboard
2. Verifica que `package.json` tenga el script `start` correcto
3. Asegúrate de que todas las dependencias estén en `package.json`

### El scraper no se ejecuta

1. Verifica que el Background Worker esté corriendo
2. Revisa los logs del worker
3. Asegúrate de que `node-cron` esté instalado

### Error de timeout

- El plan gratuito tiene límites de tiempo
- Si el scraper tarda mucho, considera optimizarlo
- O actualiza a un plan de pago

### Datos no se guardan

- Render tiene almacenamiento persistente
- Verifica que el directorio `data/` exista
- Revisa los permisos de escritura en los logs

## URLs Generadas

Después del despliegue:
- **Web Service**: `https://tu-app.onrender.com`
- **API Data**: `https://tu-app.onrender.com/api/data`
- **API History**: `https://tu-app.onrender.com/api/history`

## Costos

- **Plan Gratuito**: 
  - 750 horas/mes
  - Se "duerme" después de 15 minutos de inactividad (se despierta en la primera solicitud)
  - Perfecto para proyectos personales

- **Plan Starter** ($7/mes):
  - Siempre activo
  - Mejor para producción

## Recomendación

Para este proyecto, usa:
1. **Web Service** para el frontend y API
2. **Background Worker** para el scraper (opcional, ya que el scraper tiene cron integrado)

O simplemente ejecuta todo en un solo Web Service si prefieres simplicidad.

