
import React from 'react';
import { useI18n } from '../i18n';
import { Globe, User, Mail, ExternalLink, Heart, Coffee } from 'lucide-react';

const languages = [
  { code: 'es', flag: '🇪🇸' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'fr', flag: '🇫🇷' },
];

const Settings: React.FC = () => {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('settings.title')}</h2>
        <p className="text-slate-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-50 p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('settings.language')}</h3>
              <p className="text-sm text-slate-500">{t('settings.languageHint')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLocale(lang.code)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  locale === lang.code
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 hover:border-slate-200 bg-zinc-50'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className={`font-semibold ${locale === lang.code ? 'text-blue-600' : 'text-slate-700'}`}>
                  {t(`settings.language.${lang.code}`)}
                </span>
                {locale === lang.code && (
                  <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                    {t('settings.language')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
              <Heart size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('settings.credits')}</h3>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                CF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{t('settings.developer')}:</span>
                </div>
                <p className="text-slate-900 font-semibold mt-0.5">Christian Freelance</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{t('settings.email')}:</span>
                </div>
                <a
                  href="mailto:chrishb2000@gmail.com"
                  className="text-blue-600 hover:text-blue-700 font-semibold mt-0.5 block"
                >
                  chrishb2000@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <ExternalLink size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{t('settings.website')}:</span>
                </div>
                <a
                  href="https://christian-freelance.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold mt-0.5 block"
                >
                  https://christian-freelance.us/
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-amber-50/80 rounded-xl border border-amber-200/60">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Coffee size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Coffee size={14} className="text-amber-600" />
                  <span className="font-bold text-slate-800">{t('settings.buyCoffee')}:</span>
                </div>
                <a
                  href="https://www.paypal.com/donate/?hosted_button_id=YC6YAWBQ7HNSS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-800 font-semibold mt-1 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  <span>{t('settings.donateBtn')}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
