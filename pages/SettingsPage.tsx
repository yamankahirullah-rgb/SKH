import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { JointType, Material, Warehouse, Technician, OperationType, Profile } from '../types';
import { Plus, Edit, Trash2, Send, User as UserIcon } from 'lucide-react';
import { supabase } from '../supabase/client';

type SettingsItem = JointType | Material | Warehouse | Technician | OperationType;
type ItemType = 'jointTypes' | 'materials' | 'warehouses' | 'technicians' | 'operationTypes';
type ActiveTab = ItemType | 'users';

const SettingsPage: React.FC = () => {
  const context = useAppContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'users', label: 'المستخدمون' },
    { id: 'materials', label: 'المواد' },
    { id: 'jointTypes', label: 'أنواع المفاصل' },
    { id: 'warehouses', label: 'المستودعات' },
    { id: 'technicians', label: 'الفنيون' },
    { id: 'operationTypes', label: 'أنواع العمليات' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-black mb-6">الإعدادات</h1>
      <div className="flex border-b mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-red-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'users' ? <UsersTab /> : <SettingsTab itemType={activeTab} />}
      </div>
    </div>
  );
};

const UsersTab: React.FC = () => {
    const { profiles, session } = useAppContext();
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.functions.invoke('invite-user', {
            body: { email: inviteEmail },
        });
        
        if (error) {
            setError(error.message || 'حدث خطأ أثناء إرسال الدعوة.');
        } else {
            setMessage(`تم إرسال دعوة بنجاح إلى ${inviteEmail}`);
            setInviteEmail('');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-black mb-4">دعوة مستخدم جديد</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-center gap-2 mb-6">
                <input
                    type="email"
                    placeholder="أدخل البريد الإلكتروني للمستخدم"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
                >
                    <Send size={16} className="me-2" />
                    {loading ? '...جاري الإرسال' : 'إرسال دعوة'}
                </button>
            </form>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            {message && <p className="text-sm text-green-600 mb-4">{message}</p>}

            <h2 className="text-2xl font-bold text-black mb-4">المستخدمون الحاليون</h2>
            <ul className="divide-y">
                {profiles.map(profile => (
                    <li key={profile.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                            <UserIcon size={20} className="text-gray-500 me-3" />
                            <span className="text-black">{profile.email}</span>
                        </div>
                        {profile.id === session.user.id && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">أنت</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};


const SettingsTab: React.FC<{ itemType: ItemType }> = ({ itemType }) => {
  const context = useAppContext();

  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<SettingsItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SettingsItem>>({});
  const [materialStock, setMaterialStock] = useState<{ warehouseId: string, quantity: number }[]>([]);
  
  const typeConfig: { [key in ItemType]: { title: string; fields: string[]; data: SettingsItem[]; crud: any } } = {
    jointTypes: { title: 'أنواع المفاصل', fields: ['name'], data: context.jointTypes, crud: { add: context.addJointType, update: context.updateJointType, delete: context.deleteJointType } },
    materials: { title: 'المواد', fields: ['name', 'minStockLevel', 'jointTypeId'], data: context.materials, crud: { add: context.addMaterial, update: context.updateMaterial, delete: context.deleteMaterial } },
    warehouses: { title: 'المستودعات', fields: ['name'], data: context.warehouses, crud: { add: context.addWarehouse, update: context.updateWarehouse, delete: context.deleteWarehouse } },
    technicians: { title: 'الفنيون', fields: ['name'], data: context.technicians, crud: { add: context.addTechnician, update: context.updateTechnician, delete: context.deleteTechnician } },
    operationTypes: { title: 'أنواع العمليات', fields: ['name'], data: context.operationTypes, crud: { add: context.addOperationType, update: context.updateOperationType, delete: context.deleteOperationType } },
  };
  
  const config = typeConfig[itemType];

  const openModal = (item: SettingsItem | null) => {
    setCurrentItem(item);
    setFormData(item ? { ...item } : (itemType === 'materials' ? { name: '', minStockLevel: 0 } : {name: ''}));
    
    if (itemType === 'materials') {
      if (item) { // Editing existing material
        const currentStock = context.warehouses.map(wh => {
          const stockItem = context.inventory.find(inv => inv.materialId === item.id && inv.warehouseId === wh.id);
          return { warehouseId: wh.id, quantity: stockItem?.quantity || 0 };
        });
        setMaterialStock(currentStock);
      } else { // Adding new material
        setMaterialStock(context.warehouses.map(wh => ({ warehouseId: wh.id, quantity: 0 })));
      }
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentItem(null);
    setFormData({});
    setMaterialStock([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'minStockLevel' ? Math.max(0, Number(value)) : value }));
  };

  const handleStockChange = (warehouseId: string, quantity: number) => {
    setMaterialStock(prev => prev.map(stock => 
        stock.warehouseId === warehouseId ? { ...stock, quantity: Math.max(0, quantity) } : stock
    ));
  };

  const handleSubmit = () => {
    if (!('name' in formData) || !formData.name) {
        alert("الاسم حقل مطلوب.");
        return;
    }

    if (itemType === 'materials') {
      if (currentItem) {
        context.updateMaterial({ ...formData, id: currentItem.id }, materialStock);
      } else {
        const validStock = materialStock.filter(s => s.quantity > 0);
        context.addMaterial(formData as Omit<Material, 'id' | 'account_id'>, validStock);
      }
    } else {
        if (currentItem) {
            config.crud.update({ ...formData, id: currentItem.id });
        } else {
            config.crud.add(formData as any);
        }
    }
    closeModal();
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    config.crud.delete(itemToDelete);
    setConfirmOpen(false);
    setItemToDelete(null);
  };
  
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
    const labelMap: { [key: string]: string } = { name: 'الاسم', minStockLevel: 'الحد الأدنى للمخزون' }
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
    const fields = config.fields.map(field => renderField(field));
    if (itemType === 'materials') {
      const stockTitle = currentItem ? "المخزون" : "المخزون المبدئي (اختياري)";
      return (
        <>
          {fields}
          <div className="mt-4 pt-4 border-t">
            <h4 className="block text-black text-sm font-bold mb-2">{stockTitle}</h4>
            <div className="space-y-2">
              {context.warehouses.map(warehouse => (
                <div key={warehouse.id} className="flex items-center justify-between">
                  <label className="text-gray-700">{warehouse.name}</label>
                  <input
                    type="number"
                    value={materialStock.find(s => s.warehouseId === warehouse.id)?.quantity ?? 0}
                    onChange={e => handleStockChange(warehouse.id, parseInt(e.target.value) || 0)}
                    className="w-24 p-2 border rounded"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
    return fields;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">{config.title}</h2>
        <button onClick={() => openModal(null)} className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <Plus size={20} className="me-2" />
          إضافة
        </button>
      </div>
      <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right">
              <thead className="bg-gray-50">
                  <tr className="border-b">
                      <th className="p-3 text-black font-semibold">الاسم</th>
                      {itemType === 'materials' && <th className="p-3 text-black font-semibold">الحد الأدنى</th>}
                      {itemType === 'materials' && <th className="p-3 text-black font-semibold">نوع المفصل</th>}
                      <th className="p-3"></th>
                  </tr>
              </thead>
              <tbody className="divide-y">
                  {config.data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3 text-black">{item.name}</td>
                          {itemType === 'materials' && <td className="p-3 text-black">{(item as Material).minStockLevel}</td>}
                          {itemType === 'materials' && <td className="p-3 text-black">{context.jointTypes.find(jt => jt.id === (item as Material).jointTypeId)?.name || ((item as Material).jointTypeId ? 'عام' : '-')}</td>}
                          <td className="p-3">
                              <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                  <button onClick={() => openModal(item)} className="text-gray-500 hover:text-red-600"><Edit size={20} /></button>
                                  <button onClick={() => handleDeleteClick(item.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {config.data.length === 0 && (
                      <tr><td colSpan={itemType === 'materials' ? 4 : 2} className="text-center p-4 text-gray-500">لا توجد بيانات.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
       <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={`${currentItem ? 'تعديل' : 'إضافة'} ${config.title}`}
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