'use client';

import React, { useState } from 'react';
import { User, FileText, MapPin, DollarSign, BrainCircuit, Activity, Edit3, MessageSquare, ShoppingCart, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export type TimelineEventType = 'creation' | 'update' | 'visit' | 'order' | 'payment' | 'ai' | 'system' | 'note' | 'presentation';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string; // ISO date or relative
  user?: { name: string, avatarInitials: string };
  metadata?: any;
}

interface TimelineProps {
  events: TimelineEvent[];
}

type FilterType = 'all' | 'sales' | 'financial' | 'visits' | 'ai' | 'system';

export function Timeline({ events }: TimelineProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'creation': return <User className="w-4 h-4 text-emerald-600" />;
      case 'update': return <Edit3 className="w-4 h-4 text-slate-600" />;
      case 'visit': return <MapPin className="w-4 h-4 text-purple-600" />;
      case 'order': return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-rose-600" />;
      case 'ai': return <BrainCircuit className="w-4 h-4 text-indigo-600" />;
      case 'system': return <ShieldAlert className="w-4 h-4 text-orange-600" />;
      case 'note': return <MessageSquare className="w-4 h-4 text-teal-600" />;
      case 'presentation': return <FileText className="w-4 h-4 text-cyan-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEventBg = (type: TimelineEventType) => {
    switch (type) {
      case 'creation': return 'bg-emerald-100 border-emerald-200';
      case 'visit': return 'bg-purple-100 border-purple-200';
      case 'order': return 'bg-blue-100 border-blue-200';
      case 'payment': return 'bg-rose-100 border-rose-200';
      case 'ai': return 'bg-indigo-100 border-indigo-200';
      case 'system': return 'bg-orange-100 border-orange-200';
      case 'note': return 'bg-teal-100 border-teal-200';
      case 'presentation': return 'bg-cyan-100 border-cyan-200';
      default: return 'bg-slate-100 border-slate-200';
    }
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'sales' && ['order', 'presentation', 'creation'].includes(e.type)) return true;
    if (filter === 'financial' && ['payment'].includes(e.type)) return true;
    if (filter === 'visits' && ['visit'].includes(e.type)) return true;
    if (filter === 'ai' && ['ai'].includes(e.type)) return true;
    if (filter === 'system' && ['system', 'update'].includes(e.type)) return true;
    return false;
  });

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
        {(['all', 'sales', 'financial', 'visits', 'ai', 'system'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'همه فعالیت‌ها' :
             f === 'sales' ? 'فروش' :
             f === 'financial' ? 'مالی' :
             f === 'visits' ? 'ویزیت‌ها' :
             f === 'ai' ? 'هوش مصنوعی' : 'سیستمی'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative border-r border-slate-200 mr-4 pr-6 space-y-8">
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">هیچ فعالیتی در این بخش یافت نشد.</p>
        ) : (
          filteredEvents.map((event, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={event.id} 
              className="relative"
            >
              {/* Event Dot/Icon */}
              <div className={`absolute -right-[35px] top-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm bg-white ${getEventBg(event.type)}`}>
                {getEventIcon(event.type)}
              </div>

              {/* Event Card */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:shadow-md hover:border-slate-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {event.user && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {event.user.avatarInitials}
                      </div>
                    )}
                    <h4 className="font-bold text-sm text-slate-800">{event.title}</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-3">{event.timestamp}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-slate-600 leading-relaxed mr-8">
                    {event.description}
                  </p>
                )}
                
                {/* Meta details if any */}
                {event.metadata && (
                  <div className="mt-3 mr-8 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                    <pre className="font-sans whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
