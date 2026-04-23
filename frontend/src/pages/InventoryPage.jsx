import { useEffect, useState } from 'react';
import { api } from '../api';

export default function InventoryPage() {
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    movement_type: 'in',
    quantity: 1,
    from_warehouse_id: 1,
    to_warehouse_id: 1,
    reference: ''
  });

  async function reload() {
    const [stockData, movementData] = await Promise.all([api.getStock(), api.getMovements()]);
    setStock(stockData);
    setMovements(movementData);
  }

  useEffect(() => {
    reload();
  }, []);

  async function submitMovement(e) {
    e.preventDefault();
    await api.createMovement({ ...form, quantity: Number(form.quantity), product_id: Number(form.product_id) });
    await reload();
  }

  return (
    <div className="grid2">
      <section>
        <h2>Register Inventory Movement</h2>
        <form className="form" onSubmit={submitMovement}>
          <input type="number" placeholder="Product ID" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required />
          <select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}>
            <option value="in">In</option>
            <option value="out">Out</option>
            <option value="transfer">Transfer</option>
          </select>
          <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          <input type="number" placeholder="From warehouse" value={form.from_warehouse_id} onChange={(e) => setForm({ ...form, from_warehouse_id: e.target.value })} />
          <input type="number" placeholder="To warehouse" value={form.to_warehouse_id} onChange={(e) => setForm({ ...form, to_warehouse_id: e.target.value })} />
          <input placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <button type="submit">Save movement</button>
        </form>
      </section>

      <section>
        <h2>Current Stock</h2>
        <ul>
          {stock.map((item) => (
            <li key={`${item.product_id}-${item.warehouse_id}`}>
              {item.sku} - {item.name} / {item.warehouse_name}: <b>{item.quantity}</b>
            </li>
          ))}
        </ul>

        <h2>Movement History</h2>
        <ul>
          {movements.slice(0, 20).map((m) => (
            <li key={m.id}>{m.created_at}: #{m.product_id} {m.movement_type} x{m.quantity}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
