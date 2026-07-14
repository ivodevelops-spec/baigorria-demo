# Deploy Rápido — Baigorria Demo en Render

**Tiempo estimado: 10 minutos.** Todo el código está listo en GitHub.
No necesitas tocar código ni instalar nada localmente.

---

## Paso 0: Prerequisitos

- Una cuenta en **GitHub** (ya tenés)
- Acceso al repo: `https://github.com/ivodevelops-spec/baigorria-demo`
- Una cuenta en **Render** (creala ahora: https://render.com → Sign up con GitHub)

---

## Paso 1: Crear la base de datos PostgreSQL

1. En Render, click **New + → PostgreSQL**
2. Configurá:
   - **Name:** `baigorria-demo-db`
   - **Plan:** Free
   - **Region:** Oregon (US West)
3. Click **Create Database**
4. **IMPORTANTE:** Copiá la **Internal Database URL** (la que termina en `.render.com:5432/baigorria_demo_db`) — la vas a usar en el Paso 3.

> ⏳ La base de datos tarda ~2-3 minutos en crearse. Mientras tanto, hacé el Paso 2.

---

## Paso 2: Crear el Web Service

1. En Render, click **New + → Web Service**
2. Conectá GitHub → Autorizá Render → Elegí el repo `ivodevelops-spec/baigorria-demo`
3. Configurá:
   - **Name:** `baigorria-demo`
   - **Region:** Oregon (US West) — **misma que la DB**
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `cd web && npm install && npm run build && cd ../api && npm install`
   - **Start Command:** `cd api && node server.js`
   - **Plan:** Free
4. Click **Deploy Web Service** (NO configures las env vars todavía)

Render va a empezar el build. **Va a fallar la primera vez** porque le falta `DATABASE_URL`. Eso lo arreglamos en el Paso 3.

---

## Paso 3: Configurar variables de entorno

Mientras el build corre (o falla), andá a:

**Dashboard → baigorria-demo → Environment → Add Environment Variable**

Agregá estas variables UNA POR UNA:

| Variable | Valor | ¿De dónde? |
|----------|-------|------------|
| `NODE_ENV` | `production` | Fijo |
| `DATABASE_URL` | `[Internal Database URL]` | De la DB del Paso 1 |
| `META_VERIFY_TOKEN` | Click **"Generate Value"** | Lo genera Render |
| `SHEETS_WEBHOOK_SECRET` | Click **"Generate Value"** | Lo genera Render |

> **NO** agregues `JWT_SECRET` — Render ya lo genera automáticamente (está en `render.yaml` como `generateValue: true`).
> **NO** agregues `PORT` — Render lo asigna automáticamente (10000).

Después de agregarlas, click **Save Changes** → **Manual Deploy → Deploy latest commit**.

---

## Paso 4: Esperar el deploy

Render va a:
1. Instalar dependencias del frontend (`web/`)
2. Buildear React con Vite
3. Instalar dependencias del backend (`api/`)
4. Arrancar el servidor

⏳ **Tarda ~5 minutos** la primera vez.

Cuando termine, vas a ver en los logs:

```
Baigorria API + mock-ISIS + static en :10000
[schema] tablas y vistas listas
[seed] 236 leads cargados
[seed] ISIS: 12c 48a 48s 24p 12v
```

---

## Paso 5: Verificar que funciona

Abrí en el navegador:

```
https://baigorria-demo.onrender.com
```

O verificá con curl:

```bash
curl https://baigorria-demo.onrender.com/api/health
# → {"ok":true}
```

---

## Paso 5b: Probar login

Abrí la URL y logueate con cualquiera de estos usuarios:

| Usuario | Contraseña | Rol | Qué puede ver |
|---------|-----------|-----|---------------|
| `admin` | `admin123` | Admin | TODO (leads, pedidos, clientes, stock, ventas, analytics) |
| `florencia` | `flor123` | Ventas | Leads, clientes, ventas, analytics (NO puede ver facturas/PDFs) |
| `martin` | `martin123` | Logística | Pedidos, stock (NO ve montos, NO ve facturación) |

---

## Si algo sale mal (troubleshooting)

### ❌ "Cannot find module 'express'"
**Causa:** El build command no instaló las dependencias del backend.
**Fix:** Verificá que el Build Command sea exactamente:
```
cd web && npm install && npm run build && cd ../api && npm install
```

### ❌ "ECONNREFUSED" o "database does not exist"
**Causa:** `DATABASE_URL` incorrecta, o la DB no terminó de crearse.
**Fix:** Andá a PostgreSQL dashboard → copiá la **Internal Database String** (NO la external). Pegala en Environment Variables de `baigorria-demo`.

### ❌ La app carga pero no hay datos (tabla vacía)
**Causa:** El seed no se ejecutó.
**Fix:** Revisá los logs del último deploy. Si ves `[seed] 236 leads cargados` y `[seed] ISIS: 12c...` entonces los datos están. Si no, hacé **Manual Deploy → Deploy latest commit** para forzar reinicio.

### ❌ "No token" / Error 401 al loguearse
**Causa:** Render no generó `JWT_SECRET` automáticamente.
**Fix:** Andá a Environment → agregá manualmente `JWT_SECRET` con **Generate Value**.

---

## Después del deploy exitoso

1. **Mandale la URL al cliente:**
   ```
   https://baigorria-demo.onrender.com
   ```

2. **Credenciales sugeridas para el cliente:**
   - Usuario: `admin` / Contraseña: `admin123`
   - Decile que explore: Leads → Pedidos → Clientes → Stock → Analytics

3. **Cuando el cliente confirme que funciona:**
   - Migrar a Railway (no duerme) o Vercel + Neon
   - Configurar dominio `crm.baigorriaindustrial.com`
   - Conectar ERP ISIS real (cuando Florencia entregue la API)

---

## Email template para el cliente

```
Asunto: 🎉 Demo del sistema — Baigorria Industrial

Hola [Nombre del cliente],

Ya podés ver el sistema funcionando.

🔗 **Link de acceso:**
https://baigorria-demo.onrender.com

👤 **Usuario de prueba:**
- Usuario: admin
- Contraseña: admin123

Podés explorar:
✅ Leads comerciales (236 registros de ejemplo)
✅ Pedidos con estado y prioridad
✅ Clientes y artículos
✅ Stock disponible
✅ Dashboard con KPIs y Analytics
✅ Vista de logística (Martín) — sin montos
✅ Vista de ventas (Florencia) — con facturación

📌 **Nota:** La primera vez que entrés puede tardar ~30 segundos
en cargar (el servidor Free de Render "duerme" por inactividad).

Cualquier cosa me avisas,
Ivo
```

---

## Resumen (checklist)

- [x] Código en GitHub → `github.com/ivodevelops-spec/baigorria-demo`
- [x] `render.yaml` configurado con env vars completas
- [x] Frontend (Vite + React) build automático
- [x] Backend (Express) con schema auto-creación + seed data
- [x] 236 leads, 12 clientes, 48 artículos, 24 pedidos de demo
- [x] 3 usuarios de prueba (admin, florencia, martin)
- [ ] **Pendiente:** Crear PostgreSQL en Render
- [ ] **Pendiente:** Crear Web Service y setear `DATABASE_URL`
- [ ] **Pendiente:** Verificar health check ok
- [ ] **Pendiente:** Mandar link al cliente
