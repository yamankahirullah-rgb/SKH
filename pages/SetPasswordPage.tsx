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
    // This effect listens for the PASSWORD_RECOVERY event which is triggered
    // when a user lands on the site from an invite or password reset link.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage('You can now set your new password.');
        setShowForm(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Your password has been updated successfully. You will be redirected to the login page.');
      setTimeout(() => navigate('/'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-black">تعيين كلمة المرور</h2>
        
        {!showForm && <p className="text-center text-gray-600">If you're here from an invite or password reset link, the form will appear shortly...</p>}
        
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
                {loading ? '...جاري الحفظ' : 'حفظ كلمة المرور'}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default SetPasswordPage;
