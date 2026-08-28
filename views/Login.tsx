
import React, { useState } from 'react';
import { Lock, Send } from 'lucide-react';
import { useI18n } from '../i18n';
import * as api from '../services/api';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await api.login(password);
    setIsSubmitting(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || t('auth.error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Send size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t('app.title')}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.passwordLabel')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-xl transition-all"
          >
            {isSubmitting ? t('auth.submitting') : t('auth.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
