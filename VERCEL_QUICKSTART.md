# 🚀 Despliegue Rápido en Vercel

## Pasos Rápidos

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Iniciar Sesión
```bash
vercel login
```

### 3. Desplegar
```bash
vercel
```

Sigue las instrucciones y cuando pregunte:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → `N` (primera vez)
- **Project name?** → Presiona Enter para usar el nombre por defecto
- **Directory?** → Presiona Enter (usa el directorio actual)

### 4. Configurar Cron Job

Después del despliegue:

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. **Settings** → **Cron Jobs**
4. **Add Cron Job**:
   - **Path**: `/api/scrape`
   - **Schedule**: `*/10 * * * *`
5. **Save**

### 5. ¡Listo!

Tu sitio estará disponible en: `https://tu-proyecto.vercel.app`

## ⚠️ Importante: Almacenamiento de Datos

Vercel tiene un sistema de archivos **de solo lectura**. El archivo `data/dolar.json` no se puede escribir desde las funciones serverless.

### Soluciones:

#### Opción 1: Vercel KV (Recomendado)
1. En Vercel Dashboard → **Storage** → **Create Database** → **KV**
2. Conecta la base de datos
3. Actualiza `api/scrape.js` para guardar en KV

#### Opción 2: MongoDB Atlas (Gratis)
1. Crea cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea cluster gratuito
3. Obtén connection string
4. Agrega variable `MONGODB_URI` en Vercel
5. Actualiza código para usar MongoDB

#### Opción 3: Usar el archivo JSON (Solo lectura)
- El archivo `data/dolar.json` puede estar en el repositorio
- Se actualiza manualmente o desde otro servicio
- Las funciones solo leen, no escriben

## Comandos Útiles

```bash
# Desplegar a producción
vercel --prod

# Ver logs
vercel logs

# Ver información del proyecto
vercel inspect

# Eliminar deployment
vercel remove
```

## Estructura para Vercel

```
.
├── api/              # Serverless functions
│   ├── data.js       # GET /api/data
│   ├── history.js   # GET /api/history  
│   └── scrape.js     # GET/POST /api/scrape (cron)
├── index.html        # Frontend
├── vercel.json       # Configuración
└── package.json
```

## Troubleshooting

**Error: Function timeout**
- Plan gratuito: 10 segundos máximo
- Plan Pro: 60 segundos
- Considera optimizar el scraper o usar Railway/Render

**Cron no ejecuta**
- Verifica que el cron esté configurado en Dashboard
- Revisa logs en Functions → `/api/scrape`
- Asegúrate del formato del schedule: `*/10 * * * *`

**Datos no persisten**
- Vercel no permite escribir archivos
- Usa Vercel KV, MongoDB, o Supabase para almacenamiento

