import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../context/AppContext';
import { Download } from 'lucide-react';

const ReportsPage: React.FC = () => {
    const { operations, technicians, warehouses, operationTypes, jointTypes, materials, inventory } = useAppContext();
    
    // State for operations report filters
    const [opFilters, setOpFilters] = useState({
        warehouseId: '',
        technicianId: '',
        startDate: '',
        endDate: '',
    });

    // State for stock report filters
    const [stockFilters, setStockFilters] = useState({
        jointTypeId: '',
        warehouseId: '',
    });

    const findNameById = (arr: { id: string, name: string }[], id: string | undefined) => id ? arr.find(item => item.id === id)?.name || 'غير معروف' : '-';

    const handleOpFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setOpFilters({ ...opFilters, [e.target.name]: e.target.value });
    };

    const handleStockFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStockFilters({ ...stockFilters, [e.target.name]: e.target.value });
    };

    const filteredOperations = useMemo(() => {
        return operations.filter(op => {
            const opDate = new Date(op.date);
            const startDate = opFilters.startDate ? new Date(opFilters.startDate) : null;
            const endDate = opFilters.endDate ? new Date(opFilters.endDate) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            return (
                (!opFilters.warehouseId || op.warehouseId === opFilters.warehouseId) &&
                (!opFilters.technicianId || op.technicianId === opFilters.technicianId) &&
                (!startDate || opDate >= startDate) &&
                (!endDate || opDate <= endDate)
            );
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [operations, opFilters]);

    const filteredStock = useMemo(() => {
        let filteredMaterials = materials;
        if (stockFilters.jointTypeId) {
            filteredMaterials = materials.filter(m => m.jointTypeId === stockFilters.jointTypeId);
        }
        
        return filteredMaterials.map(material => {
            let quantity = 0;
            if (stockFilters.warehouseId) {
                quantity = inventory.find(i => i.materialId === material.id && i.warehouseId === stockFilters.warehouseId)?.quantity || 0;
            } else {
                quantity = inventory.filter(i => i.materialId === material.id).reduce((sum, i) => sum + i.quantity, 0);
            }
            return {
                materialName: material.name,
                jointType: findNameById(jointTypes, material.jointTypeId),
                warehouse: stockFilters.warehouseId ? findNameById(warehouses, stockFilters.warehouseId) : 'جميع المستودعات',
                quantity,
                minStockLevel: material.minStockLevel
            };
        });
    }, [materials, inventory, stockFilters, jointTypes, warehouses]);

    const exportOperations = () => {
        const data = filteredOperations.map(op => {
            const materialsUsedStr = op.materialsUsed.length > 0 
                ? op.materialsUsed.map(used => `${findNameById(materials, used.materialId)} (${used.quantity})`).join(', ')
                : '-';
            
            return {
                "اسم المريض": op.patientName,
                "نوع العملية": findNameById(operationTypes, op.operationTypeId),
                "الطبيب": op.doctorName || '-',
                "الفني": findNameById(technicians, op.technicianId),
                "المستودع": findNameById(warehouses, op.warehouseId),
                "المواد المستخدمة": materialsUsedStr,
                "التاريخ": new Date(op.date).toLocaleDateString('ar-SY'),
                "السعر (ل.س)": op.priceSYP || 0,
                "السعر (دولار)": op.priceUSD || 0,
                "الملاحظات": op.notes || '-'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: key === 'المواد المستخدمة' ? 40 : (key.length > 15 ? key.length : 15) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "العمليات");
        XLSX.writeFile(wb, "تقرير_العمليات.xlsx");
    };

    const exportStock = () => {
         const data = filteredStock.map(s => ({
            "المادة": s.materialName,
            "نوع المفصل": s.jointType,
            "المستودع": s.warehouse,
            "الكمية": s.quantity,
            "الحد الأدنى": s.minStockLevel
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: key.length > 20 ? key.length : 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المخزون");
        XLSX.writeFile(wb, "تقرير_المخزون.xlsx");
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-black mb-6">التقارير</h1>
            <div className="space-y-8">
                {/* Operations Report Section */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-black mb-4">تقرير العمليات</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <select name="warehouseId" value={opFilters.warehouseId} onChange={handleOpFilterChange} className="w-full p-2 border rounded">
                            <option value="">كل المستودعات</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <select name="technicianId" value={opFilters.technicianId} onChange={handleOpFilterChange} className="w-full p-2 border rounded">
                            <option value="">كل الفنيين</option>
                            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <input type="date" name="startDate" value={opFilters.startDate} onChange={handleOpFilterChange} className="w-full p-2 border rounded" />
                        <input type="date" name="endDate" value={opFilters.endDate} onChange={handleOpFilterChange} className="w-full p-2 border rounded" />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={exportOperations} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                           <Download size={20} className="me-2" /> تصدير Excel
                        </button>
                    </div>
                </div>

                {/* Stock Report Section */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-black mb-4">تقرير المخزون</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <select name="jointTypeId" value={stockFilters.jointTypeId} onChange={handleStockFilterChange} className="w-full p-2 border rounded">
                            <option value="">كل أنواع المفاصل</option>
                            {jointTypes.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                        </select>
                        <select name="warehouseId" value={stockFilters.warehouseId} onChange={handleStockFilterChange} className="w-full p-2 border rounded">
                            <option value="">كل المستودعات</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                     <div className="flex gap-4">
                        <button onClick={exportStock} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                           <Download size={20} className="me-2" /> تصدير Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;