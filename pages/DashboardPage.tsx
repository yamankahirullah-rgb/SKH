import React from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/Card';
import { Scissors, Archive, AlertTriangle, Package } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { operations, materials, inventory, warehouses } = useAppContext();

  const totalOperations = operations.length;

  const lowStockItems = materials.filter(material => {
    const totalStock = inventory
      .filter(item => item.materialId === material.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    return totalStock < material.minStockLevel;
  }).length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-black mb-6">لوحة التحكم</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="إجمالي العمليات" value={totalOperations} icon={<Scissors size={32} />} color="blue" />
        <Card title="المواد" value={materials.length} icon={<Package size={32} />} color="green" />
        <Card title="نقص في المخزون" value={lowStockItems} icon={<AlertTriangle size={32} />} color="red" />
        <Card title="المستودعات" value={warehouses.length} icon={<Archive size={32} />} color="yellow" />
      </div>
    </div>
  );
};

export default DashboardPage;