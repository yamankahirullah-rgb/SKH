import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabase/client';
import { AuditLogEntry } from '../types';

const AuditLogPage: React.FC = () => {
    const { profile } = useAppContext();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!profile) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_log')
                .select('*')
                .eq('account_id', profile.account_id)
                .order('created_at', { ascending: false })
                .limit(100);
            
            if (data) {
                setLogs(data);
            }
            setLoading(false);
        };
        fetchLogs();
    }, [profile]);
    
    const formatAction = (action: string) => {
        switch(action) {
            case 'CREATE': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">إنشاء</span>;
            case 'UPDATE': return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">تحديث</span>;
            case 'DELETE': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">حذف</span>;
            default: return action;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-black mb-6">سجل التدقيق</h1>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                    <thead className="bg-gray-50">
                        <tr className="border-b">
                            <th className="p-3 text-black font-semibold">التاريخ والوقت</th>
                            <th className="p-3 text-black font-semibold">المستخدم</th>
                            <th className="p-3 text-black font-semibold">الإجراء</th>
                            <th className="p-3 text-black font-semibold">الجدول</th>
                             <th className="p-3 text-black font-semibold">معرف السجل</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                             <tr><td colSpan={5} className="text-center p-4">جاري تحميل السجلات...</td></tr>
                        ) : logs.length > 0 ? (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-black">{new Date(log.created_at).toLocaleString('ar-SY')}</td>
                                    <td className="p-3 text-black">{log.user_email}</td>
                                    <td className="p-3 text-black">{formatAction(log.action_type)}</td>
                                    <td className="p-3 text-black">{log.table_name}</td>
                                    <td className="p-3 text-black text-xs">{log.record_id}</td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={5} className="text-center p-4 text-gray-500">لا توجد سجلات تدقيق.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogPage;
