# ⚡ Despliegue Rápido en Netlify

## Pasos Rápidos (5 minutos)

### 1. Preparar el Repositorio

Asegúrate de que `data/dolar.json` esté en el repositorio (no en .gitignore):

```bash
git add data/dolar.json
git commit -m "Add initial data file"
git push
```

### 2. Crear Cuenta en Netlify

Ve a [netlify.com](https://netlify.com) y crea una cuenta (gratis con GitHub)

### 3. Desplegar

1. En Netlify Dashboard, haz clic en **"Add new site"** → **"Import an existing project"**
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio
4. Configura:
   - **Build command**: (déjalo vacío)
   - **Publish directory**: `.` (punto, raíz del proyecto)
5. Haz clic en **"Deploy site"**

### 4. Configurar GitHub Actions (Para Datos Dinámicos)

El scraper se ejecutará automáticamente cada 10 minutos vía GitHub Actions:

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Actions** → **General**
3. Asegúrate de que "Allow all actions and reusable workflows" esté habilitado
4. El workflow `.github/workflows/scrape.yml` se ejecutará automáticamente

### 5. ¡Listo!

Tu sitio estará en: `https://tu-sitio.netlify.app`

## ✅ Cómo Funciona

1. **GitHub Actions** ejecuta el scraper cada 10 minutos
2. El scraper actualiza `data/dolar.json` en GitHub
3. **Netlify** lee el archivo a través de las funciones serverless
4. El frontend muestra los datos actualizados

## 🔄 Actualización de Datos

Los datos se actualizan automáticamente:
- **Cada 10 minutos**: GitHub Actions ejecuta el scraper
- **Automático**: Netlify lee el archivo actualizado
- **Sin intervención**: Todo funciona automáticamente

## 📝 Notas

- **Primera vez**: Puede tardar unos minutos en instalar dependencias
- **GitHub Actions**: Gratis hasta 2000 minutos/mes (más que suficiente)
- **Netlify**: Plan gratuito incluye 100GB de ancho de banda

## 🛠️ Verificar

1. Ve a tu sitio: `https://tu-sitio.netlify.app`
2. Revisa GitHub Actions: Ve a tu repo → **Actions** para ver los runs del scraper
3. Revisa Netlify Functions: Dashboard → **Functions** → **Logs**

## ⚙️ Configuración Manual del Workflow (Si es necesario)

Si GitHub Actions no se ejecuta automáticamente:

1. Ve a tu repositorio → **Actions**
2. Deberías ver el workflow "Scrape Dolar Data"
3. Si no aparece, verifica que el archivo `.github/workflows/scrape.yml` esté en el repo
4. Haz un commit y push del archivo
