import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { User } from '@supabase/supabase-js';

interface AccountSetupPageProps {
  user: User;
  onComplete: () => void;
}

const AccountSetupPage: React.FC<AccountSetupPageProps> = ({ user, onComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
        setError('يرجى إدخال اسم الشركة.');
        return;
    }
    setLoading(true);
    setError(null);

    try {
        const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .insert({ name: companyName, owner_id: user.id })
            .select()
            .single();

        if (accountError) throw accountError;
        
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: user.id, account_id: accountData.id, email: user.email });

        if (profileError) throw profileError;

        onComplete();
    } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع.');
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-black">مرحباً بك!</h1>
        <p className="text-gray-600">
          أنت على وشك إعداد حساب جديد لشركتك. يرجى إدخال اسم شركتك للبدء.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 text-right">
              اسم الشركة
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
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
              {loading ? '...جاري الإنشاء' : 'إنشاء حساب وبدء الاستخدام'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSetupPage;
