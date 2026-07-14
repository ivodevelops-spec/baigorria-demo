# Deploy Versión Demo — Baigorria Industrial

**Objetivo:** Deployar una versión demo pública del CRM para que el cliente pueda ver y probar el sistema antes de conectar sus datos reales.

---

## Opciones de Deploy

### Opción 1: Render (RECOMENDADO)

**Pros:**
- ✅ Deploy automático desde GitHub
- ✅ PostgreSQL incluido (plan gratuito)
- ✅ SSL automático
- ✅ Cero configuración de servidor

**Contras:**
- ⚠️ Plan gratuito: servicio "duerme" después de 15min de inactividad (tarda 30s en despertar)
- ⚠️ 750 horas/mes gratis (suficiente para demo)

**Costo:**
- **Demo:** USD 0/mes (plan Free)
- **Producción:** USD 7/mes (Web Service) + USD 7/mes (PostgreSQL) = **USD 14/mes**

#### Pasos para deploy en Render

1. **Subir código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: sistema completo Fase 2"
   git remote add origin https://github.com/ivopaolantonio/baigorria-demo.git
   git push -u origin main
   ```

2. **Crear cuenta en Render**
   - Ir a https://render.com
   - Sign up con GitHub
   - Autorizar acceso al repositorio

3. **Crear base de datos PostgreSQL**
   - New → PostgreSQL
   - Name: `baigorria-demo-db`
   - Plan: Free
   - Region: Oregon (US West)
   - Create Database
   - **Copiar el "Internal Database URL"** (lo usaremos en el paso 5)

4. **Crear Web Service**
   - New → Web Service
   - Conectar repositorio `baigorria-demo`
   - Configuración:
     - **Name:** `baigorria-demo`
     - **Region:** Oregon (US West)
     - **Branch:** `main`
     - **Runtime:** Node
     - **Build Command:** `cd web && npm install && npm run build && cd ../api && npm install`
     - **Start Command:** `cd api && NODE_ENV=production node server.js`
     - **Plan:** Free

5. **Configurar variables de entorno**
   En el dashboard del Web Service → Environment:
   
   | Variable | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `[pegar Internal Database URL del paso 3]` |
   | `JWT_SECRET` | `[generar con: openssl rand -hex 32]` |
   | `PORT` | `3001` |

6. **Deploy**
   - Save → Render despliega automáticamente
   - Tarda 5-10 minutos
   - URL final: `https://baigorria-demo.onrender.com`

7. **Verificar**
   ```bash
   curl https://baigorria-demo.onrender.com/api/health
   # Debe responder: {"ok":true}
   ```

8. **Crear usuario de prueba**
   Abrir `https://baigorria-demo.onrender.com` y registrarse con:
   - Email: `demo@baigorria.com`
   - Contraseña: `demo2026`

---

### Opción 2: Railway

**Pros:**
- ✅ Deploy automático desde GitHub
- ✅ PostgreSQL incluido
- ✅ Más rápido que Render (no duerme)

**Contras:**
- ⚠️ Plan gratuito: USD 5 de crédito/mes (alcanza para ~150 horas de uso)
- ⚠️ Requiere tarjeta de crédito (aunque no cobra en plan gratuito)

**Costo:**
- **Demo:** USD 5 crédito/mes (gratis mientras no se agote)
- **Producción:** ~USD 10-15/mes

#### Pasos para deploy en Railway

1. **Subir código a GitHub** (igual que Render, paso 1)

2. **Crear cuenta en Railway**
   - Ir a https://railway.app
   - Sign up con GitHub

3. **New Project → Deploy from GitHub**
   - Seleccionar repositorio `baigorria-demo`
   - Railway detecta automáticamente Node.js

4. **Agregar PostgreSQL**
   - En el proyecto → New → Database → PostgreSQL
   - Railway lo conecta automáticamente (variable `DATABASE_URL`)

5. **Configurar variables de entorno**
   Settings → Variables:
   
   | Variable | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | `[generar con: openssl rand -hex 32]` |
   | `PORT` | `3001` |

6. **Configurar build y start**
   Settings → Build:
   - **Build Command:** `cd web && npm install && npm run build && cd ../api && npm install`
   - **Start Command:** `cd api && NODE_ENV=production node server.js`

7. **Deploy**
   - Railway despliega automáticamente
   - URL: se genera automáticamente (ej: `baigorria-demo.up.railway.app`)

---

### Opción 3: Vercel + Neon (Gratis indefinidamente)

**Pros:**
- ✅ 100% gratis (sin límite de horas)
- ✅ No duerme nunca
- ✅ CDN global (ultra rápido)
- ✅ PostgreSQL gratis en Neon (500MB)

**Contras:**
- ⚠️ Más pasos de configuración
- ⚠️ Arquitectura serverless (functions)

**Costo:**
- **Demo + Producción:** USD 0/mes

#### Pasos para deploy en Vercel + Neon

1. **Crear base de datos en Neon**
   - Ir a https://neon.tech
   - Sign up (gratis)
   - Create Project → `baigorria-demo`
   - **Copiar el connection string** (lo usaremos después)

2. **Subir código a GitHub** (igual que antes)

3. **Crear cuenta en Vercel**
   - Ir a https://vercel.com
   - Sign up con GitHub

4. **Import Project**
   - New Project → Import Git Repository
   - Seleccionar `baigorria-demo`

5. **Configurar build**
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** `cd web && npm install && npm run build && cd ../api && npm install`
   - **Output Directory:** `web/dist`

6. **Configurar variables de entorno**
   Settings → Environment Variables:
   
   | Variable | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `[connection string de Neon]` |
   | `JWT_SECRET` | `[generar con: openssl rand -hex 32]` |

7. **Deploy**
   - Deploy → Vercel despliega automáticamente
   - URL: `https://baigorria-demo.vercel.app`

---

## Comparación Final

| Aspecto | Render | Railway | Vercel + Neon |
|---------|:------:|:-------:|:-------------:|
| **Costo demo** | Gratis | USD 5/mes crédito | Gratis |
| **Costo producción** | USD 14/mes | USD 10-15/mes | Gratis |
| **Duerme?** | Sí (15min) | No | No |
| **Setup** | Fácil | Fácil | Medio |
| **Velocidad** | Media | Alta | Ultra alta |
| **Límites** | 750h/mes | 150h/mes | Ilimitado |

### Recomendación

**Para demo (mostrar al cliente):**  
→ **Render** (gratis, fácil, suficiente)

**Para producción (después de confirmar con el cliente):**  
→ **Railway** o **Vercel + Neon** (no duermen, mejor experiencia)

---

## Post-Deploy: Configurar usuarios

Una vez deployado, crear usuarios de demo:

```bash
# Abrir en el navegador:
https://baigorria-demo.onrender.com

# Registrarse:
Email: demo@baigorria.com
Password: demo2026
Nombre: Usuario Demo
Rol: admin

# Crear usuario para Florencia:
Email: florencia@baigorria.com
Password: [definir con cliente]
Rol: ventas

# Crear usuario para Martín:
Email: martin@baigorria.com
Password: [definir con cliente]
Rol: logistica
```

---

## Datos de prueba

El sistema ya incluye:
- ✅ **236 leads** de ejemplo (datos reales anonimizados de Fase 1)
- ✅ **Mock del ERP ISIS** con pedidos de ejemplo
- ✅ **Clientes y artículos** de prueba

Todo está pre-cargado en el seed, el cliente puede probar inmediatamente.

---

## URL final para el cliente

Una vez deployado, actualizar el **INFORME-CLIENTE.md** con la URL real:

```markdown
### Demo en vivo

Pueden ver el sistema funcionando en:
**https://baigorria-demo.onrender.com**

**Credenciales de prueba:**
- Usuario: `demo@baigorria.com`
- Contraseña: `demo2026`

**Nota:** La primera vez que acceden puede tardar 30 segundos (el servidor estaba "dormido").
```

---

## Mantenimiento

### Logs en producción

**Render:**
```bash
# Dashboard → Logs (en tiempo real)
```

**Railway:**
```bash
# Dashboard → Deployments → View Logs
```

### Reiniciar servicio

**Render:**
```bash
# Dashboard → Manual Deploy → Clear build cache & deploy
```

**Railway:**
```bash
# Dashboard → Deployments → Restart
```

### Actualizar código

```bash
# Hacer cambios localmente
git add .
git commit -m "fix: ajuste X"
git push

# Render/Railway/Vercel despliegan automáticamente
```

---

## Troubleshooting

### Error: "Application failed to respond"
- Verificar que `PORT` esté en las variables de entorno
- Verificar que el `startCommand` sea correcto
- Ver logs para identificar el error exacto

### Error: "Database connection failed"
- Verificar que `DATABASE_URL` esté bien copiado (incluye el `?sslmode=require`)
- En Render: usar "Internal Database URL", no el "External"

### La app carga pero no muestra datos
- Verificar que el seed se ejecutó correctamente (logs del servidor)
- Verificar que las tablas se crearon (`ensureSchema()` en logs)

---

## Siguiente paso después del deploy

Una vez que el cliente pruebe la demo y confirme:

1. ✅ Migrar a producción (Railway o Vercel + Neon)
2. ✅ Conectar el ERP ISIS real (cuando el cliente entregue la API)
3. ✅ Configurar el dominio `crm.baigorriaindustrial.com`
4. ✅ Configurar WhatsApp Business real
5. ✅ Capacitar al equipo (Florencia, Martín, vendedores)

---

**¿Necesitas ayuda con el deploy?**  
Contactá a Ivo: ivopaolantoniopersonal@gmail.com · +54 9 11 3117-4279
