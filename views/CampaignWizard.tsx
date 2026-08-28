
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import DOMPurify from 'dompurify';
import { EmailAccount, EmailTemplate, Campaign, CampaignLog, Recipient, RecipientList } from '../types';
import { useI18n } from '../i18n';
import * as api from '../services/api';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Mail,
  Rocket,
  X,
  Database,
  Search,
  Tags,
  MapPin,
  Building2,
  Globe2
} from 'lucide-react';

interface CampaignWizardProps {
  accounts: EmailAccount[];
  templates: EmailTemplate[];
  recipientLists: RecipientList[];
  setRecipientLists: React.Dispatch<React.SetStateAction<RecipientList[]>>;
  onCancel: () => void;
  onComplete: (campaign: Campaign) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  initialCampaignName?: string;
  initialAccountId?: string;
  initialTemplateId?: string;
  initialRecipients?: Recipient[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CampaignWizard: React.FC<CampaignWizardProps> = ({
  accounts,
  templates,
  recipientLists,
  setRecipientLists,
  onCancel,
  onComplete,
  onProcessingChange,
  initialCampaignName = '',
  initialAccountId,
  initialTemplateId,
  initialRecipients = []
}) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [selectedAccount, setSelectedAccount] = useState(initialAccountId || accounts.find(a => a.isDefault)?.id || (accounts[0]?.id || ''));
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateId || templates[0]?.id || '');
  const [accountSearch, setAccountSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [recipientListSearch, setRecipientListSearch] = useState('');
  const [listName, setListName] = useState('');
  const [listClassification, setListClassification] = useState('');
  const [listZone, setListZone] = useState('');
  const [listCity, setListCity] = useState('');
  const [listCountry, setListCountry] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [csvSummary, setCsvSummary] = useState({ valid: initialRecipients.length, invalid: 0, duplicates: 0 });
  const [sendDelayMs, setSendDelayMs] = useState(1000);
  const [maxRetries, setMaxRetries] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [stats, setStats] = useState({ sent: 0, failed: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, title: t('campaignWizard.step1'), description: t('campaignWizard.step1Desc') },
    { id: 2, title: t('campaignWizard.step2'), description: t('campaignWizard.step2Desc') },
    { id: 3, title: t('campaignWizard.step3'), description: t('campaignWizard.step3Desc') },
    { id: 4, title: t('campaignWizard.step4'), description: t('campaignWizard.step4Desc') }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim().replace(/^\uFEFF/, '').toLowerCase(),
        transform: value => value.trim()
      });

      if (result.errors.length > 0) {
        alert(t('campaignWizard.csvParseError'));
        return;
      }

      let invalid = 0;
      let duplicates = 0;
      const seenEmails = new Set<string>();
      const parsedRecipients = result.data.filter(row => {
        const email = row.email?.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          invalid++;
          return false;
        }
        const normalizedEmail = email.toLowerCase();
        if (seenEmails.has(normalizedEmail)) {
          duplicates++;
          return false;
        }
        seenEmails.add(normalizedEmail);
        row.email = email;
        return true;
      }) as Recipient[];

      if (parsedRecipients.length === 0) {
        alert(t('campaignWizard.csvEmptyError'));
        return;
      }

      setRecipients(parsedRecipients);
      setCsvSummary({ valid: parsedRecipients.length, invalid, duplicates });
      setUploadedFileName(file.name);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const startCampaign = async () => {
    setIsSending(true);
    onProcessingChange?.(true);
    setCurrentStep(4);

    const campaignId = crypto.randomUUID();
    const account = accounts.find(a => a.id === selectedAccount);
    const template = templates.find(t => t.id === selectedTemplate);

    if (!account || !template) {
      alert(t('campaignWizard.errorMissingAccount'));
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const logs: CampaignLog[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      const { subject: personalizedSubject, html: personalizedHtml } = personalizeContent(template.subject, template.htmlContent, recipient);

      let finalResult: { success: boolean; messageId?: string; error?: string } = { success: false, error: 'No se pudo enviar.' };
      let attempt = 0;

      for (attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          finalResult = await api.sendEmail(
            account,
            recipient.email,
            personalizedSubject,
            personalizedHtml
          );

          if (finalResult.success) break;
        } catch (err) {
          finalResult = { success: false, error: err instanceof Error ? err.message : String(err) };
        }

        if (attempt <= maxRetries) {
          await sleep(Math.min(sendDelayMs, 5000));
        }
      }

      if (finalResult.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Error enviando a ${recipient.email}:`, finalResult.error);
      }

      logs.push({
        id: crypto.randomUUID(),
        recipient: recipient.email,
        recipientData: recipient,
        subject: personalizedSubject,
        status: finalResult.success ? 'sent' : 'failed',
        messageId: finalResult.messageId,
        error: finalResult.error,
        sentAt: Date.now(),
        attempt
      });

      setStats({
        sent: successCount,
        failed: failCount
      });

      setSendProgress(Math.round(((i + 1) / recipients.length) * 100));

      if (sendDelayMs > 0 && i < recipients.length - 1) {
        await sleep(sendDelayMs);
      }
    }

    const finalCampaign: Campaign = {
      id: campaignId,
      name: campaignName || `Campaña ${new Date().toLocaleDateString()}`,
      accountId: selectedAccount,
      templateId: selectedTemplate,
      status: failCount > 0 ? 'failed' : 'completed',
      totalRecipients: recipients.length,
      sentCount: successCount,
      failedCount: failCount,
      createdAt: Date.now(),
      completedAt: Date.now(),
      logs,
      sendDelayMs,
      maxRetries
    };

    setTimeout(() => {
      onComplete(finalCampaign);
    }, 1500);
  };

  const isStep1Valid = campaignName && selectedAccount && selectedTemplate;
  const isStep2Valid = recipients.length > 0;
  const normalizedAccountSearch = accountSearch.trim().toLowerCase();
  const normalizedTemplateSearch = templateSearch.trim().toLowerCase();
  const filteredAccounts = accounts.filter(account => {
    if (!normalizedAccountSearch) return true;
    return [
      account.name,
      account.email,
      account.host,
      account.user
    ].some(value => value?.toLowerCase().includes(normalizedAccountSearch));
  });
  const filteredTemplates = templates.filter(template => {
    if (!normalizedTemplateSearch) return true;
    return [
      template.name,
      template.subject,
      template.htmlContent
    ].some(value => value?.toLowerCase().includes(normalizedTemplateSearch));
  });
  const normalizedRecipientListSearch = recipientListSearch.trim().toLowerCase();
  const filteredRecipientLists = recipientLists.filter(list => {
    if (!normalizedRecipientListSearch) return true;
    return [
      list.name,
      list.classification,
      list.zone,
      list.city,
      list.country,
      list.sourceFileName,
      String(list.recipients.length),
      ...list.recipients.slice(0, 15).flatMap(recipient => [recipient.email, recipient.name, recipient.company])
    ].some(value => value?.toLowerCase().includes(normalizedRecipientListSearch));
  });

  const saveCurrentRecipientsAsList = () => {
    const name = listName.trim();
    if (!name || recipients.length === 0) return;

    const now = Date.now();
    setRecipientLists(prev => [
      {
        id: crypto.randomUUID(),
        name,
        classification: listClassification.trim() || undefined,
        zone: listZone.trim() || undefined,
        city: listCity.trim() || undefined,
        country: listCountry.trim() || undefined,
        sourceFileName: uploadedFileName || undefined,
        recipients,
        createdAt: now,
        updatedAt: now
      },
      ...prev
    ]);
    setListName('');
    setListClassification('');
    setListZone('');
    setListCity('');
    setListCountry('');
  };

  const renderListMetadata = (list: RecipientList) => {
    const chips = [
      { label: list.classification, icon: Tags },
      { label: list.zone, icon: MapPin },
      { label: list.city, icon: Building2 },
      { label: list.country, icon: Globe2 }
    ].filter(chip => Boolean(chip.label));

    if (chips.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map(({ label, icon: Icon }) => (
          <span key={label} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            <Icon size={12} />
            {label}
          </span>
        ))}
      </div>
    );
  };

  const personalizeContent = (subject: string, html: string, recipient: Recipient) => {
    let personalizedSubject = subject;
    let personalizedHtml = html;

    Object.keys(recipient).forEach(key => {
      const regex = new RegExp(`{{${escapeRegExp(key)}}}`, 'g');
      personalizedSubject = personalizedSubject.replace(regex, recipient[key]);
      personalizedHtml = personalizedHtml.replace(regex, recipient[key]);
    });

    personalizedHtml = personalizedHtml.replace(/{{name}}/g, recipient.name || recipient.nombre || 'Cliente');
    return { subject: personalizedSubject, html: personalizedHtml };
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const previewRecipient = recipients[0];
  const previewContent = selectedTemplateData && previewRecipient
    ? personalizeContent(selectedTemplateData.subject, selectedTemplateData.htmlContent, previewRecipient)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('campaignWizard.title')}</h2>
        <button onClick={onCancel} disabled={isSending} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <X size={24} />
        </button>
      </div>

      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep > step.id ? 'bg-green-500 text-white' :
                  currentStep === step.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                {currentStep > step.id ? <Check size={20} /> : step.id}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-bold ${currentStep === step.id ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                <p className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">{step.description}</p>
              </div>
            </div>
            {idx < steps.length - 1 && <div className="flex-1 h-px bg-slate-100 mx-4"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-100 min-h-[400px] flex flex-col">
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <label className="block text-lg font-bold text-slate-900 mb-2">{t('campaignWizard.campaignNameLabel')}</label>
              <input
                type="text"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder={t('campaignWizard.campaignNamePlaceholder')}
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">{t('campaignWizard.accountLabel')}</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={e => setAccountSearch(e.target.value)}
                    placeholder={t('campaignWizard.accountSearch')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {accounts.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-red-100 rounded-xl bg-red-50 text-red-600 text-sm">
                      {t('campaignWizard.accountEmpty')}
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                      {t('campaignWizard.accountNoResults')}
                    </div>
                  ) : filteredAccounts.map(acc => (
                    <label key={acc.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedAccount === acc.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                      }`}>
                      <input
                        type="radio"
                        name="account"
                        checked={selectedAccount === acc.id}
                        onChange={() => setSelectedAccount(acc.id)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAccount === acc.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {selectedAccount === acc.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{acc.name}</p>
                        <p className="text-xs text-slate-500">{acc.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">{t('campaignWizard.templateLabel')}</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    placeholder={t('campaignWizard.templateSearch')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {templates.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-red-100 rounded-xl bg-red-50 text-red-600 text-sm">
                      {t('campaignWizard.templateEmpty')}
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                      {t('campaignWizard.templateNoResults')}
                    </div>
                  ) : filteredTemplates.map(t => (
                    <label key={t.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedTemplate === t.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                      }`}>
                      <input
                        type="radio"
                        name="template"
                        checked={selectedTemplate === t.id}
                        onChange={() => setSelectedTemplate(t.id)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTemplate === t.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {selectedTemplate === t.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500 truncate w-40 italic">"{t.subject}"</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
            {recipientLists.length > 0 && (
              <div className="w-full max-w-2xl bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{t('campaignWizard.useSavedList')}</h3>
                    <p className="text-sm text-slate-500">{t('campaignWizard.useSavedListHint')}</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={recipientListSearch}
                      onChange={e => setRecipientListSearch(e.target.value)}
                      placeholder={t('campaignWizard.listSearch')}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                  {filteredRecipientLists.length === 0 ? (
                    <div className="sm:col-span-2 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                      {t('campaignWizard.listNoResults')}
                    </div>
                  ) : filteredRecipientLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => {
                        setRecipients(list.recipients);
                        setCsvSummary({ valid: list.recipients.length, invalid: 0, duplicates: 0 });
                        setUploadedFileName(list.sourceFileName || '');
                      }}
                      className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <p className="font-bold text-sm text-slate-900 truncate">{list.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{t('lists.recipientsCount', { count: list.recipients.length })}</p>
                      {renderListMetadata(list)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-lg border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-slate-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                <Upload className="text-slate-400 group-hover:text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('campaignWizard.uploadTitle')}</h3>
              <p className="text-slate-500 mb-6">{t('campaignWizard.uploadHint')}</p>
              <button className="bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                {t('campaignWizard.uploadButton')}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
            </div>

            {recipients.length > 0 && (
              <div className="w-full max-w-2xl bg-green-50 border border-green-100 p-6 rounded-2xl animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                <div className="bg-green-500 text-white p-2 rounded-lg">
                  <Check size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-green-800 font-bold">{t('campaignWizard.uploadSuccess')}</p>
                  <p className="text-green-600 text-sm">
                    {t('campaignWizard.uploadValid', { count: csvSummary.valid })}
                    {csvSummary.invalid > 0 ? ` · ${t('campaignWizard.uploadInvalid', { count: csvSummary.invalid })}` : ''}
                    {csvSummary.duplicates > 0 ? ` · ${t('campaignWizard.uploadDuplicates', { count: csvSummary.duplicates })}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setRecipients([])}
                  className="text-green-700 hover:text-green-900 font-medium text-sm"
                >
                  {t('campaignWizard.uploadChange')}
                </button>
                </div>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={listName}
                    onChange={e => setListName(e.target.value)}
                    placeholder={t('campaignWizard.saveListNamePlaceholder')}
                    className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-green-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={listClassification}
                    onChange={e => setListClassification(e.target.value)}
                    placeholder={t('campaignWizard.saveListClassificationPlaceholder')}
                    className="px-4 py-2.5 rounded-xl border border-green-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={listZone}
                    onChange={e => setListZone(e.target.value)}
                    placeholder={t('campaignWizard.saveListZonePlaceholder')}
                    className="px-4 py-2.5 rounded-xl border border-green-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={listCity}
                    onChange={e => setListCity(e.target.value)}
                    placeholder={t('campaignWizard.saveListCityPlaceholder')}
                    className="px-4 py-2.5 rounded-xl border border-green-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={listCountry}
                    onChange={e => setListCountry(e.target.value)}
                    placeholder={t('campaignWizard.saveListCountryPlaceholder')}
                    className="px-4 py-2.5 rounded-xl border border-green-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={saveCurrentRecipientsAsList}
                    disabled={!listName.trim()}
                    className="sm:col-span-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:bg-green-200 disabled:cursor-not-allowed transition-all"
                  >
                    {t('campaignWizard.saveListButton')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
              <AlertCircle size={24} />
              <div>
                <p className="font-bold">{t('campaignWizard.reviewAlert')}</p>
                <p className="text-sm opacity-90">{t('campaignWizard.reviewAlertText')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('campaignWizard.reviewDetails')}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">{t('campaignWizard.reviewName')}</span>
                      <span className="font-bold text-sm">{campaignName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">{t('campaignWizard.reviewTotal')}</span>
                      <span className="font-bold text-sm">{t('campaignWizard.reviewContacts', { count: recipients.length })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('campaignWizard.reviewConfig')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Database size={16} className="text-blue-500" />
                      <span className="text-sm font-semibold">{accounts.find(a => a.id === selectedAccount)?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet size={16} className="text-purple-500" />
                      <span className="text-sm font-semibold">{templates.find(t => t.id === selectedTemplate)?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('campaignWizard.reviewSendControl')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">{t('campaignWizard.reviewDelay')}</label>
                      <select
                        value={sendDelayMs}
                        onChange={e => setSendDelayMs(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>{t('campaignWizard.reviewDelayNone')}</option>
                        <option value={1000}>{t('campaignWizard.reviewDelay1s')}</option>
                        <option value={3000}>{t('campaignWizard.reviewDelay3s')}</option>
                        <option value={5000}>{t('campaignWizard.reviewDelay5s')}</option>
                        <option value={10000}>{t('campaignWizard.reviewDelay10s')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">{t('campaignWizard.reviewRetries')}</label>
                      <select
                        value={maxRetries}
                        onChange={e => setMaxRetries(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Mail size={32} />
                </div>
                <h4 className="text-lg font-bold">{t('campaignWizard.reviewReady')}</h4>
                <p className="text-slate-500 text-sm">{t('campaignWizard.reviewReadyText', { count: recipients.length })}</p>
                {previewContent && (
                  <div className="w-full text-left border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('campaignWizard.reviewPreview')}</p>
                      <p className="text-sm font-semibold text-slate-900 truncate mt-1">{previewContent.subject}</p>
                      <p className="text-xs text-slate-500 mt-1">{t('campaignWizard.reviewUsing', { email: previewRecipient.email })}</p>
                    </div>
                    <div
                      className="max-h-56 overflow-y-auto p-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent.html, { USE_PROFILES: { html: true } }) }}
                    />
                  </div>
                )}
                <button
                  onClick={startCampaign}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Rocket size={20} />
                  {t('campaignWizard.reviewLaunch')}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in duration-500">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full border-4 border-slate-100 flex items-center justify-center ${sendProgress < 100 ? 'animate-pulse' : ''}`}>
                <Rocket className={`text-blue-600 transition-all duration-1000 ${sendProgress === 100 ? 'translate-y-[-100px] opacity-0' : ''}`} size={48} />
                {sendProgress === 100 && <Check className="text-green-500 animate-bounce" size={48} />}
              </div>
              <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                <circle
                  cx="64" cy="64" r="62"
                  className="stroke-blue-600 fill-none transition-all duration-300"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 62}`}
                  strokeDashoffset={`${2 * Math.PI * 62 * (1 - sendProgress / 100)}`}
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-bold">{sendProgress < 100 ? t('campaignWizard.sendingProgress') : t('campaignWizard.sendingComplete')}</h3>
              <p className="text-slate-500">{t('campaignWizard.sendingStatus', { progress: sendProgress, sent: stats.sent, failed: stats.failed })}</p>
            </div>

            <div className="w-full max-w-md bg-slate-50 rounded-2xl p-6 grid grid-cols-2 gap-4">
              <div className="text-center p-4">
                <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">{t('campaignWizard.sendingDelivered')}</p>
              </div>
              <div className="text-center p-4 border-l border-slate-200">
                <p className="text-3xl font-bold text-red-500">{stats.failed}</p>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">{t('campaignWizard.sendingErrors')}</p>
              </div>
            </div>

            {sendProgress === 100 && (
              <p className="text-sm text-slate-400 italic">{t('campaignWizard.sendingRedirect')}</p>
            )}
          </div>
        )}

        {currentStep < 4 && (
          <div className="mt-auto pt-10 flex items-center justify-between border-t border-slate-50">
            <button
              onClick={() => currentStep === 1 ? onCancel() : setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2 px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-all"
            >
              <ChevronLeft size={20} />
              {currentStep === 1 ? t('campaignWizard.cancel') : t('campaignWizard.back')}
            </button>
            <button
              disabled={
                (currentStep === 1 && !isStep1Valid) ||
                (currentStep === 2 && !isStep2Valid) ||
                (currentStep === 3)
              }
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-md ${(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid) || (currentStep === 3)
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                }`}
            >
              {t('campaignWizard.next')}
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignWizard;
