import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const AccountSetupPage: React.FC = () => {
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create a new account record.
            const { data: accountData, error: accountError } = await supabase
                .from('accounts')
                .insert({ name: accountName })
                .select()
                .single();
            
            if (accountError) throw accountError;
            if (!accountData) throw new Error("Could not create account.");

            // 2. Get the current user.
            // Revert to Supabase v2 API
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found.");

            // 3. Update the user's profile with the new account_id AND mark password as set.
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                    account_id: accountData.id,
                    password_set_at: new Date().toISOString() // Mark password as set for account creator
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Reload the page to re-trigger AppProvider data fetching with the new account_id.
            navigate(0);

        } catch (error: any) {
            setError(error.message || "An unexpected error occurred.");
            console.error("Account setup failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-black">إعداد الحساب</h2>
                <p className="text-center text-gray-600">مرحبًا بك! يرجى إنشاء حساب لشركتك أو مؤسستك للبدء.</p>
                <form onSubmit={handleSetup} className="space-y-6">
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                            اسم الشركة أو المؤسسة
                        </label>
                        <input
                            id="accountName"
                            name="accountName"
                            type="text"
                            required
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
                        >
                            {loading ? '...جاري الإنشاء' : 'إنشاء الحساب والمتابعة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountSetupPage;