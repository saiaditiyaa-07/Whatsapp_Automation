import React from 'react';
import { MessageSquare, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface MetricsProps {
  stats: {
    total: number;
    inbound: number;
    outbound: number;
    rulesCount: number;
    successRate: number;
  };
}

export function MetricsGrid({ stats }: MetricsProps) {
  const items = [
    {
      title: 'Total Messages',
      value: stats.total.toLocaleString(),
      change: '+12.4%',
      isPositive: true,
      icon: MessageSquare,
      color: 'bg-indigo-500/10 text-brandIndigo',
    },
    {
      title: 'Incoming Traffic',
      value: stats.inbound.toLocaleString(),
      change: '+18.2%',
      isPositive: true,
      icon: ArrowDownLeft,
      color: 'bg-emerald-500/10 text-brandGreen',
    },
    {
      title: 'Outgoing Responses',
      value: stats.outbound.toLocaleString(),
      change: '+8.1%',
      isPositive: true,
      icon: ArrowUpRight,
      color: 'bg-indigo-400/10 text-indigo-400',
    },
    {
      title: 'Reply Success Rate',
      value: `${stats.successRate}%`,
      change: 'Constant',
      isPositive: true,
      icon: ShieldCheck,
      color: 'bg-emerald-500/10 text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-darkSurface border border-darkBorder rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 hover:shadow-lg transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{item.title}</span>
              <div className={`p-2.5 rounded-lg ${item.color} transition-transform group-hover:scale-110 duration-200`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">{item.value}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    item.isPositive ? 'bg-brandGreen/10 text-brandGreen' : 'bg-brandRed/10 text-brandRed'
                  }`}
                >
                  {item.change}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">vs. previous 30 days performance</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
