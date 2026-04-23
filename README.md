# Auto Glass ERP (MVP)

Full-stack ERP for auto glass warehouse management with inventory, sales reporting, CSV import/export, and integration payloads.

## 1) Project Structure

```text
sklad/
  backend/
    src/
      routes/
        products.js
        inventory.js
        reports.js
        integrations.js
      utils/
        initDb.js
      db.js
      server.js
      sql_schema.sql
    package.json
    .env.example
  frontend/
    src/
      pages/
        ProductsPage.jsx
        InventoryPage.jsx
        ReportsPage.jsx
      api.js
      App.jsx
      main.jsx
      styles.css
    package.json
    vite.config.js
    index.html
  docker-compose.yml
  README.md
```

## 2) Backend Overview

- Node.js + Express REST API.
- PostgreSQL as system of record.
- Endpoints:
  - `/api/products` CRUD + search + CSV import + CSV/JSON export
  - `/api/inventory` warehouses + stock + movement history
  - `/api/reports` create sales + sales/profit reports + top products
  - `/api/integrations` website sync payload + marketplace payload template

## 3) Frontend Overview

- React (Vite) SPA with tabs:
  - Products: add products + search filters
  - Inventory: create movements + stock/movement views
  - Reports: sales over time + top sellers

## 4) Database Schema

Schema is in `backend/src/sql_schema.sql` and includes:

- `products`
- `warehouses`
- `storage_locations`
- `product_stock`
- `inventory_movements`
- `sales`
- `sale_items`

## 5) Run Locally

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Start PostgreSQL

```bash
docker compose up -d postgres
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Backend runs at `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Examples

### Create Product

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Toyota Camry windshield",
    "sku":"TCAM-W-001",
    "purchase_price":80,
    "sale_price":130,
    "description":"OEM quality",
    "images":["https://example.com/glass.jpg"],
    "car_brand":"Toyota",
    "car_model":"Camry",
    "year_from":2018,
    "year_to":2023,
    "glass_type":"windshield",
    "rain_sensor":true,
    "heating":false,
    "camera":true,
    "color":"green tint",
    "width_mm":1450,
    "height_mm":900
  }'
```
