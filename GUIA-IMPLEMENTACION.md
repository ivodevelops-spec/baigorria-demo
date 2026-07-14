# Guía de Implementación
## Baigorria Industrial — Sistema de Gestión Comercial

**Versión:** 1.0 — Para el equipo de implementación
**Fecha:** Junio 2026

---

> **Este documento es la guía paso a paso para implementar el sistema completo.**
> No asume conocimientos de programación. Cada sección explica qué hay que hacer, en qué orden, y por qué.

---

## Índice

| # | Área | Página |
|---|------|:------:|
| A | [Qué hay que comprar o contratar](#a-qué-hay-que-comprar-o-contratar) | ↓ |
| B | [Qué hay que instalar](#b-qué-hay-que-instalar) | ↓ |
| C | [Servicios externos a configurar](#c-servicios-externos-a-configurar) | ↓ |
| D | [Paso a paso: despliegue del sistema](#d-paso-a-paso-despliegue-del-sistema) | ↓ |
| E | [Paso a paso: configuración de automatizaciones](#e-paso-a-paso-configuración-de-automatizaciones) | ↓ |
| F | [Paso a paso: sincronización con el ERP ISIS](#f-paso-a-paso-sincronización-con-el-erp-isis) | ↓ |
| G | [Verificación final: checklist](#g-verificación-final-checklist) | ↓ |
| H | [Costos totales del proyecto](#h-costos-totales-del-proyecto) | ↓ |
| I | [Mantenimiento y respaldo](#i-mantenimiento-y-respaldo) | ↓ |
| J | [Contactos y recursos](#j-contactos-y-recursos) | ↓ |

---

## A. Qué hay que comprar o contratar

### A.1 Servidor (VPS)

| Concepto | Detalle |
|----------|---------|
| **Proveedor recomendado** | Hetzner (https://www.hetzner.com/cloud) |
| **Plan** | CAX21 (4 vCPU ARM, 8 GB RAM, 80 GB disco) |
| **Sistema operativo** | Ubuntu 22.04 LTS |
| **Región** | Europa (Nuremberg o Falkenstein) — menor latencia para Argentina que USA |
| **Costo mensual** | ~€6/mes (~USD 7/mes) |
| **Alternativa económica** | CX22 (2 vCPU, 4 GB RAM, 40 GB disco) — ~€4/mes (~USD 5/mes) |
| **Alternativa argentina** | Un servidor local o PC dedicada si prefieren no usar cloud |

> **Por qué un VPS y no la PC local:** La PC actual se apaga de noche. Los webhooks de Meta Ads necesitan un servidor 24/7. Si el cliente prefiere mantener todo local, se necesita una PC que nunca se apague o un mini-servidor (ej. Intel NUC).

### A.2 Dominio

| Concepto | Detalle |
|----------|---------|
| **Proveedor** | Cualquiera (Namecheap, GoDaddy, DonWeb) |
| **Dominio sugerido** | `crm.baigorriaindustrial.com` |
| **Costo anual** | ~USD 12-15/año |
| **Configuración DNS** | Apuntar registro A a la IP del VPS |

### A.3 WhatsApp Business API

| Concepto | Detalle |
|----------|---------|
| **Proveedor** | Evolution API (https://evolution-api.com) |
| **Tipo de cuenta** | WhatsApp Business (no personal) |
| **Costo** | Evolution API es open source. El costo está en el hosting (~USD 5-10/mes si se hostea aparte) |
| **Alternativa** | Usar directamente la WhatsApp Cloud API de Meta (gratis hasta 1000 conversaciones/mes) |

> **Importante:** Se necesita un número de teléfono dedicado para WhatsApp Business. No puede ser el número personal de Florencia o Martín. Puede ser un número nuevo o el número de la empresa si no está registrado en WhatsApp personal.

### A.4 SMTP para Emails

| Concepto | Detalle |
|----------|---------|
| **Proveedor** | Resend (https://resend.com) |
| **Plan** | Free: 100 emails/día, 1 dominio. Suficiente para el volumen actual de Baigorria. |
| **Costo** | USD 0/mes (plan gratuito) |
| **Alternativa** | SendGrid, Mailgun, Amazon SES |

### A.5 IA para Chatbot (Opcional)

| Concepto | Detalle |
|----------|---------|
| **Proveedor** | Anthropic (Claude) |
| **Modelo** | Claude Haiku (el más económico, suficiente para calificar leads) |
| **Costo** | ~USD 0.25 por millón de tokens de entrada. Para ~100 conversaciones/mes: **menos de USD 1/mes** |
| **Alternativa** | OpenAI GPT-4o-mini (precio similar) |

---

## B. Qué hay que instalar

Todo se instala en el VPS con Ubuntu 22.04. El orden importa.

### B.1 Paquetes del sistema

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl git build-essential ufw
```

### B.2 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x
```

### B.3 PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Configurar auto-inicio con el sistema
pm2 startup systemd
# Seguir las instrucciones que imprime en pantalla
```

### B.4 Caddy (Reverse Proxy + SSL)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### B.5 n8n (Motor de Automatización)

```bash
sudo npm install -g n8n

# Iniciar con PM2
pm2 start n8n --name baigorria-n8n -- start

# Variables de entorno recomendadas para n8n
# (agregar a ~/.bashrc o al ecosistema de PM2)
export N8N_PORT=5678
export GENERIC_TIMEZONE=America/Argentina/Buenos_Aires
export N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### B.6 Listmonk (Email Marketing)

```bash
# Descargar el binario
mkdir -p /opt/listmonk
cd /opt/listmonk
wget https://github.com/knadh/listmonk/releases/download/v4.1.0/listmonk_4.1.0_linux_amd64.tar.gz
tar -xzf listmonk_4.1.0_linux_amd64.tar.gz

# Crear base de datos (necesita PostgreSQL)
# Ver sección B.7

# Crear archivo de configuración (ver B.8)
```

### B.7 PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib

# Crear bases de datos
sudo -u postgres psql <<EOF
CREATE USER baigorria_user WITH PASSWORD 'password_seguro_aqui';
CREATE DATABASE baigorria_n8n OWNER baigorria_user;
CREATE DATABASE baigorria_listmonk OWNER baigorria_user;
GRANT ALL PRIVILEGES ON DATABASE baigorria_n8n TO baigorria_user;
GRANT ALL PRIVILEGES ON DATABASE baigorria_listmonk TO baigorria_user;
EOF
```

### B.8 Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Caddy)
sudo ufw allow 443/tcp   # HTTPS (Caddy)
sudo ufw enable
```

---

## C. Servicios Externos a Configurar

### C.1 Meta Ads — Webhook de Leads

1. Ir a https://business.facebook.com/
2. Navegar a: Business Settings → Integrations → Leads Access
3. Crear un Webhook apuntando a: `https://n8n.baigorriaindustrial.com/webhook/meta-leads`
4. Configurar Verify Token: `META_VERIFY_TOKEN` (definir un valor secreto)
5. Suscribirse al evento `leadgen` de la página de Facebook de Baigorria
6. Probar con un lead de prueba desde el Ads Manager

### C.2 WhatsApp Business — Configuración

1. Crear una aplicación en https://developers.facebook.com/
2. Agregar producto "WhatsApp"
3. Configurar un número de teléfono de prueba (sandbox) o el número de producción
4. Obtener:
   - Phone Number ID
   - WhatsApp Business Account ID
   - Token de acceso permanente (no el temporal de 24h)
5. Configurar Webhook en Meta para recibir mensajes entrantes:
   - Callback URL: `https://n8n.baigorriaindustrial.com/webhook/wa-incoming`
   - Verify Token: `WHATSAPP_VERIFY_TOKEN`
   - Suscribirse a `messages`

### C.3 Resend — SMTP

1. Crear cuenta en https://resend.com
2. Verificar el dominio `baigorriaindustrial.com` (agregar registros DNS que Resend indica)
3. Crear API Key con permisos de envío
4. Guardar la API Key como `RESEND_API_KEY`

### C.4 Anthropic — Claude (Opcional)

1. Crear cuenta en https://console.anthropic.com/
2. Generar API Key
3. Guardar como `ANTHROPIC_API_KEY`
4. Cargar saldo (mínimo USD 5, dura meses con Haiku)

---

## D. Paso a Paso: Despliegue del Sistema

### D.1 Preparar el servidor

```bash
# Conectarse al VPS por SSH
ssh root@<ip-del-vps>

# Crear carpeta del proyecto
mkdir -p /opt/baigorria
cd /opt/baigorria
```

### D.2 Copiar el código del CRM

Copiar la carpeta `MUDANZA/crm/` al servidor:

```bash
# Desde tu computadora local:
scp -r MUDANZA/crm/* root@<ip-del-vps>:/opt/baigorria/crm/
```

### D.3 Instalar dependencias e iniciar

```bash
cd /opt/baigorria/crm
npm install
pm2 start server.js --name baigorria-crm
pm2 save
```

### D.4 Verificar que funciona

```bash
# Localmente en el VPS:
curl http://localhost:8080/api/leads | head -c 200
# Debe devolver JSON con leads

# Desde afuera (si Caddy está configurado):
curl https://crm.baigorriaindustrial.com/api/leads | head -c 200
```

### D.5 Configurar Caddy

Editar `/etc/caddy/Caddyfile`:

```caddy
crm.baigorriaindustrial.com {
    reverse_proxy localhost:8080
}

n8n.baigorriaindustrial.com {
    reverse_proxy localhost:5678
}

mail.baigorriaindustrial.com {
    reverse_proxy localhost:9000
}
```

```bash
sudo systemctl reload caddy
```

### D.6 Verificar SSL

Abrir en el navegador: `https://crm.baigorriaindustrial.com`

Debe mostrar el candado verde. Caddy genera los certificados automáticamente.

---

## E. Paso a Paso: Configuración de Automatizaciones

### E.1 Importar workflows en n8n

1. Abrir `https://n8n.baigorriaindustrial.com`
2. Crear cuenta de administrador
3. Ir a Settings → Import
4. Importar los archivos JSON de la carpeta `MUDANZA/n8n/`

Workflows a importar:
- `baigorria-captura-leads.json` — Webhook Meta → CRM → WhatsApp → Email
- `baigorria-ia-whatsapp.json` — IA de conversación para calificar leads
- `baigorria-seguimiento.json` — Recordatorios automáticos 24h y 72h
- `baigorria-reporte-semanal.json` — Reporte semanal por email

### E.2 Configurar credenciales en n8n

En Settings → Credentials, crear:

| Credencial | Tipo | Datos necesarios |
|-----------|------|------------------|
| HTTP Request (CRM) | Header Auth | — (sin auth, es localhost) |
| WhatsApp (Evolution API) | HTTP Request | URL, Instance, API Key |
| PostgreSQL | Postgres | Host, DB, User, Password |
| Resend SMTP | SMTP | Host, Puerto, User (API Key), Pass (API Key) |
| Anthropic | Header Auth | API Key |

### E.3 Activar workflows

1. Abrir cada workflow
2. Verificar que los webhooks tengan URLs correctas
3. Hacer clic en "Active" (switch arriba a la derecha)
4. Probar con datos de prueba

---

## F. Paso a Paso: Sincronización con el ERP ISIS

### F.1 Lo que necesitamos del proveedor de ISIS

Solicitar al proveedor de ISIS:

1. **Vista SQL de solo lectura** con los pedidos:
   - Campos: nro_pedido, cliente, fecha_pedido, kilos_total, estado, retira_local, nro_factura
   
2. **Vista SQL de solo lectura** con los clientes:
   - Campos: id, nombre, cuit, provincia, localidad, telefono, email

3. **Vista SQL de solo lectura** con los artículos:
   - Campos: codigo, categoria, subcategoria, tipo, descripcion

4. **Vista SQL de solo lectura** con el stock:
   - Campos: articulo_id, kilos_disponibles, unidades_disponibles, estado

5. **Ruta de red** donde se guardan los PDFs de factura

6. **Credenciales de acceso** (usuario/contraseña o IP autorizada)

### F.2 Método de conexión

**Opción A — VPN (recomendado):**
- Instalar Tailscale o WireGuard en el VPS y en el servidor de ISIS
- El VPS accede a ISIS por IP privada
- Más seguro que exponer puertos

**Opción B — SSH Tunnel:**
```bash
# En el VPS:
ssh -L 5432:localhost:5432 usuario@ip-del-servidor-isis
# Luego el script de sync se conecta a localhost:5432
```

**Opción C — API/JSON (si ISIS lo soporta):**
- El proveedor de ISIS expone un endpoint HTTP
- El script de sync hace GET en vez de SQL

### F.3 Configurar el script de sync

```bash
cd /opt/baigorria/scripts
cp sync-isis.example.py sync-isis.py

# Editar sync-isis.py con las credenciales
nano sync-isis.py

# Probar en modo dry-run
python3 sync-isis.py --dry-run

# Agregar al cron (cada 5 minutos)
crontab -e
# Agregar: */5 * * * * cd /opt/baigorria/scripts && python3 sync-isis.py >> /var/log/sync-isis.log 2>&1
```

### F.4 Verificar la sincronización

```bash
# Ver los logs
tail -f /var/log/sync-isis.log

# Verificar que los pedidos aparecen en el CRM
curl http://localhost:8080/api/pedidos
```

---

## G. Verificación Final: Checklist

### G.1 El CRM funciona

- [ ] `http://localhost:8080` carga la página de inicio
- [ ] La pestaña "Leads" muestra los 236 leads existentes
- [ ] La pestaña "Pedidos" muestra datos (demo o reales)
- [ ] La pestaña "Clientes" muestra los 12 clientes
- [ ] La pestaña "Stock" muestra datos con JOIN a artículos
- [ ] La pestaña "Ventas" muestra el resumen mensual
- [ ] La pestaña "Analytics" muestra KPIs y gráficos

### G.2 El dominio y SSL funcionan

- [ ] `https://crm.baigorriaindustrial.com` carga con candado verde
- [ ] `https://n8n.baigorriaindustrial.com` carga n8n
- [ ] `https://mail.baigorriaindustrial.com` carga Listmonk

### G.3 Los workflows funcionan

- [ ] Al crear un lead de prueba en Meta, aparece en el CRM
- [ ] Al suscribir un lead, recibe el email de bienvenida
- [ ] Al escribir un lead por WhatsApp, el bot responde
- [ ] El lunes a las 9am se envía el reporte semanal

### G.4 La sincronización con ISIS funciona (cuando esté disponible)

- [ ] Los pedidos aparecen en el CRM automáticamente
- [ ] Los cambios de estado en ISIS se reflejan en el CRM en < 5 min
- [ ] Las notificaciones de WhatsApp se disparan al facturar

---

## H. Costos Totales del Proyecto

### H.1 Costos del sistema (pago único al desarrollador)

| Concepto | Monto |
|----------|:-----:|
| Desarrollo e implementación completa | USD 1.800 |
| Total | **USD 1.800** |

### H.2 Costos mensuales (a cargo del cliente)

| Concepto | Proveedor | Costo mensual |
|----------|-----------|:------------:|
| VPS (servidor) | Hetzner CAX21 | ~USD 7 |
| Dominio | Namecheap / DonWeb | ~USD 1 |
| WhatsApp Business API | Meta | USD 0 (gratis hasta 1000 conv/mes) |
| Email SMTP | Resend | USD 0 (plan gratuito) |
| IA (Claude Haiku) | Anthropic | ~USD 1 |
| **Total mensual** | | **~USD 9** |

### H.3 Resumen para el cliente

| Tipo | Monto |
|------|:-----:|
| Pago único (sistema completo) | USD 1.800 |
| Costo mensual de operación | ~USD 9 |
| **Primer año (total)** | **~USD 1.908** |

---

## I. Mantenimiento y Respaldo

### I.1 Backup de la base de datos

```bash
# Script de backup diario
cat > /opt/baigorria/scripts/backup.sh <<'SCRIPT'
#!/bin/bash
BACKUP_DIR="/opt/baigorria/backups"
mkdir -p "$BACKUP_DIR"
cp /opt/baigorria/crm/leads.db "$BACKUP_DIR/leads-$(date +%Y%m%d-%H%M).db"
# Mantener solo los últimos 30 backups
ls -t "$BACKUP_DIR"/leads-*.db | tail -n +31 | xargs rm -f
SCRIPT

chmod +x /opt/baigorria/scripts/backup.sh

# Agregar al cron (todos los días a las 3am)
crontab -e
# Agregar: 0 3 * * * /opt/baigorria/scripts/backup.sh
```

### I.2 Monitoreo

```bash
# Ver estado de los servicios
pm2 status

# Ver logs
pm2 logs baigorria-crm
pm2 logs baigorria-n8n

# Reiniciar todo si es necesario
pm2 restart all
```

### I.3 Actualizaciones

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Actualizar dependencias del CRM
cd /opt/baigorria/crm
npm update

# Reiniciar
pm2 restart baigorria-crm
```

---

## J. Contactos y Recursos

### J.1 Contactos del proyecto

| Rol | Persona | Contacto |
|-----|---------|----------|
| Desarrollador | Ivo Paolantonio | ivopaolantoniopersonal@gmail.com |
| WhatsApp | — | +54 9 11 3117-4279 |
| Cliente (ventas) | Florencia | — |
| Cliente (logística) | Martín | — |
| Proveedor ERP | ISIS | — |

### J.2 Documentación del proyecto

| Documento | Ubicación | Para quién |
|-----------|-----------|-----------|
| Esta guía | `docs/GUIA-IMPLEMENTACION.md` | Implementador |
| Especificación técnica | `docs/ESPECIFICACION-TECNICA.md` | Programadores |
| Proyecto (cliente) | `docs/PROYECTO.md` | Cliente |
| Explicación simple | `docs/explicacion-para-baigorria.md` | Cliente (no técnico) |
| Arquitectura | `docs/ARCHITECTURE.md` | Técnico |
| ADR + API | `docs/ESPECIFICACION-TECNICA.md` | Programadores |
| Presentación visual | `MVP/presentacion.html` | Cliente |

---

*Si algo no funciona como se describe en esta guía, contactar a Ivo.*
