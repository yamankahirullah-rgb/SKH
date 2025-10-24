import React from 'react';
import { Operation } from '../types';
import { useAppContext } from '../context/AppContext';
import { Calendar, User, Stethoscope, Wrench, Warehouse as WarehouseIcon, Package, DollarSign, StickyNote, Edit, Trash2, Scissors, Puzzle } from 'lucide-react';

interface OperationCardProps {
  operation: Operation;
  onEdit: (operation: Operation) => void;
  onDelete: (operationId: string) => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null;}> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-center text-sm">
            <div className="text-red-600 me-2 flex-shrink-0">{icon}</div>
            <span className="font-semibold text-black me-1 min-w-[70px]">{label}:</span>
            <span className="text-gray-700 break-all">{value}</span>
        </div>
    );
};


const OperationCard: React.FC<OperationCardProps> = ({ operation, onEdit, onDelete }) => {
  const { operationTypes, jointTypes, technicians, warehouses, materials } = useAppContext();
  
  const findNameById = (arr: {id: string, name: string}[], id: string | undefined) => id ? arr.find(item => item.id === id)?.name || 'غير معروف' : undefined;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
      <div>
        <div className="flex justify-between items-start mb-3 pb-3 border-b">
          <div>
            <h3 className="text-xl font-bold text-black flex items-center">
              <User size={20} className="me-2 text-red-600" />
              {operation.patientName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Calendar size={14} className="me-1" />
              {new Date(operation.date).toLocaleDateString('ar-SY')}
            </p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button onClick={() => onEdit(operation)} className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors">
              <Edit size={18} />
            </button>
            <button onClick={() => onDelete(operation.id)} className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
            <InfoRow icon={<Scissors size={16} />} label="العملية" value={findNameById(operationTypes, operation.operationTypeId)} />
            <InfoRow icon={<Puzzle size={16} />} label="نوع المفصل" value={findNameById(jointTypes, operation.jointTypeId)} />
            <InfoRow icon={<Stethoscope size={16} />} label="الطبيب" value={operation.doctorName} />
            <InfoRow icon={<Wrench size={16} />} label="الفني" value={findNameById(technicians, operation.technicianId)} />
            <InfoRow icon={<Wrench size={16} />} label="مساعد فني" value={findNameById(technicians, operation.assistantTechnicianId)} />
            <InfoRow icon={<WarehouseIcon size={16} />} label="المستودع" value={findNameById(warehouses, operation.warehouseId)} />
            
            {operation.materialsUsed.length > 0 && (
                <div className="text-sm">
                    <div className="flex items-center font-semibold text-black mb-1">
                       <Package size={16} className="text-red-600 me-2" />
                       <span>المواد المستخدمة:</span>
                    </div>
                    <ul className="list-disc list-inside me-4 space-y-1 text-gray-700">
                        {operation.materialsUsed.map(used => (
                            <li key={used.materialId}>
                                {findNameById(materials, used.materialId)} (الكمية: {used.quantity})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {(operation.priceSYP || operation.priceUSD) && (
                 <div className="text-sm">
                    <div className="flex items-center font-semibold text-black mb-1">
                       <DollarSign size={16} className="text-red-600 me-2" />
                       <span>التكلفة:</span>
                    </div>
                    <div className="me-4 text-gray-700 space-y-1">
                      {operation.priceSYP && <p>{operation.priceSYP.toLocaleString('ar-SY')} ل.س</p>}
                      {operation.priceUSD && <p>${operation.priceUSD.toLocaleString('en-US')}</p>}
                    </div>
                </div>
            )}

            {operation.notes && (
                 <div className="text-sm">
                     <div className="flex items-center font-semibold text-black mb-1">
                       <StickyNote size={16} className="text-red-600 me-2" />
                       <span>ملاحظات:</span>
                    </div>
                    <p className="me-4 text-gray-700 bg-gray-50 p-2 rounded border">{operation.notes}</p>
                 </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default OperationCard;
