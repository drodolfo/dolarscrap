# ⚡ Despliegue Rápido en Render

## Pasos Rápidos (5 minutos)

### 1. Crear Cuenta
Ve a [render.com](https://render.com) y crea una cuenta (gratis con GitHub/Google)

### 2. Crear Web Service

1. En el dashboard, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio del proyecto

### 3. Configurar

Completa estos campos:

```
Name: dolar-scraper
Region: Oregon (US West) [o la más cercana]
Branch: main
Root Directory: [déjalo vacío]
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 4. Desplegar

1. Haz clic en **"Create Web Service"**
2. Espera 2-5 minutos mientras Render construye y despliega
3. ¡Listo! Tu app estará en `https://tu-app.onrender.com`

## ✅ Eso es Todo

El servidor web y el scraper se ejecutarán juntos automáticamente.

## 📝 Notas Importantes

- **Primera vez**: Puede tardar más porque Render instala Playwright y Chromium
- **Plan Gratuito**: Se "duerme" después de 15 min de inactividad, pero se despierta automáticamente
- **Auto-Deploy**: Cada push a GitHub actualiza automáticamente la app

## 🔍 Verificar que Funciona

1. Ve a tu URL: `https://tu-app.onrender.com`
2. Deberías ver el dashboard con las cotizaciones
3. Revisa los logs en Render Dashboard → **"Logs"** para ver el scraper ejecutándose

## 🛠️ Solución de Problemas

**Error en el build:**
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Render

**El scraper no ejecuta:**
- Revisa los logs en tiempo real
- Verifica que `node-cron` esté instalado

**La app está "dormida":**
- Es normal en plan gratuito
- Haz una solicitud y se despertará automáticamente
- O actualiza a plan Starter ($7/mes) para que esté siempre activa

