
import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  Building2,
  Download,
  Globe2,
  ListChecks,
  MapPin,
  Search,
  Tags,
  Trash2,
  Upload,
  Users,
  X
} from 'lucide-react';
import { Recipient, RecipientList } from '../types';
import { useI18n } from '../i18n';

interface RecipientListsProps {
  lists: RecipientList[];
  setLists: React.Dispatch<React.SetStateAction<RecipientList[]>>;
}

const emptySummary = { valid: 0, invalid: 0, duplicates: 0 };

const escapeCsvValue = (value: unknown) => {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const parseRecipientCsv = (text: string) => {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().replace(/^\uFEFF/, '').toLowerCase(),
    transform: value => value.trim()
  });

  if (result.errors.length > 0) {
    throw new Error('El archivo CSV no se pudo leer correctamente. Revisa el formato e inténtalo de nuevo.');
  }

  let invalid = 0;
  let duplicates = 0;
  const seenEmails = new Set<string>();
  const recipients = result.data.filter(row => {
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

  if (recipients.length === 0) {
    throw new Error('No se encontraron destinatarios válidos. El CSV debe incluir una columna email.');
  }

  return { recipients, summary: { valid: recipients.length, invalid, duplicates } };
};

const metadataChips = (list: RecipientList) => [
  { label: list.classification, icon: Tags },
  { label: list.zone, icon: MapPin },
  { label: list.city, icon: Building2 },
  { label: list.country, icon: Globe2 }
].filter((chip): chip is { label: string; icon: typeof Tags } => Boolean(chip.label));

const RecipientLists: React.FC<RecipientListsProps> = ({ lists, setLists }) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importName, setImportName] = useState('');
  const [classification, setClassification] = useState('');
  const [zone, setZone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [parsedRecipients, setParsedRecipients] = useState<Recipient[]>([]);
  const [csvSummary, setCsvSummary] = useState(emptySummary);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLists = lists.filter(list => {
    if (!normalizedSearch) return true;
    return [
      list.name,
      list.classification,
      list.zone,
      list.city,
      list.country,
      list.sourceFileName,
      String(list.recipients.length),
      ...list.recipients.slice(0, 20).flatMap(recipient => [recipient.email, recipient.name, recipient.company])
    ].some(value => value?.toLowerCase().includes(normalizedSearch));
  });

  const resetImportForm = () => {
    setImportName('');
    setClassification('');
    setZone('');
    setCity('');
    setCountry('');
    setSourceFileName('');
    setParsedRecipients([]);
    setCsvSummary(emptySummary);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeImport = () => {
    setIsImportOpen(false);
    resetImportForm();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = parseRecipientCsv(text);
        setParsedRecipients(parsed.recipients);
        setCsvSummary(parsed.summary);
        setSourceFileName(file.name);
        if (!importName.trim()) {
          setImportName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
        setParsedRecipients([]);
        setCsvSummary(emptySummary);
      }
    };
    reader.readAsText(file);
  };

  const saveImportedList = () => {
    const name = importName.trim();
    if (!name || parsedRecipients.length === 0) return;

    const now = Date.now();
    const newList: RecipientList = {
      id: crypto.randomUUID(),
      name,
      classification: classification.trim() || undefined,
      zone: zone.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      sourceFileName: sourceFileName || undefined,
      recipients: parsedRecipients,
      createdAt: now,
      updatedAt: now
    };

    setLists(prev => [newList, ...prev]);
    closeImport();
  };

  const exportList = (list: RecipientList) => {
    const headers = Array.from(new Set(list.recipients.flatMap(recipient => Object.keys(recipient))));
    const csv = [
      headers.join(','),
      ...list.recipients.map(recipient => headers.map(header => escapeCsvValue(recipient[header])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${list.name.replace(/[^a-z0-9-_]+/gi, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const deleteList = (id: string) => {
    if (window.confirm(t('lists.deleteConfirm'))) {
      setLists(prev => prev.filter(list => list.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('lists.title')}</h2>
          <p className="text-slate-500 mt-1">{t('lists.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('lists.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm transition-all"
          >
            <Upload size={18} />
            {t('lists.importButton')}
          </button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white px-6">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900">{t('lists.empty')}</h3>
          <p className="text-slate-500 mt-2">{t('lists.emptyHint')}</p>
          <button
            onClick={() => setIsImportOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm transition-all"
          >
            <Upload size={18} />
            {t('lists.importFirst')}
          </button>
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <Search className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="text-lg font-semibold text-slate-900">{t('lists.noResults')}</h3>
          <p className="text-slate-500 mt-2">{t('lists.noResultsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLists.map(list => (
            <div key={list.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ListChecks size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate">{list.name}</h3>
                    <p className="text-sm text-slate-500">{t('lists.recipientsCount', { count: list.recipients.length })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportList(list)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title={t('lists.exportTitle')}
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => deleteList(list.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title={t('lists.deleteTitle')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {metadataChips(list).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {metadataChips(list).map(({ label, icon: Icon }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <Icon size={13} />
                      {label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400 space-y-1">
                {list.sourceFileName && <p>{t('lists.origin', { name: list.sourceFileName })}</p>}
                <p>{t('lists.updated', { date: new Date(list.updatedAt).toLocaleString() })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t('lists.importTitle')}</h3>
                <p className="text-sm text-slate-500">{t('lists.importHint')}</p>
              </div>
              <button onClick={closeImport} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Upload className="mx-auto text-blue-600 mb-3" size={30} />
                <p className="font-bold text-slate-900">{sourceFileName || t('lists.importSelectFile')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('lists.importAutoHint')}</p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>

              {parsedRecipients.length > 0 && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                  <strong>{t('lists.importValid', { count: csvSummary.valid })}</strong>
                  {csvSummary.invalid > 0 ? ` · ${t('lists.importInvalid', { count: csvSummary.invalid })}` : ''}
                  {csvSummary.duplicates > 0 ? ` · ${t('lists.importDuplicates', { count: csvSummary.duplicates })}` : ''}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('lists.fieldListName')}</label>
                  <input
                    type="text"
                    value={importName}
                    onChange={e => setImportName(e.target.value)}
                    placeholder={t('lists.fieldListNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('lists.fieldClassification')}</label>
                  <input
                    type="text"
                    value={classification}
                    onChange={e => setClassification(e.target.value)}
                    placeholder={t('lists.fieldClassificationPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('lists.fieldZone')}</label>
                  <input
                    type="text"
                    value={zone}
                    onChange={e => setZone(e.target.value)}
                    placeholder={t('lists.fieldZonePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('lists.fieldCity')}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder={t('lists.fieldCityPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('lists.fieldCountry')}</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder={t('lists.fieldCountryPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50">
              <button onClick={closeImport} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100">
                {t('lists.cancel')}
              </button>
              <button
                onClick={saveImportedList}
                disabled={!importName.trim() || parsedRecipients.length === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {t('lists.saveList')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientLists;
