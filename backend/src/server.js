import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import inventoryRouter from './routes/inventory.js';
import reportsRouter from './routes/reports.js';
import integrationsRouter from './routes/integrations.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '3mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auto-glass-erp-backend' });
});

app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/integrations', integrationsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ERP backend running on port ${PORT}`);
});
