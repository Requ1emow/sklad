import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { query } from '../db.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

function buildProductFilters(params) {
  const conditions = [];
  const values = [];

  if (params.sku) {
    values.push(`%${params.sku}%`);
    conditions.push(`sku ILIKE $${values.length}`);
  }
  if (params.car_brand) {
    values.push(params.car_brand);
    conditions.push(`car_brand = $${values.length}`);
  }
  if (params.car_model) {
    values.push(params.car_model);
    conditions.push(`car_model = $${values.length}`);
  }
  if (params.year) {
    values.push(Number(params.year));
    conditions.push(`year_from <= $${values.length}`);
    values.push(Number(params.year));
    conditions.push(`year_to >= $${values.length}`);
  }

  ['rain_sensor', 'heating', 'camera', 'glass_type'].forEach((key) => {
    if (params[key] !== undefined) {
      const value = ['rain_sensor', 'heating', 'camera'].includes(key)
        ? params[key] === 'true'
        : params[key];
      values.push(value);
      conditions.push(`${key} = $${values.length}`);
    }
  });

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
}

router.get('/', async (req, res, next) => {
  try {
    const { where, values } = buildProductFilters(req.query);
    const result = await query(
      `SELECT p.*, COALESCE(SUM(ps.quantity), 0)::INT AS stock_quantity
       FROM products p
       LEFT JOIN product_stock ps ON ps.product_id = p.id
       ${where}
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const p = req.body;
    const result = await query(
      `INSERT INTO products (
        name, sku, purchase_price, sale_price, description, image_urls,
        car_brand, car_model, year_from, year_to, glass_type,
        rain_sensor, heating, camera, color, width_mm, height_mm
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        p.name,
        p.sku,
        p.purchase_price,
        p.sale_price,
        p.description || null,
        p.images || [],
        p.car_brand,
        p.car_model,
        p.year_from,
        p.year_to,
        p.glass_type,
        !!p.rain_sensor,
        !!p.heating,
        !!p.camera,
        p.color || null,
        p.width_mm || null,
        p.height_mm || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const p = req.body;
    const result = await query(
      `UPDATE products SET
        name = $1,
        sku = $2,
        purchase_price = $3,
        sale_price = $4,
        description = $5,
        image_urls = $6,
        car_brand = $7,
        car_model = $8,
        year_from = $9,
        year_to = $10,
        glass_type = $11,
        rain_sensor = $12,
        heating = $13,
        camera = $14,
        color = $15,
        width_mm = $16,
        height_mm = $17,
        updated_at = NOW()
      WHERE id = $18
      RETURNING *`,
      [
        p.name,
        p.sku,
        p.purchase_price,
        p.sale_price,
        p.description || null,
        p.images || [],
        p.car_brand,
        p.car_model,
        p.year_from,
        p.year_to,
        p.glass_type,
        !!p.rain_sensor,
        !!p.heating,
        !!p.camera,
        p.color || null,
        p.width_mm || null,
        p.height_mm || null,
        id
      ]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/import/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
    const records = parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true });

    let inserted = 0;
    for (const row of records) {
      await query(
        `INSERT INTO products (
          name, sku, purchase_price, sale_price, description, image_urls,
          car_brand, car_model, year_from, year_to, glass_type,
          rain_sensor, heating, camera, color, width_mm, height_mm
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17
        ) ON CONFLICT (sku) DO NOTHING`,
        [
          row.name,
          row.sku,
          Number(row.purchase_price || 0),
          Number(row.sale_price || 0),
          row.description || null,
          row.images ? row.images.split('|') : [],
          row.car_brand,
          row.car_model,
          Number(row.year_from),
          Number(row.year_to),
          row.glass_type,
          row.rain_sensor === 'true',
          row.heating === 'true',
          row.camera === 'true',
          row.color || null,
          row.width_mm ? Number(row.width_mm) : null,
          row.height_mm ? Number(row.height_mm) : null
        ]
      );
      inserted += 1;
    }

    res.json({ message: 'Import finished', inserted });
  } catch (error) {
    next(error);
  }
});

router.get('/export/csv', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY id');
    const csv = stringify(result.rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.get('/export/json', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
