import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  const schemaPath = path.join(__dirname, '..', 'sql_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);

  // Add default warehouse to make first-time setup smoother.
  await pool.query(
    `INSERT INTO warehouses(name, code, address)
     VALUES ('Main Warehouse', 'MAIN', 'Default location')
     ON CONFLICT (code) DO NOTHING`
  );

  console.log('Database schema initialized.');
  await pool.end();
}

init().catch(async (error) => {
  console.error('Failed to initialize DB:', error);
  await pool.end();
  process.exit(1);
});
