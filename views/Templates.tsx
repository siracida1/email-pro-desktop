
import React, { useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { EmailTemplate } from '../types';
import { useI18n } from '../i18n';
import { Columns2, Copy, Download, Plus, Trash2, Edit3, Eye, Code, FileText, Search, Upload } from 'lucide-react';

interface TemplatesProps {
  templates: EmailTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
}

const Templates: React.FC<TemplatesProps> = ({ templates, setTemplates }) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    htmlContent: ''
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const htmlFileInputRef = useRef<HTMLInputElement>(null);

  const sanitizeTemplateHtml = (html: string) => DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['style'],
    ADD_ATTR: ['target']
  });

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData(template);
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        htmlContent: '<html>\n  <body>\n    <h1>¡Hola {{name}}!</h1>\n    <p>Este es tu contenido.</p>\n  </body>\n</html>'
      });
    }
    setViewMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const trimmedSubject = formData.subject?.trim() || '';
    const trimmedContent = formData.htmlContent?.trim() || '';
    let trimmedName = formData.name?.trim() || '';

    // If template name was left empty, auto-fallback to subject or default name
    if (!trimmedName) {
      trimmedName = trimmedSubject || t('templates.defaultName') || 'Nueva Plantilla';
    }

    if (!trimmedSubject) {
      alert(t('templates.missingSubject'));
      return;
    }

    if (!trimmedContent) {
      alert(t('templates.missingContent'));
      return;
    }

    const finalData: EmailTemplate = {
      name: trimmedName,
      subject: trimmedSubject,
      htmlContent: trimmedContent,
      id: editingTemplate ? editingTemplate.id : (window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
      createdAt: editingTemplate ? editingTemplate.createdAt : Date.now()
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? finalData : t));
    } else {
      setTemplates(prev => [finalData, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('templates.deleteConfirm'))) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    const copy: EmailTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} ${t('templates.copySuffix')}`,
      createdAt: Date.now()
    };
    setTemplates(prev => [copy, ...prev]);
  };

  const exportTemplate = (template: Partial<EmailTemplate>) => {
    if (!template.htmlContent) return;
    const blob = new Blob([template.htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(template.name || 'plantilla').replace(/[^a-z0-9-_]+/gi, '_')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importHtmlFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      setFormData(prev => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^.]+$/, ''),
        htmlContent: String(event.target?.result || '')
      }));
    };
    reader.readAsText(file);
  };

  const insertPlaceholder = (tag: string) => {
    const textarea = textareaRef.current;
    const currentHtml = formData.htmlContent || '';

    if (!textarea) {
      setFormData({ ...formData, htmlContent: currentHtml + tag });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextHtml = `${currentHtml.slice(0, start)}${tag}${currentHtml.slice(end)}`;
    setFormData({ ...formData, htmlContent: nextHtml });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const renderPreview = (className = 'p-8 prose prose-slate max-w-none') => (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: sanitizeTemplateHtml((formData.htmlContent || '')
          .replace(/{{name}}/g, 'Cliente Estimado'))
      }}
    />
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTemplates = templates.filter(template => {
    if (!normalizedSearch) return true;
    return [
      template.name,
      template.subject,
      template.htmlContent
    ].some(value => value?.toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('templates.title')}</h2>
          <p className="text-slate-500 mt-1">{t('templates.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('templates.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            {t('templates.addButton')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 && (
          <div className="lg:col-span-3 py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900">{t('templates.empty')}</h3>
            <p className="text-slate-500 mt-2">{t('templates.emptyHint')}</p>
          </div>
        )}

        {templates.length > 0 && filteredTemplates.length === 0 && (
          <div className="lg:col-span-3 py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Search className="mx-auto text-slate-300 mb-4" size={40} />
            <h3 className="text-lg font-semibold text-slate-900">{t('templates.noResults')}</h3>
            <p className="text-slate-500 mt-2">{t('templates.noResultsHint')}</p>
          </div>
        )}

        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:border-blue-200 transition-all group">
            <div className="h-40 bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
              <div
                className="w-full h-full scale-50 origin-top pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
                dangerouslySetInnerHTML={{ __html: sanitizeTemplateHtml(template.htmlContent) }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => duplicateTemplate(template)} className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 rounded-lg transition-all" title={t('templates.duplicateTitle')}>
                  <Copy size={16} />
                </button>
                <button onClick={() => exportTemplate(template)} className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-green-600 rounded-lg transition-all" title={t('templates.exportTitle')}>
                  <Download size={16} />
                </button>
                <button onClick={() => handleOpenModal(template)} className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 rounded-lg transition-all">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(template.id)} className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold truncate mb-1">{template.name}</h3>
              <p className="text-xs text-slate-400 mb-4 italic">"{template.subject}"</p>
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{new Date(template.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {t('templates.duplicate')}
                  </button>
                  <button
                    onClick={() => handleOpenModal(template)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {t('templates.edit')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
          <div className="bg-white w-full h-full md:w-[95%] md:h-[90%] md:max-w-6xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600 shrink-0" size={24} />
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('templates.nameLabel')}</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('templates.fieldNamePlaceholder')}
                    className="text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-1 outline-none transition-all min-w-[260px]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Code size={16} /> {t('templates.tabCode')}
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Eye size={16} /> {t('templates.tabPreview')}
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'split' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Columns2 size={16} /> {t('templates.tabSplit')}
                  </button>
                </div>
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <input
                  ref={htmlFileInputRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) importHtmlFile(file);
                    e.currentTarget.value = '';
                  }}
                />
                <button
                  onClick={() => htmlFileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title={t('templates.importTitle')}
                >
                  <Upload size={20} />
                </button>
                <button
                  onClick={() => exportTemplate(formData)}
                  disabled={!formData.htmlContent}
                  className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-40"
                  title={t('templates.exportTitle')}
                >
                  <Download size={20} />
                </button>
                {editingTemplate && (
                  <button
                    onClick={() => {
                      if (editingTemplate) duplicateTemplate({ ...editingTemplate, ...formData } as EmailTemplate);
                    }}
                    className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title={t('templates.duplicateTitle')}
                  >
                    <Copy size={20} />
                  </button>
                )}
                {editingTemplate && (
                  <button
                    onClick={() => {
                      if (window.confirm(t('templates.deleteConfirm'))) {
                        handleDelete(editingTemplate.id);
                        setIsModalOpen(false);
                      }
                    }}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title={t('templates.deleteTitle')}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-medium"
                >
                  {t('templates.close')}
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  {t('templates.save')}
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar tools */}
              <div className="w-80 border-r border-slate-100 p-6 flex flex-col space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('templates.subjectLabel')}</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t('templates.subjectPlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('templates.placeholdersTitle')}</h4>
                  <div className="space-y-2">
                    {[
                      { tag: '{{name}}', label: t('templates.placeholderName') },
                      { tag: '{{email}}', label: t('templates.placeholderEmail') },
                      { tag: '{{company}}', label: t('templates.placeholderCompany') }
                    ].map(item => (
                      <div key={item.tag} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex flex-col">
                          <code className="text-xs font-semibold text-blue-600">{item.tag}</code>
                          <span className="text-[10px] text-slate-400">{item.label}</span>
                        </div>
                        <button
                          onClick={() => insertPlaceholder(item.tag)}
                          className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                        >
                          {t('templates.insertButton')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor/Preview Area */}
              <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col">
                {viewMode === 'edit' ? (
                  <textarea
                    ref={textareaRef}
                    value={formData.htmlContent}
                    onChange={e => setFormData({ ...formData, htmlContent: e.target.value })}
                    className="flex-1 p-8 font-mono text-sm bg-slate-900 text-slate-300 outline-none resize-none selection:bg-blue-500/30"
                    spellCheck={false}
                  />
                ) : viewMode === 'split' ? (
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                    <textarea
                      ref={textareaRef}
                      value={formData.htmlContent}
                      onChange={e => setFormData({ ...formData, htmlContent: e.target.value })}
                      className="min-h-[320px] lg:min-h-0 p-8 font-mono text-sm bg-slate-900 text-slate-300 outline-none resize-none selection:bg-blue-500/30"
                      spellCheck={false}
                    />
                    <div className="overflow-y-auto p-6 bg-slate-50">
                      <div className="bg-white shadow-xl rounded-xl overflow-hidden min-h-[500px]">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-400"></span>
                          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                          <span className="w-3 h-3 rounded-full bg-green-400"></span>
                          <span className="ml-2 font-medium">{t('templates.previewLabel')}</span>
                        </div>
                        {renderPreview()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-8 overflow-y-auto flex justify-center">
                    <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden min-h-[500px]">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="w-3 h-3 rounded-full bg-green-400"></span>
                        <span className="ml-2 font-medium">{t('templates.previewModeLabel')}</span>
                      </div>
                      {renderPreview()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
