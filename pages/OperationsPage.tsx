import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Operation, UsedMaterial } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import OperationCard from '../components/OperationCard';
import { Plus, Edit, Trash2, PlusCircle, MinusCircle, LayoutGrid, List } from 'lucide-react';

const OperationsPage: React.FC = () => {
  const context = useAppContext();
  const { operations, operationTypes, jointTypes, technicians, warehouses, materials, addOperation, updateOperation, deleteOperation } = context;

  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Operation>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  const findNameById = (arr: {id: string, name: string}[], id: string | undefined) => id ? arr.find(item => item.id === id)?.name || 'غير معروف' : '-';
  
  const openModal = (operation: Operation | null) => {
    setCurrentOperation(operation);
    const initialData = operation ? { ...operation } : {
      patientName: '',
      operationTypeId: '',
      jointTypeId: '',
      technicianId: '',
      warehouseId: '',
      materialsUsed: [{ materialId: '', quantity: 1 }],
      date: new Date().toISOString().split('T')[0],
      notes: '',
      priceUSD: 0,
      priceSYP: 0,
    };
    setFormData(initialData);
    setModalOpen(true);
  };
  
  const closeModal = () => setModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (index: number, field: keyof UsedMaterial, value: string | number) => {
    const newMaterialsUsed = [...(formData.materialsUsed || [])];
    newMaterialsUsed[index] = { ...newMaterialsUsed[index], [field]: value };
    setFormData(prev => ({ ...prev, materialsUsed: newMaterialsUsed }));
  };

  const addMaterialField = () => {
    const newMaterialsUsed = [...(formData.materialsUsed || []), { materialId: '', quantity: 1 }];
    setFormData(prev => ({ ...prev, materialsUsed: newMaterialsUsed }));
  };
  
  const removeMaterialField = (index: number) => {
    const newMaterialsUsed = (formData.materialsUsed || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, materialsUsed: newMaterialsUsed }));
  };

  const handleSubmit = () => {
    // Basic Validation
    if (!formData.patientName || !formData.operationTypeId || !formData.warehouseId || !formData.date || !formData.jointTypeId) {
        alert('يرجى ملء جميع الحقول الإلزامية.');
        return;
    }
    const finalOperationData = {
      ...formData,
      technicianId: formData.technicianId || undefined,
      materialsUsed: formData.materialsUsed?.filter(m => m.materialId && m.quantity > 0) || [],
      priceUSD: Number(formData.priceUSD) || undefined,
      priceSYP: Number(formData.priceSYP) || undefined,
    } as Omit<Operation, 'id'>;

    if (currentOperation) {
      updateOperation({ ...finalOperationData, id: currentOperation.id });
    } else {
      addOperation(finalOperationData);
    }
    closeModal();
  };

  const handleDeleteClick = (id: string) => {
    setOperationToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if(operationToDelete) {
      deleteOperation(operationToDelete);
    }
    setConfirmOpen(false);
    setOperationToDelete(null);
  };

  const sortedOperations = useMemo(() =>
    [...operations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [operations]
  );
  
  const filteredOperations = useMemo(() => {
    if (!searchTerm) {
        return sortedOperations;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedOperations.filter(op => {
      const patient = op.patientName.toLowerCase();
      const operationType = findNameById(operationTypes, op.operationTypeId).toLowerCase();
      const technician = findNameById(technicians, op.technicianId).toLowerCase();
      const doctor = op.doctorName?.toLowerCase() || '';

      return patient.includes(lowercasedFilter) ||
             operationType.includes(lowercasedFilter) ||
             technician.includes(lowercasedFilter) ||
             doctor.includes(lowercasedFilter);
    });
  }, [searchTerm, sortedOperations, operationTypes, technicians]);


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-black">العمليات</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center bg-gray-200 rounded-lg p-1">
                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}>
                    <List size={20} />
                </button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}>
                    <LayoutGrid size={20} />
                </button>
            </div>
           <input
              type="text"
              placeholder="بحث (مريض، عملية، طبيب...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 p-2 border rounded"
            />
          <button onClick={() => openModal(null)} className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Plus size={20} className="me-2" />
            إضافة عملية
          </button>
        </div>
      </div>
      
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[1200px] text-right">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="p-3 text-black font-semibold">المريض</th>
                <th className="p-3 text-black font-semibold">نوع العملية</th>
                <th className="p-3 text-black font-semibold">الطبيب</th>
                <th className="p-3 text-black font-semibold">الفني</th>
                <th className="p-3 text-black font-semibold">المستودع</th>
                <th className="p-3 text-black font-semibold">المواد المستخدمة</th>
                <th className="p-3 text-black font-semibold">التاريخ</th>
                <th className="p-3 text-black font-semibold">السعر</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOperations.map(op => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="p-3 text-black">{op.patientName}</td>
                  <td className="p-3 text-black">{findNameById(operationTypes, op.operationTypeId)}</td>
                  <td className="p-3 text-black">{op.doctorName || '-'}</td>
                  <td className="p-3 text-black">{findNameById(technicians, op.technicianId)}</td>
                  <td className="p-3 text-black">{findNameById(warehouses, op.warehouseId)}</td>
                  <td className="p-3 text-black text-sm">
                    {op.materialsUsed.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {op.materialsUsed.map(used => (
                          <li key={used.materialId}>
                            {findNameById(materials, used.materialId)} ({used.quantity})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-3 text-black">{new Date(op.date).toLocaleDateString('ar-SY')}</td>
                  <td className="p-3 text-black text-sm">
                    {op.priceSYP && <div>{op.priceSYP.toLocaleString('ar-SY')} ل.س</div>}
                    {op.priceUSD && <div>${op.priceUSD.toLocaleString('en-US')}</div>}
                    {!op.priceSYP && !op.priceUSD && '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end">
                      <button onClick={() => openModal(op)} className="text-red-600 hover:text-red-800 me-4"><Edit size={20} /></button>
                      <button onClick={() => handleDeleteClick(op.id)} className="text-red-600 hover:text-red-800"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
               {filteredOperations.length === 0 && (
                  <tr>
                      <td colSpan={9} className="text-center p-4 text-gray-500">
                          {searchTerm ? 'لا توجد عمليات تطابق البحث.' : 'لا توجد عمليات مسجلة.'}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOperations.map(op => (
              <OperationCard 
                key={op.id} 
                operation={op} 
                onEdit={openModal} 
                onDelete={handleDeleteClick}
              />
            ))}
            {filteredOperations.length === 0 && (
              <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center p-4 text-gray-500 bg-white rounded-lg shadow-md">
                {searchTerm ? 'لا توجد عمليات تطابق البحث.' : 'لا توجد عمليات مسجلة.'}
              </div>
            )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentOperation ? 'تعديل عملية' : 'إضافة عملية جديدة'}
        footer={<>
          <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded">{currentOperation ? 'حفظ' : 'إضافة'}</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="patientName" placeholder="اسم المريض" value={formData.patientName || ''} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="date" name="date" value={formData.date?.split('T')[0] || ''} onChange={handleChange} className="w-full p-2 border rounded" required />
            
            <select name="operationTypeId" value={formData.operationTypeId || ''} onChange={handleChange} className="w-full p-2 border rounded" required>
                <option value="">اختر نوع العملية</option>
                {operationTypes.map(ot => <option key={ot.id} value={ot.id}>{ot.name}</option>)}
            </select>
            <select name="jointTypeId" value={formData.jointTypeId || ''} onChange={handleChange} className="w-full p-2 border rounded" required>
                <option value="">اختر نوع المفصل</option>
                {jointTypes.map(jt => <option key={jt.id} value={jt.id}>{jt.name}</option>)}
            </select>

             <select name="technicianId" value={formData.technicianId || ''} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">اختر الفني (اختياري)</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
             <select name="assistantTechnicianId" value={formData.assistantTechnicianId || ''} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">اختر الفني المساعد (اختياري)</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select name="warehouseId" value={formData.warehouseId || ''} onChange={handleChange} className="w-full p-2 border rounded" required>
                <option value="">اختر المستودع</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
             <input type="text" name="doctorName" placeholder="اسم الطبيب (اختياري)" value={formData.doctorName || ''} onChange={handleChange} className="w-full p-2 border rounded" />
             <input type="number" name="priceUSD" placeholder="السعر (دولار)" value={formData.priceUSD || ''} onChange={handleChange} className="w-full p-2 border rounded" />
             <input type="number" name="priceSYP" placeholder="السعر (ليرة سورية)" value={formData.priceSYP || ''} onChange={handleChange} className="w-full p-2 border rounded" />
            <textarea name="notes" placeholder="ملاحظات (اختياري)" value={formData.notes || ''} onChange={handleChange} className="w-full md:col-span-2 p-2 border rounded" rows={3}></textarea>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold text-black mb-2">المواد المستخدمة</h4>
            {formData.materialsUsed?.map((used, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                    <select value={used.materialId} onChange={e => handleMaterialChange(index, 'materialId', e.target.value)} className="w-full p-2 border rounded">
                        <option value="">اختر المادة</option>
                        {materials.filter(m => formData.jointTypeId ? (m.jointTypeId === formData.jointTypeId || m.jointTypeId === 'jt4') : true).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" value={used.quantity} onChange={e => handleMaterialChange(index, 'quantity', Number(e.target.value))} className="w-24 p-2 border rounded" min="1" />
                     <button onClick={() => removeMaterialField(index)} className="text-red-500"><MinusCircle size={20} /></button>
                </div>
            ))}
             <button onClick={addMaterialField} className="flex items-center text-red-600 mt-2">
                <PlusCircle size={20} className="me-2" /> إضافة مادة
            </button>
        </div>
      </Modal>
      <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="تأكيد الحذف" message="هل أنت متأكد من حذف هذه العملية؟ سيتم إرجاع المواد المستخدمة إلى المخزون." />
    </div>
  );
};

export default OperationsPage;