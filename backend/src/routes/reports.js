import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/sales', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { warehouse_id, customer_name, items } = req.body;
    await client.query('BEGIN');

    let totalAmount = 0;
    let totalCost = 0;

    for (const item of items) {
      totalAmount += Number(item.sale_price) * Number(item.quantity);
      totalCost += Number(item.purchase_price) * Number(item.quantity);

      await client.query(
        `UPDATE product_stock
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE product_id = $2 AND warehouse_id = $3 AND quantity >= $1`,
        [item.quantity, item.product_id, warehouse_id]
      );

      await client.query(
        `INSERT INTO inventory_movements(product_id, movement_type, quantity, from_warehouse_id, reference)
         VALUES ($1, 'out', $2, $3, $4)`,
        [item.product_id, item.quantity, warehouse_id, 'SALE']
      );
    }

    const saleResult = await client.query(
      `INSERT INTO sales(warehouse_id, customer_name, total_amount, total_cost)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [warehouse_id, customer_name || null, totalAmount, totalCost]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items(sale_id, product_id, quantity, sale_price, purchase_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleResult.rows[0].id, item.product_id, item.quantity, item.sale_price, item.purchase_price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(saleResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/sales-over-time', async (req, res, next) => {
  try {
    const period = req.query.period === 'daily' ? 'day' : 'month';
    const result = await pool.query(
      `SELECT DATE_TRUNC($1, sale_date)::date AS period,
              SUM(total_amount)::numeric(12,2) AS sales,
              SUM(total_cost)::numeric(12,2) AS cost,
              (SUM(total_amount) - SUM(total_cost))::numeric(12,2) AS profit
       FROM sales
       GROUP BY 1
       ORDER BY 1 DESC`,
      [period]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/top-products', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.sku, SUM(si.quantity)::INT AS sold_qty,
              SUM(si.quantity * si.sale_price)::numeric(12,2) AS revenue
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       GROUP BY p.id
       ORDER BY sold_qty DESC
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
