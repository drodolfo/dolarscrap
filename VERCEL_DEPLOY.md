# Guía de Despliegue en Vercel

## Pasos para Desplegar

### 1. Preparación

Asegúrate de tener:
- Una cuenta en [Vercel](https://vercel.com)
- El proyecto en un repositorio de GitHub (recomendado)

### 2. Instalación de Vercel CLI (Opcional)

```bash
npm i -g vercel
```

### 3. Despliegue

#### Opción A: Desde la Web (Más fácil)

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Add New Project"
3. Conecta tu repositorio de GitHub
4. Vercel detectará automáticamente la configuración desde `vercel.json`
5. Haz clic en "Deploy"
6. Espera a que termine el despliegue

#### Opción B: Desde la Terminal

```bash
# Inicia sesión
vercel login

# Despliega
vercel

# Para producción
vercel --prod
```

### 4. Configurar Cron Job

Después del despliegue, configura el cron job para ejecutar el scraper cada 10 minutos:

1. Ve a tu proyecto en [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Cron Jobs**
4. Haz clic en **Add Cron Job**
5. Configura:
   - **Path**: `/api/scrape`
   - **Schedule**: `*/10 * * * *` (cada 10 minutos)
6. Guarda los cambios

### 5. Configurar Almacenamiento (Opcional pero Recomendado)

Vercel tiene un sistema de archivos de solo lectura. Para almacenar datos persistentes, necesitas una base de datos externa.

#### Opción 1: Vercel KV (Recomendado)

1. En tu proyecto Vercel, ve a **Storage** → **Create Database** → **KV**
2. Conecta la base de datos
3. Actualiza `api/scrape.js` para usar Vercel KV en lugar de archivos

#### Opción 2: MongoDB Atlas (Gratis)

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén la connection string
4. Agrega la variable de entorno `MONGODB_URI` en Vercel
5. Actualiza el código para usar MongoDB

#### Opción 3: Supabase (Gratis)

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Obtén las credenciales
4. Agrega las variables de entorno en Vercel
5. Actualiza el código para usar Supabase

### 6. Variables de Entorno (Si es necesario)

Si usas servicios externos, agrega las variables de entorno:

1. Ve a **Settings** → **Environment Variables**
2. Agrega las variables necesarias
3. Vuelve a desplegar

## Estructura del Proyecto para Vercel

```
.
├── api/
│   ├── data.js          # API endpoint para obtener datos
│   ├── history.js       # API endpoint para historial
│   └── scrape.js        # Función serverless para scraping
├── data/
│   └── dolar.json       # Datos (solo lectura en Vercel)
├── index.html           # Frontend
├── vercel.json          # Configuración de Vercel
└── package.json
```

## URLs Generadas

Después del despliegue, Vercel te dará:
- **URL de producción**: `https://tu-proyecto.vercel.app`
- **URL de preview**: Para cada push a GitHub

## Actualización Automática

Cada vez que hagas push a GitHub, Vercel:
1. Detectará los cambios automáticamente
2. Creará un nuevo deployment
3. Si está en la rama principal, actualizará producción

## Monitoreo

- Ve a **Deployments** para ver el historial
- Ve a **Functions** para ver logs de las funciones serverless
- Ve a **Cron Jobs** para ver el estado de los cron jobs

## Solución de Problemas

### El scraper no se ejecuta

1. Verifica que el cron job esté configurado correctamente
2. Revisa los logs en **Functions** → `/api/scrape`
3. Asegúrate de que el schedule sea correcto: `*/10 * * * *`

### Error de timeout

- Las funciones serverless tienen límites de tiempo
- Plan gratuito: 10 segundos
- Plan Pro: 60 segundos
- Si el scraping toma más tiempo, considera optimizar o usar otro servicio

### Datos no persisten

- Vercel tiene sistema de archivos de solo lectura
- Necesitas usar una base de datos externa (Vercel KV, MongoDB, etc.)
- O actualiza el código para usar el almacenamiento externo

## Alternativas Recomendadas

Para proyectos con scraping continuo, considera:
- **Railway**: Mejor para procesos de larga duración
- **Render**: Similar a Railway, fácil de usar
- **Heroku**: Clásico pero con límites en plan gratuito

