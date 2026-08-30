
import React from 'react';
import { Campaign } from '../types';
import { useI18n } from '../i18n';
import { Users, Mail, FileText, CheckCircle2, TrendingUp, Clock, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  campaigns: Campaign[];
  templatesCount: number;
  accountsCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ campaigns, templatesCount, accountsCount }) => {
  const { t } = useI18n();
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);
  
  const stats = [
    { label: t('dashboard.sent'), value: totalSent.toLocaleString(), icon: <Send size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('dashboard.activeTemplates'), value: templatesCount, icon: <FileText size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: t('dashboard.sendingAccounts'), value: accountsCount, icon: <Users size={20} />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: t('dashboard.successRate'), value: totalSent > 0 ? `${Math.round((totalSent / (totalSent + totalFailed)) * 100)}%` : '100%', icon: <CheckCircle2 size={20} />, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const chartData = campaigns.slice(0, 7).reverse().map(c => ({
    name: c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name,
    enviados: c.sentCount,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard.title')}</h2>
        <p className="text-slate-500 mt-1">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-50 p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-50 p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              {t('dashboard.chartTitle')}
            </h3>
          </div>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="enviados" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                {t('dashboard.chartEmpty')}
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <Clock size={20} className="text-slate-500" />
            {t('dashboard.recentActivity')}
          </h3>
          <div className="flex-1 space-y-6 overflow-y-auto max-h-[300px] pr-2">
            {campaigns.length === 0 && <p className="text-slate-400 text-center py-8">{t('dashboard.noActivity')}</p>}
            {campaigns.slice(0, 5).map(c => (
              <div key={c.id} className="flex gap-4 items-start">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${c.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm font-semibold">
                    {c.status === 'completed'
                      ? t('dashboard.campaignCompleted', { name: c.name })
                      : t('dashboard.campaignSent', { name: c.name })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
