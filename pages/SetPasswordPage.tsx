import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fix: Use v1-compatible onAuthStateChange and ensure subscription is cleaned up.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        setMessage('يمكنك الآن تعيين كلمة المرور الخاصة بك.');
        setShowForm(true);
      }
    });

    // For invited users who are already logged in when they click the link
    // Fix: Use synchronous `session()` method for v1 compatibility instead of `getSession()`.
    const session = supabase.auth.session();
    if (session) {
        setMessage('مرحبًا بك! يرجى تعيين كلمة مرور لحسابك للمتابعة.');
        setShowForm(true);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
        return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    // Fix: Use `update` for v1 compatibility instead of `updateUser`.
    const { data: { user }, error: updateUserError } = await supabase.auth.update({ password });

    if (updateUserError) {
      setError(updateUserError.message);
      setLoading(false);
      return;
    }
    
    // After successfully setting the password, update the profile.
    if (user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ password_set_at: new Date().toISOString() })
            .eq('id', user.id);
        
        if (profileError) {
            setError("تم تحديث كلمة المرور، ولكن فشل تحديث الملف الشخصي. يرجى محاولة تسجيل الدخول.");
        } else {
            setMessage('تم تحديث كلمة المرور بنجاح. سيتم إعادة توجيهك الآن.');
            setTimeout(() => navigate(0), 2000); // Reload the page
        }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-black">تعيين كلمة المرور</h2>
        
        {!showForm && <p className="text-center text-gray-600">جاري التحقق من بيانات الدعوة...</p>}
        
        {showForm && (
            <form onSubmit={handleSetPassword} className="space-y-6">
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                كلمة المرور الجديدة
                </label>
                <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                />
            </div>
            {error && <p className="text-sm text-center text-red-500">{error}</p>}
            {message && <p className="text-sm text-center text-green-600">{message}</p>}
            <div>
                <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
                >
                {loading ? '...جاري الحفظ' : 'حفظ كلمة المرور والمتابعة'}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default SetPasswordPage;
