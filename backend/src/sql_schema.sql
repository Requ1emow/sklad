-- Core product catalog for auto glass ERP
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2) NOT NULL,
  description TEXT,
  image_urls TEXT[] DEFAULT '{}',
  car_brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  year_from INT NOT NULL,
  year_to INT NOT NULL,
  glass_type TEXT NOT NULL CHECK (glass_type IN ('windshield', 'rear', 'side')),
  rain_sensor BOOLEAN DEFAULT FALSE,
  heating BOOLEAN DEFAULT FALSE,
  camera BOOLEAN DEFAULT FALSE,
  color TEXT,
  width_mm INT,
  height_mm INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  UNIQUE(warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS product_stock (
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  location_id INT REFERENCES storage_locations(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer')),
  quantity INT NOT NULL CHECK (quantity > 0),
  from_warehouse_id INT REFERENCES warehouses(id),
  to_warehouse_id INT REFERENCES warehouses(id),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
  customer_name TEXT,
  sale_date TIMESTAMP DEFAULT NOW(),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  sale_price NUMERIC(12,2) NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_vehicle ON products(car_brand, car_model, year_from, year_to);
CREATE INDEX IF NOT EXISTS idx_products_flags ON products(rain_sensor, heating, camera);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
