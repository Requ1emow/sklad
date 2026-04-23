import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Returns normalized payload that can be pushed to website catalog later.
router.get('/website-sync/payload', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, sku, name, sale_price, description, image_urls, car_brand, car_model,
              year_from, year_to, glass_type, rain_sensor, heating, camera
       FROM products
       ORDER BY updated_at DESC`
    );
    res.json({ source: 'auto-glass-erp', synced_at: new Date().toISOString(), products: result.rows });
  } catch (error) {
    next(error);
  }
});

// Payload shape for Avito-like marketplace exports.
router.get('/marketplace-export/payload', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT p.id, p.sku, p.name, p.sale_price, p.description,
              p.car_brand, p.car_model, p.year_from, p.year_to, p.glass_type,
              COALESCE(SUM(ps.quantity), 0)::INT AS stock_quantity
       FROM products p
       LEFT JOIN product_stock ps ON ps.product_id = p.id
       GROUP BY p.id
       ORDER BY p.name`
    );

    const marketplaceItems = result.rows.map((r) => ({
      externalId: `ERP-${r.id}`,
      title: r.name,
      sku: r.sku,
      price: r.sale_price,
      qty: r.stock_quantity,
      compatibility: `${r.car_brand} ${r.car_model} ${r.year_from}-${r.year_to}`,
      attributes: {
        glassType: r.glass_type
      },
      description: r.description
    }));

    res.json({ marketplace: 'avito-like', generated_at: new Date().toISOString(), items: marketplaceItems });
  } catch (error) {
    next(error);
  }
});

export default router;
