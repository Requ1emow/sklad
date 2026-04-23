import { useEffect, useState } from 'react';
import { api } from '../api';

export default function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [top, setTop] = useState([]);

  useEffect(() => {
    (async () => {
      const [salesData, topData] = await Promise.all([api.getSalesOverTime(), api.getTopProducts()]);
      setSales(salesData);
      setTop(topData);
    })();
  }, []);

  return (
    <div className="grid2">
      <section>
        <h2>Sales Over Time</h2>
        <table>
          <thead><tr><th>Period</th><th>Sales</th><th>Cost</th><th>Profit</th></tr></thead>
          <tbody>
            {sales.map((row) => (
              <tr key={row.period}>
                <td>{row.period}</td>
                <td>${row.sales}</td>
                <td>${row.cost}</td>
                <td>${row.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Top Selling Products</h2>
        <ol>
          {top.map((item) => (
            <li key={item.id}>{item.sku} - {item.name}: {item.sold_qty} pcs (${item.revenue})</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
