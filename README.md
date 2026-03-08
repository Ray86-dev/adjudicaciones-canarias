# Adjudicaciones Canarias - Dashboard Interactivo 🇮🇨

Plataforma inteligente y visualizador estadístico de destinos provisionales para docentes en las Islas Canarias. Toma los fríos datos institucionales y los transforma en una experiencia de usuario inmersiva con métricas y gráficas dinámicas.

## 🌟 Características Principales
- **Algoritmo Predictor**: Cruza matemáticamente tu número de lista con las vacantes físicas adjudicadas para determinar tu posición (*Safe, Warning o Danger*).
- **Filtro Geográfico Real**: Tu probabilidad se ajusta de inmediato excluyendo de la ecuación todas las islas en las que no estés disponible.
- **Topología Geográfica y Transparencia**: Analiza el mapa real interactivo para descubrir qué centro y de qué tipo son las vacantes obtenidas por los participantes que te preceden.

## 🚀 Arquitectura del Proyecto

El proyecto se divide en dos motores principales:
1. **El Extractor (Python 🐍)**: Scraping agresivo y purificación de datos extraídos masivamente de los PDF gubernamentales, inyectando posteriormente todo el dataset de forma serializada en nuestro backend.
2. **El Cerebro Visual (React + Vite ⚛️)**: Una aplicación ultrarrápida (creada con Vite) y potenciada por *Framer Motion* que da fisicalidad a cualquier interacción del dashboard conectándolo en tiempo real a la base de datos distribuida en *Supabase*.

## 🛠️ Cómo ejecutar el Entorno Local

Asegúrate de tener **Node.js** instalado.

Clona este repositorio e ingresa a la subcarpeta del frontend:
```bash
cd web
npm install
```

Arranca el servidor de desarrollo:
```bash
npm run dev
```
> *(El visor estará disponible al instante en `http://localhost:5173`)*

---
**Desarrollo original**: Ray86-dev
