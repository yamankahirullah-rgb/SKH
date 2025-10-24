import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { JointType, Material, Warehouse, Technician, OperationType, Profile } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { Plus, Edit, Trash2, Users, Send } from 'lucide-react';
import { supabase } from '../supabase/client';

type EntityKey = 'materials' | 'jointTypes' | 'warehouses' | 'technicians' | 'operationTypes' | 'users';
type EntityType = JointType | Material | Warehouse | Technician | OperationType | Profile;

const entityConfig: Record<string, any> = {
    materials: { title: 'المواد', addFn: 'addMaterial', updateFn: 'updateMaterial', deleteFn: 'deleteMaterial', fields: [{name: 'name', label: 'الاسم', required: true}, {name: 'minStockLevel', label: 'الحد الأدنى للمخزون', type: 'number', required: true}, {name: 'jointTypeId', label: 'نوع المفصل', type: 'select', optionsKey: 'jointTypes', required: true}] },
    jointTypes: { title: 'أنواع المفاصل', addFn: 'addJointType', updateFn: 'updateJointType', deleteFn: 'deleteJointType', fields: [{name: 'name', label: 'الاسم', required: true}] },
    warehouses: { title: 'المستودعات', addFn: 'addWarehouse', updateFn: 'updateWarehouse', deleteFn: 'deleteWarehouse', fields: [{name: 'name', label: 'الاسم', required: true}] },
    technicians: { title: 'الفنيون', addFn: 'addTechnician', updateFn: 'updateTechnician', deleteFn: 'deleteTechnician', fields: [{name: 'name', label: 'الاسم', required: true}] },
    operationTypes: { title: 'أنواع العمليات', addFn: 'addOperationType', updateFn: 'updateOperationType', deleteFn: 'deleteOperationType', fields: [{name: 'name', label: 'الاسم', required: true}] },
    users: { title: 'المستخدمون' }
};

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EntityKey>('materials');
    
    const CrudManager = ({ entityKey }: { entityKey: EntityKey }) => {
        const context = useAppContext();
        const config = entityConfig[entityKey];
        const data = (context as any)[entityKey] as EntityType[];
        
        const [isModalOpen, setModalOpen] = useState(false);
        const [isConfirmOpen, setConfirmOpen] = useState(false);
        const [currentItem, setCurrentItem] = useState<EntityType | null>(null);
        const [itemToDelete, setItemToDelete] = useState<string | null>(null);
        const [formData, setFormData] = useState<any>({});

        const openModal = (item: EntityType | null) => {
            setCurrentItem(item);
            setFormData(item || {});
            setModalOpen(true);
        };
        const closeModal = () => setModalOpen(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
            const isNumber = type === 'number';
            setFormData({ ...formData, [name]: isNumber && value ? Number(value) : value });
        };
        
        const handleSubmit = () => {
             for (const field of config.fields) {
                if (field.required && !formData[field.name]) {
                    alert(`يرجى ملء حقل "${field.label}"`);
                    return;
                }
            }
            const { id, ...dataToSave } = formData;
            if (currentItem) {
                (context as any)[config.updateFn]({ ...dataToSave, id: currentItem.id });
            } else {
                (context as any)[config.addFn](dataToSave);
            }
            closeModal();
        };

        const handleDeleteClick = (id: string) => {
            setItemToDelete(id);
            setConfirmOpen(true);
        };

        const confirmDelete = () => {
            if(itemToDelete) {
                (context as any)[config.deleteFn](itemToDelete);
            }
            setConfirmOpen(false);
            setItemToDelete(null);
        };

        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-black">{config.title}</h2>
                    <button onClick={() => openModal(null)} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <Plus size={20} className="me-2" />
                        إضافة
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-md divide-y">
                    {data.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3">
                           <span className="text-black">{(item as any).name}</span>
                           <div className="flex items-center">
                                <button onClick={() => openModal(item)} className="text-red-600 hover:text-red-800 me-4"><Edit size={20} /></button>
                                <button onClick={() => handleDeleteClick(item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={20} /></button>
                           </div>
                        </div>
                    ))}
                </div>

                <Modal isOpen={isModalOpen} onClose={closeModal} title={currentItem ? `تعديل ${config.title.slice(0, -1)}` : `إضافة ${config.title.slice(0, -1)}`}
                 footer={<>
                    <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded">{currentItem ? 'حفظ' : 'إضافة'}</button>
                 </>}
                >
                    <div className="space-y-4">
                        {config.fields.map((field: any) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-black">{field.label}</label>
                                {field.type === 'select' ? (
                                    <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="w-full p-2 border rounded mt-1">
                                        <option value="">اختر</option>
                                        {(context as any)[field.optionsKey!].map((opt: any) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                    </select>
                                ) : (
                                    <input type={field.type || 'text'} name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </Modal>
                <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="تأكيد الحذف" message="هل أنت متأكد؟ قد يؤثر حذف هذا العنصر على السجلات المرتبطة به." />
            </div>
        )
    };
    
    const UserManager = () => {
        const { profile } = useAppContext();
        const [users, setUsers] = useState<Profile[]>([]);
        const [inviteEmail, setInviteEmail] = useState('');
        const [feedback, setFeedback] = useState('');

        useEffect(() => {
            const fetchUsers = async () => {
                if(profile) {
                    const { data } = await supabase.from('profiles').select('*').eq('account_id', profile.account_id);
                    setUsers(data || []);
                }
            };
            fetchUsers();
        }, [profile]);
        
        const handleInvite = async (e: React.FormEvent) => {
            e.preventDefault();
            if(!inviteEmail) return;
            // Note: Inviting users requires the "Invite user" email template to be enabled in Supabase Auth settings.
            // FIX: `inviteUserByEmail` is an admin function and should be called on `supabase.auth.admin`.
            const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
                data: { account_id: profile?.account_id }
            });

            if (error) {
                setFeedback(`حدث خطأ: ${error.message}`);
            } else {
                setFeedback(`تم إرسال دعوة إلى ${inviteEmail} بنجاح.`);
                setInviteEmail('');
            }
        };

        return (
             <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-black">المستخدمون</h2>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <h3 className="font-semibold mb-2">دعوة مستخدم جديد</h3>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                        <input 
                            type="email"
                            placeholder="أدخل البريد الإلكتروني"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                        <button type="submit" className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                           <Send size={16} className="me-2"/> إرسال دعوة
                        </button>
                    </form>
                    {feedback && <p className="mt-2 text-sm text-gray-600">{feedback}</p>}
                </div>
                <div className="bg-white rounded-lg shadow-md divide-y">
                     {users.map(user => (
                        <div key={user.id} className="flex items-center p-3">
                           <Users size={20} className="me-3 text-gray-500"/>
                           <span className="text-black">{user.email}</span>
                        </div>
                    ))}
                </div>
             </div>
        )
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-black mb-6">الإعدادات</h1>
            <div className="flex border-b mb-6 overflow-x-auto">
                {Object.keys(entityConfig).map(key => (
                    <button key={key} onClick={() => setActiveTab(key as EntityKey)} className={`px-4 py-2 text-lg whitespace-nowrap ${activeTab === key ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>
                        {entityConfig[key as EntityKey].title}
                    </button>
                ))}
            </div>
            
            {activeTab === 'users' ? <UserManager /> : <CrudManager entityKey={activeTab} />}
        </div>
    );
};

export default SettingsPage;