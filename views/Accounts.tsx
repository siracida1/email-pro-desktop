
import React, { useState } from 'react';
import { EmailAccount } from '../types';
import { useI18n } from '../i18n';
import { Plus, Trash2, Edit3, ShieldCheck, Mail, Server, Search } from 'lucide-react';
import * as api from '../services/api';

interface AccountsProps {
  accounts: EmailAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>;
}

const Accounts: React.FC<AccountsProps> = ({ accounts, setAccounts }) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [smtpTest, setSmtpTest] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [formData, setFormData] = useState<Partial<EmailAccount>>({
    name: '',
    email: '',
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    password: '',
    isDefault: false
  });

  const handleOpenModal = (account?: EmailAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData(account);
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        email: '',
        host: 'smtp.gmail.com',
        port: 587,
        user: '',
        password: '',
        isDefault: accounts.length === 0
      });
    }
    setSmtpTest({ status: 'idle', message: '' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return;

    if (editingAccount) {
      setAccounts(accounts.map(a => a.id === editingAccount.id ? { ...a, ...formData } as EmailAccount : a));
    } else {
      const newAccount: EmailAccount = {
        ...formData,
        id: crypto.randomUUID(),
        isDefault: accounts.length === 0 || formData.isDefault
      } as EmailAccount;

      if (newAccount.isDefault) {
        setAccounts(accounts.map(a => ({ ...a, isDefault: false })).concat(newAccount));
      } else {
        setAccounts([...accounts, newAccount]);
      }
    }
    setIsModalOpen(false);
  };

  const handleTestSmtp = async () => {
    if (!formData.name || !formData.email || !formData.host || !formData.port || !formData.user || !formData.password) {
      setSmtpTest({ status: 'error', message: t('accounts.smtpValidationError') });
      return;
    }

    setSmtpTest({ status: 'testing', message: t('accounts.smtpTestingMsg') });

    const config = {
      ...formData,
      id: editingAccount?.id || 'smtp-test',
      isDefault: Boolean(formData.isDefault)
    } as EmailAccount;

    const result = await api.testSmtp(config);
    setSmtpTest(result.success
      ? { status: 'success', message: t('accounts.smtpSuccess') }
      : { status: 'error', message: result.error || t('accounts.smtpError') }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('accounts.deleteConfirm'))) {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAccounts = accounts.filter(account => {
    if (!normalizedSearch) return true;
    return [
      account.name,
      account.email,
      account.host,
      account.user,
      String(account.port)
    ].some(value => value?.toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('accounts.title')}</h2>
          <p className="text-slate-500 mt-1">{t('accounts.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('accounts.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            {t('accounts.addButton')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.length === 0 && (
          <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Mail className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900">{t('accounts.empty')}</h3>
            <p className="text-slate-500 mt-2">{t('accounts.emptyHint')}</p>
          </div>
        )}

        {accounts.length > 0 && filteredAccounts.length === 0 && (
          <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Search className="mx-auto text-slate-300 mb-4" size={40} />
            <h3 className="text-lg font-semibold text-slate-900">{t('accounts.noResults')}</h3>
            <p className="text-slate-500 mt-2">{t('accounts.noResultsHint')}</p>
          </div>
        )}

        {filteredAccounts.map((acc) => (
          <div key={acc.id} className="bg-zinc-50 p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Server size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{acc.name}</h3>
                  <p className="text-sm text-slate-500">{acc.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(acc)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('accounts.serverHost')}</p>
                <p className="text-sm font-medium truncate">{acc.host}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('accounts.port')}</p>
                <p className="text-sm font-medium">{acc.port}</p>
              </div>
            </div>

            {acc.isDefault && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
                <ShieldCheck size={14} />
                <span className="text-xs font-semibold">{t('accounts.defaultBadge')}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6">{editingAccount ? t('accounts.editTitle') : t('accounts.addTitle')}</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700">{t('accounts.fieldName')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('accounts.fieldNamePlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700">{t('accounts.fieldEmail')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('accounts.fieldEmailPlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700">{t('accounts.fieldHost')}</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                    placeholder={t('accounts.fieldHostPlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700">{t('accounts.fieldPort')}</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700">{t('accounts.fieldUser')}</label>
                    <input
                      type="text"
                      value={formData.user}
                      onChange={e => setFormData({ ...formData, user: e.target.value })}
                      placeholder={t('accounts.fieldUserPlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700">{t('accounts.fieldPassword')}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{t('accounts.fieldPasswordHint')}</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-600">{t('accounts.setDefault')}</span>
                </label>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{t('accounts.smtpTest')}</p>
                      <p className={`text-xs mt-1 ${smtpTest.status === 'success' ? 'text-green-600' : smtpTest.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                        {smtpTest.message || t('accounts.smtpTestHint')}
                      </p>
                    </div>
                    <button
                      onClick={handleTestSmtp}
                      disabled={smtpTest.status === 'testing'}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-50 border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-wait transition-all"
                    >
                      {smtpTest.status === 'testing' ? t('accounts.smtpTesting') : t('accounts.smtpTestButton')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {editingAccount ? (
                <button
                  onClick={() => {
                    handleDelete(editingAccount.id);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  {t('accounts.deleteButton')}
                </button>
              ) : <div></div>}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('accounts.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl transition-all shadow-md"
                >
                  {t('accounts.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
