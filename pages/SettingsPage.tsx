import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { JointType, Material, Warehouse, Technician, OperationType } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

// A generic type for the items we are managing
type SettingsItem = JointType | Material | Warehouse | Technician | OperationType;

// To identify which section we're working with
type ItemType = 'jointTypes' | 'materials' | 'warehouses' | 'technicians' | 'operationTypes';

const SettingsPage: React.FC = () => {
  const context = useAppContext();

  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  
  const [modalType, setModalType] = useState<ItemType | null>(null);
  const [currentItem, setCurrentItem] = useState<SettingsItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: ItemType } | null>(null);
  const [formData, setFormData] = useState<Partial<SettingsItem>>({});

  // FIX: The `fields` property is changed to `string[]` to allow for properties
  // that are not common to all `SettingsItem` types (e.g., 'minStockLevel').
  const typeConfig: { [key in ItemType]: { title: string; fields: string[]; data: SettingsItem[]; crud: any } } = {
    jointTypes: { title: 'أنواع المفاصل', fields: ['name'], data: context.jointTypes, crud: { add: context.addJointType, update: context.updateJointType, delete: context.deleteJointType } },
    materials: { title: 'المواد', fields: ['name', 'minStockLevel', 'jointTypeId'], data: context.materials, crud: { add: context.addMaterial, update: context.updateMaterial, delete: context.deleteMaterial } },
    warehouses: { title: 'المستودعات', fields: ['name'], data: context.warehouses, crud: { add: context.addWarehouse, update: context.updateWarehouse, delete: context.deleteWarehouse } },
    technicians: { title: 'الفنيون', fields: ['name'], data: context.technicians, crud: { add: context.addTechnician, update: context.updateTechnician, delete: context.deleteTechnician } },
    operationTypes: { title: 'أنواع العمليات', fields: ['name'], data: context.operationTypes, crud: { add: context.addOperationType, update: context.updateOperationType, delete: context.deleteOperationType } },
  };

  const openModal = (type: ItemType, item: SettingsItem | null) => {
    setModalType(type);
    setCurrentItem(item);
    setFormData(item ? { ...item } : (type === 'materials' ? { minStockLevel: 0 } : {}));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setCurrentItem(null);
    setFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'minStockLevel' ? Number(value) : value }));
  };

  const handleSubmit = () => {
    if (!modalType) return;
    const config = typeConfig[modalType];
    
    // Basic validation
    if (!('name' in formData) || !formData.name) {
        alert("الاسم حقل مطلوب.");
        return;
    }

    if (currentItem) {
      config.crud.update({ ...formData, id: currentItem.id });
    } else {
      // FIX: Cast to any to avoid complex type issues with Omit<T, ...>
      config.crud.add(formData as any);
    }
    closeModal();
  };

  const handleDeleteClick = (id: string, type: ItemType) => {
    setItemToDelete({ id, type });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    typeConfig[type].crud.delete(id);
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  // FIX: The `field` parameter type is changed to `string` to match the updated `typeConfig`
  // and resolve comparison errors.
  const renderField = (field: string) => {
    if (field === 'jointTypeId') {
        return (
             <div key={field} className="mb-4">
                <label className="block text-black text-sm font-bold mb-2">نوع المفصل</label>
                <select name="jointTypeId" value={(formData as Material).jointTypeId || ''} onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="">اختر نوع المفصل (اختياري)</option>
                    {context.jointTypes.map(jt => <option key={jt.id} value={jt.id}>{jt.name}</option>)}
                     <option key="jt4" value="jt4">عام</option>
                </select>
            </div>
        )
    }
    const labelMap: { [key: string]: string } = {
        name: 'الاسم',
        minStockLevel: 'الحد الأدنى للمخزون'
    }

    return (
        <div key={field} className="mb-4">
            <label className="block text-black text-sm font-bold mb-2">{labelMap[field] || field}</label>
            <input
                type={field === 'minStockLevel' ? 'number' : 'text'}
                name={field}
                value={(formData as any)[field] || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min={field === 'minStockLevel' ? 0 : undefined}
            />
        </div>
    )
  }

  const renderModalContent = () => {
    if (!modalType) return null;
    const fields = typeConfig[modalType].fields;
    // FIX: Removed unnecessary cast after changing field types.
    return fields.map(field => renderField(field));
  };

  const renderTable = (type: ItemType) => {
    const config = typeConfig[type];
    const { title, data } = config;

    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">{title}</h2>
          <button onClick={() => openModal(type, null)} className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Plus size={20} className="me-2" />
            إضافة
          </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-right">
                <thead className="bg-gray-50">
                    <tr className="border-b">
                        <th className="p-3 text-black font-semibold">الاسم</th>
                        {type === 'materials' && <th className="p-3 text-black font-semibold">الحد الأدنى</th>}
                        {type === 'materials' && <th className="p-3 text-black font-semibold">نوع المفصل</th>}
                        <th className="p-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-3 text-black">{item.name}</td>
                            {type === 'materials' && <td className="p-3 text-black">{(item as Material).minStockLevel}</td>}
                            {type === 'materials' && <td className="p-3 text-black">{context.jointTypes.find(jt => jt.id === (item as Material).jointTypeId)?.name || ((item as Material).jointTypeId ? 'عام' : '-')}</td>}
                            <td className="p-3">
                                <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                    <button onClick={() => openModal(type, item)} className="text-gray-500 hover:text-red-600"><Edit size={20} /></button>
                                    <button onClick={() => handleDeleteClick(item.id, type)} className="text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr><td colSpan={type === 'materials' ? 4 : 2} className="text-center p-4 text-gray-500">لا توجد بيانات.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-black mb-6">الإعدادات</h1>
      <div className="space-y-8">
        {renderTable('jointTypes')}
        {renderTable('materials')}
        {renderTable('warehouses')}
        {renderTable('technicians')}
        {renderTable('operationTypes')}
      </div>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={`${currentItem ? 'تعديل' : 'إضافة'} ${modalType ? typeConfig[modalType].title : ''}`}
        footer={<>
            <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded">{currentItem ? 'حفظ' : 'إضافة'}</button>
        </>}
      >
        {renderModalContent()}
      </Modal>

      <ConfirmationModal 
        isOpen={isConfirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={confirmDelete} 
        title="تأكيد الحذف" 
        message="هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء." 
      />
    </div>
  );
};

export default SettingsPage;