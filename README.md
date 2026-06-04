# RiskAnalysesDashboard
# Modelo de Control de Datos — Dashboard IA

Prototipo **front-end (Angular)** de una herramienta de **control de calidad de datos y analítica de riesgo de crédito**, con foco en **series temporales** y una capa de **explicabilidad con IA**. Pensado como para carteras de crédito (PD, LGD, defaults, mora, contencioso…).

> ⚠️ **Demo con datos 100% hardcodeados.** No hay backend ni datos reales: todo lo que se ve está simulado para presentación. La lógica de datos vive en `app/src/app/data/`.

---

## ✨ Qué incluye (6 secciones)

| # | Sección | Descripción |
|---|---------|-------------|
| **1** | **Ingesta de datos** | Carga desde Excel / CSV / BBDD, vista de tablas (nº filas, columnas, fechas), preview y validación de carga. |
| **2** | **Conocimiento del dato** | Chatbot con preguntas sugeridas (de dónde viene un dato / qué significa) + diccionario de variables. |
| **3** | **Trazabilidad (data lineage)** | Grafo `origen → transformación → modelo → dashboard`. Click en un nodo → detalle, dependencias e impacto. |
| **4** | **Control de calidad + agente** | Checks (missing, duplicados, incoherencias, reglas, PD vs LGD) con OK/warning/error + botón de agente que resume problemas y propone causas. |
| **5** | **Dashboard principal (core)** | KPIs, series temporales, segmentación, comparativa PD vs LGD, ODFs/tasas de mora, pivot, detección de anomalías y **explicabilidad** (click en un punto → explicación automática). |
| **6** | **Monitorización del modelo** | Seguimiento de PD/LGD, inconsistencias (estado↔default, PD↔comportamiento), data drift (PSI) y comparativa de ventanas temporales. |

---

## 🧱 Stack técnico

- **Angular 20** (standalone components, signals, routing)
- **Apache ECharts 6** para todas las visualizaciones (sin wrapper, integración propia en `app/src/app/chart/`)
- **SCSS** con un sistema de diseño compartido (tema oscuro)
- Sin backend — datos en `app/src/app/data/`

---

## 📋 Requisitos previos

- **Node.js 20+** y **npm 10+** (`node --version`)
- Git
- (Opcional, para compartir) **cloudflared** — ver más abajo

---

## 🚀 Cómo arrancar (paso a paso)

```bash
# 1. Clonar el repo
git clone 
cd Dashboard/app

# 2. Instalar dependencias
npm install

# 3a. Modo desarrollo (con recarga en caliente)
npm start
#    → abre http://localhost:4200

# 3b. (Alternativa) Build de producción + servir estático
npm run build
npx serve -s dist/app/browser -l 8080
#    → abre http://localhost:8080
```

> En una instancia remota (p. ej. **RunPod**) usa `--host 0.0.0.0`:
> `npx ng serve --host 0.0.0.0 --port 4200`

---

## 🌍 Compartir Cloudflare Tunnel

Para enseñar la demo a alguien fuera de tu máquina/instancia sin desplegar nada, usa un **Quick Tunnel** de Cloudflare (gratis, sin cuenta, URL pública temporal).

### Paso 1 — Instalar `cloudflared`

```bash
# Linux (x86_64)
curl -sL -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/cloudflared
cloudflared --version
```

*(macOS: `brew install cloudflared` · Windows: `winget install --id Cloudflare.cloudflared`)*

### Paso 2 — Arrancar la app (en una terminal)

Lo más fiable para un túnel es servir el **build estático** (el dev-server de Angular puede bloquear hosts desconocidos):

```bash
cd app
npm run build
npx serve -s dist/app/browser -l 8080
```

### Paso 3 — Abrir el túnel (en otra terminal)

```bash
cloudflared tunnel --url http://localhost:8080
```

Cloudflared imprimirá una URL pública como:

```
+--------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:      |
|  https://algo-aleatorio.trycloudflare.com              |
+--------------------------------------------------------+
```

### Paso 4 — Compartir

Copia esa URL `https://….trycloudflare.com` y pásala a quien quieras. 🎉

> **Notas:**
> - La URL es **temporal**: vive mientras el proceso `cloudflared` siga corriendo y cambia cada vez que lo reinicias (los Quick Tunnels no tienen garantía de uptime).
> - Para una URL fija/permanente necesitas una cuenta de Cloudflare y un *named tunnel*.

#### Todo en segundo plano (opcional, una sola terminal)

```bash
cd app
npm run build
(npx serve -s dist/app/browser -l 8080 &)
(cloudflared tunnel --url http://localhost:8080 > cf.log 2>&1 &)
sleep 8 && grep -Eo "https://[a-z0-9-]+\.trycloudflare\.com" cf.log | head -1
```

---

## 📁 Estructura del proyecto

```
Dashboard/
├── README.md
├── app/                         # Aplicación Angular
│   ├── src/app/
│   │   ├── layout/              # Shell con sidebar de navegación
│   │   ├── dashboard/           # Sección 5 (dashboard core)
│   │   ├── sections/            # Secciones 1, 2, 3, 4, 6
│   │   ├── chart/               # Componente reutilizable de ECharts
│   │   ├── data/                # 🔢 Todos los datos hardcodeados
│   │   └── app.routes.ts        # Rutas
│   ├── package.json
│   └── angular.json
├── data-drift.png               # Imagen de referencia (mockup original)

```

---
