import { useEffect, useState } from 'react';
import { api } from '../api';

const initialForm = {
  name: '',
  sku: '',
  purchase_price: 0,
  sale_price: 0,
  description: '',
  images: [],
  car_brand: '',
  car_model: '',
  year_from: 2000,
  year_to: 2026,
  glass_type: 'windshield',
  rain_sensor: false,
  heating: false,
  camera: false,
  color: '',
  width_mm: '',
  height_mm: ''
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ car_brand: '', car_model: '', year: '', sku: '' });

  async function loadProducts() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const data = await api.getProducts(params.toString() ? `?${params.toString()}` : '');
    setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function submitProduct(e) {
    e.preventDefault();
    await api.createProduct({
      ...form,
      purchase_price: Number(form.purchase_price),
      sale_price: Number(form.sale_price),
      year_from: Number(form.year_from),
      year_to: Number(form.year_to)
    });
    setForm(initialForm);
    await loadProducts();
  }

  return (
    <div className="grid2">
      <section>
        <h2>Add Product</h2>
        <form onSubmit={submitProduct} className="form">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <input placeholder="Car brand" value={form.car_brand} onChange={(e) => setForm({ ...form, car_brand: e.target.value })} required />
          <input placeholder="Car model" value={form.car_model} onChange={(e) => setForm({ ...form, car_model: e.target.value })} required />
          <input type="number" placeholder="Year from" value={form.year_from} onChange={(e) => setForm({ ...form, year_from: e.target.value })} required />
          <input type="number" placeholder="Year to" value={form.year_to} onChange={(e) => setForm({ ...form, year_to: e.target.value })} required />
          <select value={form.glass_type} onChange={(e) => setForm({ ...form, glass_type: e.target.value })}>
            <option value="windshield">Windshield</option>
            <option value="rear">Rear</option>
            <option value="side">Side</option>
          </select>
          <input type="number" step="0.01" placeholder="Purchase price" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} required />
          <input type="number" step="0.01" placeholder="Sale price" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} required />

          <div className="checks">
            <label><input type="checkbox" checked={form.rain_sensor} onChange={(e) => setForm({ ...form, rain_sensor: e.target.checked })} /> Rain sensor</label>
            <label><input type="checkbox" checked={form.heating} onChange={(e) => setForm({ ...form, heating: e.target.checked })} /> Heating</label>
            <label><input type="checkbox" checked={form.camera} onChange={(e) => setForm({ ...form, camera: e.target.checked })} /> Camera</label>
          </div>

          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="submit">Create</button>
        </form>
      </section>

      <section>
        <h2>Search</h2>
        <div className="filters">
          <input placeholder="SKU" value={filters.sku} onChange={(e) => setFilters({ ...filters, sku: e.target.value })} />
          <input placeholder="Brand" value={filters.car_brand} onChange={(e) => setFilters({ ...filters, car_brand: e.target.value })} />
          <input placeholder="Model" value={filters.car_model} onChange={(e) => setFilters({ ...filters, car_model: e.target.value })} />
          <input placeholder="Year" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
          <button onClick={loadProducts}>Apply Filters</button>
        </div>

        <h2>Products</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Name</th><th>Vehicle</th><th>Type</th><th>Price</th><th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.car_brand} {p.car_model} ({p.year_from}-{p.year_to})</td>
                  <td>{p.glass_type}</td>
                  <td>${p.sale_price}</td>
                  <td>{p.stock_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
