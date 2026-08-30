
import React, { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';
import * as api from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const HelpWidget: React.FC = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await api.askAiHelp(question);
      setMessages(prev => [...prev, { role: 'assistant', text: result.answer || result.error || t('help.error') }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: t('help.error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-[90] w-[calc(100vw-3rem)] max-w-sm bg-zinc-50 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          <div className="flex items-center justify-between px-5 py-4 bg-blue-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold">{t('help.title')}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-all">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-slate-500">{t('help.greeting')}</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 flex items-end gap-2 shrink-0">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('help.placeholder')}
              className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-h-24 bg-zinc-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(prev => !prev)}
        title={t('help.title')}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>
    </>
  );
};

export default HelpWidget;
