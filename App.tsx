
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Mail,
  FileText,
  Send,
  Settings,
  Users,
  Plus,
  LogOut,
  Search,
  AlertTriangle,
  X,
  Trash2,
  Download,
  RotateCcw,
  Globe
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import Accounts from './views/Accounts';
import Templates from './views/Templates';
import RecipientLists from './views/RecipientLists';
import CampaignWizard from './views/CampaignWizard';
import SettingsView from './views/Settings';
import { I18nProvider, useI18n } from './i18n';
import { View, EmailAccount, EmailTemplate, Campaign, Recipient, RecipientList } from './types';

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [recipientLists, setRecipientLists] = useState<RecipientList[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [retryDraft, setRetryDraft] = useState<{
    campaignName: string;
    accountId: string;
    templateId: string;
    recipients: Recipient[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedAccounts = await window.electronAPI.getData('accounts');
        const savedTemplates = await window.electronAPI.getData('templates');
        const savedRecipientLists = await window.electronAPI.getData('recipientLists');
        const savedCampaigns = await window.electronAPI.getData('campaigns');

        if (Array.isArray(savedAccounts)) setAccounts(savedAccounts as EmailAccount[]);
        if (Array.isArray(savedTemplates)) setTemplates(savedTemplates as EmailTemplate[]);
        if (Array.isArray(savedRecipientLists)) setRecipientLists(savedRecipientLists as RecipientList[]);
        if (Array.isArray(savedCampaigns)) setCampaigns(savedCampaigns as Campaign[]);

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoaded(true);
      }
    };
    loadData();

    const handleCloseRequest = () => {
      setShowExitConfirm(true);
    };
    return window.electronAPI.onCloseRequest(handleCloseRequest);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.electronAPI.saveData('accounts', accounts);
    }
  }, [accounts, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      window.electronAPI.saveData('templates', templates);
    }
  }, [templates, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      window.electronAPI.saveData('recipientLists', recipientLists);
    }
  }, [recipientLists, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      window.electronAPI.saveData('campaigns', campaigns);
    }
  }, [campaigns, isLoaded]);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: 'accounts', label: t('nav.accounts'), icon: <Settings size={20} /> },
    { id: 'templates', label: t('nav.templates'), icon: <FileText size={20} /> },
    { id: 'lists', label: t('nav.lists'), icon: <Users size={20} /> },
    { id: 'campaigns', label: t('nav.campaigns'), icon: <Mail size={20} /> },
    { id: 'settings', label: t('nav.settings'), icon: <Globe size={20} /> },
  ];

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    window.electronAPI.confirmQuit();
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm(t('campaigns.deleteConfirm'))) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
    }
  };

  const escapeCsvValue = (value: unknown) => {
    const text = value == null ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const exportCampaignResults = (campaign: Campaign) => {
    const rows = campaign.logs || [];
    const headers = ['recipient', 'status', 'subject', 'attempt', 'messageId', 'error', 'sentAt'];
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const value = header === 'sentAt' ? new Date(row.sentAt).toISOString() : row[header as keyof typeof row];
        return escapeCsvValue(value);
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${campaign.name.replace(/[^a-z0-9-_]+/gi, '_')}_resultados.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const retryFailedCampaign = (campaign: Campaign) => {
    const failedRecipients = (campaign.logs || [])
      .filter(log => log.status === 'failed')
      .map(log => log.recipientData);

    if (failedRecipients.length === 0) return;

    setRetryDraft({
      campaignName: t('campaigns.retryPrefix', { name: campaign.name }),
      accountId: campaign.accountId,
      templateId: campaign.templateId,
      recipients: failedRecipients
    });
    setActiveView('new-campaign');
  };

  const normalizedCampaignSearch = campaignSearch.trim().toLowerCase();
  const filteredCampaigns = campaigns.filter(c => {
    if (!normalizedCampaignSearch) return true;
    const account = accounts.find(a => a.id === c.accountId);
    const template = templates.find(t => t.id === c.templateId);
    return [
      c.name,
      c.status,
      account?.name,
      account?.email,
      template?.name,
      template?.subject
    ].some(value => value?.toLowerCase().includes(normalizedCampaignSearch));
  });

  const statusLabel = (status: string) => {
    if (status === 'completed') return t('campaigns.statusCompleted');
    if (status === 'sending') return t('campaigns.statusSending');
    return t('campaigns.statusFailed');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Send size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t('app.title')}</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              disabled={isProcessing && activeView === 'new-campaign'}
              onClick={() => setActiveView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === item.id
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            disabled={isProcessing}
            onClick={() => setActiveView('new-campaign')}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            {t('app.newCampaign')}
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-3 px-6 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all font-semibold w-full justify-center"
          >
            <LogOut size={20} />
            {t('app.exit')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeView === 'dashboard' && (
              <Dashboard
                campaigns={campaigns}
                templatesCount={templates.length}
                accountsCount={accounts.length}
              />
            )}
            {activeView === 'accounts' && (
              <Accounts
                accounts={accounts}
                setAccounts={setAccounts}
              />
            )}
            {activeView === 'templates' && (
              <Templates
                templates={templates}
                setTemplates={setTemplates}
              />
            )}
            {activeView === 'lists' && (
              <RecipientLists
                lists={recipientLists}
                setLists={setRecipientLists}
              />
            )}
            {activeView === 'settings' && (
              <SettingsView />
            )}
            {activeView === 'campaigns' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{t('campaigns.title')}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t('campaigns.subtitle')}</p>
                  </div>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={campaignSearch}
                      onChange={e => setCampaignSearch(e.target.value)}
                      placeholder={t('campaigns.searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
                {campaigns.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{t('campaigns.empty')}</h3>
                    <p className="text-slate-500 mb-6">{t('campaigns.emptyHint')}</p>
                    <button
                      onClick={() => setActiveView('new-campaign')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all"
                    >
                      {t('campaigns.createFirst')}
                    </button>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <Search className="mx-auto text-slate-300 mb-4" size={40} />
                    <h3 className="text-lg font-semibold mb-1">{t('campaigns.noResults')}</h3>
                    <p className="text-slate-500">{t('campaigns.noResultsHint')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCampaigns.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.status === 'completed' ? 'bg-green-100 text-green-700' :
                            c.status === 'sending' ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-slate-100 text-slate-700'
                            }`}>
                            {statusLabel(c.status)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCampaign(c.id);
                              }}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title={t('campaigns.deleteTitle')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-2 truncate">{c.name}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{t('campaigns.recipients')}</span>
                            <span className="font-semibold">{c.totalRecipients}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all duration-500"
                              style={{ width: `${(c.sentCount / c.totalRecipients) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">{t('campaigns.sent', { count: c.sentCount })}</span>
                            <span className="text-red-500">{t('campaigns.failed', { count: c.failedCount })}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => exportCampaignResults(c)}
                              disabled={!c.logs?.length}
                              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <Download size={14} />
                              {t('campaigns.export')}
                            </button>
                            {c.failedCount > 0 && (
                              <button
                                onClick={() => retryFailedCampaign(c)}
                                disabled={!c.logs?.some(log => log.status === 'failed')}
                                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <RotateCcw size={14} />
                                {t('campaigns.retry')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeView === 'new-campaign' && (
              <CampaignWizard
                accounts={accounts}
                templates={templates}
                recipientLists={recipientLists}
                setRecipientLists={setRecipientLists}
                initialCampaignName={retryDraft?.campaignName}
                initialAccountId={retryDraft?.accountId}
                initialTemplateId={retryDraft?.templateId}
                initialRecipients={retryDraft?.recipients}
                onCancel={() => {
                  setRetryDraft(null);
                  setActiveView('dashboard');
                }}
                onComplete={(campaign) => {
                  setCampaigns([campaign, ...campaigns]);
                  setRetryDraft(null);
                  setIsProcessing(false);
                  setActiveView('campaigns');
                }}
                onProcessingChange={setIsProcessing}
              />
            )}
          </div>
        </div>
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-2xl ${isProcessing ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <button onClick={() => setShowExitConfirm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {isProcessing ? t('app.confirmExit.title.processing') : t('app.confirmExit.title.normal')}
            </h3>

            <p className="text-slate-500 mb-8 leading-relaxed">
              {isProcessing
                ? t('app.confirmExit.body.processing')
                : t('app.confirmExit.body.normal')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                {t('app.confirmExit.cancel')}
              </button>
              <button
                onClick={confirmExit}
                className={`flex-1 px-6 py-3 font-bold text-white rounded-xl transition-all shadow-lg active:scale-95 ${isProcessing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {isProcessing ? t('app.confirmExit.confirm.processing') : t('app.confirmExit.confirm.normal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;
