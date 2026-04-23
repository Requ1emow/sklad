import { useState } from 'react';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

const tabs = [
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'reports', label: 'Reports' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="container">
      <h1>Auto Glass ERP</h1>
      <p className="sub">Inventory + Sales + Integrations MVP</p>

      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && <ProductsPage />}
      {activeTab === 'inventory' && <InventoryPage />}
      {activeTab === 'reports' && <ReportsPage />}
    </div>
  );
}
