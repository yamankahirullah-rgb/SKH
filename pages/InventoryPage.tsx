import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Material, Warehouse } from '../types';
import Modal from '../components/Modal';
import { ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface TransferItem {
  materialId: string;
  quantity: number;
}

const InventoryPage: React.FC = () => {
  const { materials, warehouses, inventory, transferMultipleStock } = useAppContext();
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([{ materialId: '', quantity: 1 }]);
  const [filter, setFilter] = useState('');

  const inventoryMap = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    inventory.forEach(item => {
      if (!map.has(item.materialId)) {
        map.set(item.materialId, {});
      }
      map.get(item.materialId)![item.warehouseId] = item.quantity;
    });
    return map;
  }, [inventory]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));
  }, [materials, filter]);

  const openTransferModal = () => setTransferModalOpen(true);
  const closeTransferModal = () => {
      setTransferModalOpen(false);
      setFromWarehouse('');
      setToWarehouse('');
      setTransferItems([{ materialId: '', quantity: 1 }]);
  };
  
  const handleTransfer = () => {
    if (!fromWarehouse || !toWarehouse || fromWarehouse === toWarehouse) {
      alert('يرجى اختيار مستودعين مختلفين.');
      return;
    }
    const validItems = transferItems.filter(item => item.materialId && item.quantity > 0);
    if(validItems.length === 0) {
        alert('يرجى إضافة مواد للتحويل.');
        return;
    }
    
    // Check for sufficient stock
    for (const item of validItems) {
        const stock = inventoryMap.get(item.materialId)?.[fromWarehouse] || 0;
        if(stock < item.quantity) {
            const materialName = materials.find(m => m.id === item.materialId)?.name;
            alert(`لا يوجد مخزون كافٍ من "${materialName}" في المستودع المصدر.`);
            return;
        }
    }

    transferMultipleStock(validItems, fromWarehouse, toWarehouse);
    closeTransferModal();
  };

  const handleTransferItemChange = (index: number, field: keyof TransferItem, value: string | number) => {
    const newItems = [...transferItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setTransferItems(newItems);
  };
  
  const addTransferItem = () => {
      setTransferItems([...transferItems, {materialId: '', quantity: 1}]);
  };
  const removeTransferItem = (index: number) => {
      setTransferItems(transferItems.filter((_, i) => i !== index));
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-black">المخزون</h1>
        <div className="w-full sm:w-auto flex gap-2">
            <input 
                type="text" 
                placeholder="بحث عن مادة..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full sm:w-64 p-2 border rounded"
            />
            <button onClick={openTransferModal} className="flex-shrink-0 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <ArrowRightLeft size={20} className="me-2" />
              تحويل مخزون
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full min-w-[800px] text-right">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-3 text-black font-semibold">المادة</th>
              {warehouses.map(wh => <th key={wh.id} className="p-3 text-black font-semibold">{wh.name}</th>)}
              <th className="p-3 text-black font-semibold">المجموع</th>
              <th className="p-3 text-black font-semibold">الحد الأدنى</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredMaterials.map((material: Material) => {
              // FIX: Cast the result of Object.values to number[] to resolve type ambiguity
              const totalStock = (Object.values(inventoryMap.get(material.id) || {}) as number[]).reduce((sum, qty) => sum + qty, 0);
              const isLowStock = totalStock < material.minStockLevel;
              return (
                <tr key={material.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                  <td className="p-3 text-black font-semibold">{material.name}</td>
                  {warehouses.map(wh => (
                    <td key={wh.id} className="p-3 text-black">
                      {inventoryMap.get(material.id)?.[wh.id] || 0}
                    </td>
                  ))}
                  <td className="p-3 text-black font-bold">{totalStock}</td>
                  <td className={`p-3 font-medium ${isLowStock ? 'text-red-600' : 'text-black'}`}>
                    <div className="flex items-center justify-end">
                      {isLowStock && <AlertTriangle size={16} className="me-2" />}
                      {material.minStockLevel}
                    </div>
                  </td>
                </tr>
              );
            })}
             {filteredMaterials.length === 0 && (
                <tr>
                    <td colSpan={warehouses.length + 3} className="text-center p-4 text-gray-500">لا توجد مواد تطابق البحث.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <Modal isOpen={isTransferModalOpen} onClose={closeTransferModal} title="تحويل مخزون" footer={
        <>
            <button onClick={closeTransferModal} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
            <button onClick={handleTransfer} className="px-4 py-2 bg-red-600 text-white rounded">تأكيد التحويل</button>
        </>
      }>
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <select value={fromWarehouse} onChange={e => setFromWarehouse(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">من مستودع...</option>
                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
                <select value={toWarehouse} onChange={e => setToWarehouse(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">إلى مستودع...</option>
                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
            </div>
            <hr/>
            <h4 className="font-semibold text-black">المواد المحولة</h4>
            {transferItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <select value={item.materialId} onChange={e => handleTransferItemChange(index, 'materialId', e.target.value)} className="w-full p-2 border rounded" disabled={!fromWarehouse}>
                        <option value="">اختر المادة...</option>
                        {materials
                            .filter(m => (inventoryMap.get(m.id)?.[fromWarehouse] || 0) > 0)
                            .map(m => <option key={m.id} value={m.id}>{m.name} (المتوفر: {inventoryMap.get(m.id)?.[fromWarehouse]})</option>)
                        }
                    </select>
                    <input type="number" value={item.quantity} onChange={e => handleTransferItemChange(index, 'quantity', Number(e.target.value))} className="w-24 p-2 border rounded" min="1" />
                    <button onClick={() => removeTransferItem(index)} className="text-gray-500 hover:text-red-500">-</button>
                </div>
            ))}
            <button onClick={addTransferItem} className="text-red-600">+ إضافة مادة أخرى</button>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;