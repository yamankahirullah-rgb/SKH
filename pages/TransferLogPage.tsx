import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const TransferLogPage: React.FC = () => {
    const { stockTransfers, materials, warehouses } = useAppContext();

    const findNameById = (arr: {id: string, name: string}[], id: string) => arr.find(item => item.id === id)?.name || 'غير معروف';

    const sortedTransfers = useMemo(() =>
        [...stockTransfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [stockTransfers]
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-black mb-6">سجل التحويلات</h1>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                    <thead className="bg-gray-50">
                        <tr className="border-b">
                            <th className="p-3 text-black font-semibold">التاريخ</th>
                            <th className="p-3 text-black font-semibold">المادة</th>
                            <th className="p-3 text-black font-semibold">الكمية</th>
                            <th className="p-3 text-black font-semibold">من المستودع</th>
                            <th className="p-3 text-black font-semibold">إلى المستودع</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedTransfers.map(transfer => (
                            <tr key={transfer.id} className="hover:bg-gray-50">
                                <td className="p-3 text-black">{new Date(transfer.date).toLocaleString('ar-SY')}</td>
                                <td className="p-3 text-black font-semibold">{findNameById(materials, transfer.materialId)}</td>
                                <td className="p-3 text-black">{transfer.quantity}</td>
                                <td className="p-3 text-black">{findNameById(warehouses, transfer.fromWarehouseId)}</td>
                                <td className="p-3 text-black">{findNameById(warehouses, transfer.toWarehouseId)}</td>
                            </tr>
                        ))}
                        {sortedTransfers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center p-4 text-gray-500">لا توجد تحويلات مسجلة.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransferLogPage;