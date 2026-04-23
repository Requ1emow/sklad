import express from 'express';
import { query, pool } from '../db.js';

const router = express.Router();

router.get('/warehouses', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM warehouses ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/warehouses', async (req, res, next) => {
  try {
    const { name, code, address } = req.body;
    const result = await query(
      'INSERT INTO warehouses(name, code, address) VALUES ($1, $2, $3) RETURNING *',
      [name, code, address || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/stock', async (req, res, next) => {
  try {
    const { warehouse_id } = req.query;
    const values = [];
    const where = warehouse_id ? `WHERE ps.warehouse_id = $1` : '';
    if (warehouse_id) values.push(Number(warehouse_id));

    const result = await query(
      `SELECT ps.product_id, p.name, p.sku, ps.warehouse_id, w.name AS warehouse_name,
              ps.location_id, ps.quantity, ps.updated_at
       FROM product_stock ps
       JOIN products p ON p.id = ps.product_id
       JOIN warehouses w ON w.id = ps.warehouse_id
       ${where}
       ORDER BY p.name`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/movements', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, p.name AS product_name, p.sku
       FROM inventory_movements m
       JOIN products p ON p.id = m.product_id
       ORDER BY m.created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/movements', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { product_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference, notes } = req.body;

    await client.query('BEGIN');

    if (movement_type === 'in') {
      await client.query(
        `INSERT INTO product_stock(product_id, warehouse_id, quantity)
         VALUES($1, $2, $3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = product_stock.quantity + EXCLUDED.quantity, updated_at = NOW()`,
        [product_id, to_warehouse_id, quantity]
      );
    }

    if (movement_type === 'out') {
      await client.query(
        `UPDATE product_stock
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE product_id = $2 AND warehouse_id = $3 AND quantity >= $1`,
        [quantity, product_id, from_warehouse_id]
      );
    }

    if (movement_type === 'transfer') {
      await client.query(
        `UPDATE product_stock
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE product_id = $2 AND warehouse_id = $3 AND quantity >= $1`,
        [quantity, product_id, from_warehouse_id]
      );

      await client.query(
        `INSERT INTO product_stock(product_id, warehouse_id, quantity)
         VALUES($1, $2, $3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = product_stock.quantity + EXCLUDED.quantity, updated_at = NOW()`,
        [product_id, to_warehouse_id, quantity]
      );
    }

    const movement = await client.query(
      `INSERT INTO inventory_movements(product_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        product_id,
        movement_type,
        quantity,
        from_warehouse_id || null,
        to_warehouse_id || null,
        reference || null,
        notes || null
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(movement.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
