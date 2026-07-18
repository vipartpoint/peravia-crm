'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { MessageSquare, Plus, CheckCircle, XCircle, Info, Send, Calendar, Navigation, Edit, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/activities/entity/${entityType}/${entityId}`);
      setActivities(res.data);
    } catch (err: any) {
      console.error(err);
      toast({ type: 'error', title: 'خطا', description: 'دریافت تاریخچه فعالیت‌ها با خطا مواجه شد' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/activities/note', {
        entityType,
        entityId,
        description: noteContent
      });
      setNoteContent('');
      toast({ type: 'success', title: 'موفقیت', description: 'یادداشت با موفقیت ثبت شد' });
      fetchActivities();
    } catch (err: any) {
      toast({ type: 'error', title: 'خطا', description: err.response?.data?.message || 'خطا در ثبت یادداشت' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Created': return <Plus className="w-4 h-4 text-emerald-600" />;
      case 'NoteAdded': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'StageChanged': return <RefreshCw className="w-4 h-4 text-indigo-600" />;
      case 'OpportunityWon':
      case 'OrderApproved': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'OpportunityLost':
      case 'OrderCancelled': return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'Updated': return <Edit className="w-4 h-4 text-slate-600" />;
      case 'MeetingScheduled': return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'VisitScheduled': return <Navigation className="w-4 h-4 text-purple-600" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">تاریخچه فعالیت‌ها</h3>
      
      {/* Add Note */}
      <form onSubmit={handleAddNote} className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="یادداشت یا توضیحات خود را اینجا بنویسید..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mb-3 resize-none h-20"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !noteContent.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            ثبت یادداشت
          </button>
        </div>
      </form>

      {/* Timeline */}
      <div className="relative border-r-2 border-slate-100 dark:border-slate-800 pr-6 mr-3 space-y-6">
        {loading ? (
          <div className="text-slate-500 text-sm py-4">در حال بارگذاری...</div>
        ) : activities.length === 0 ? (
          <div className="text-slate-500 text-sm py-4">هیچ فعالیتی تاکنون ثبت نشده است.</div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="relative">
              {/* Dot Icon */}
              <div className="absolute -right-[35px] top-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                {getActivityIcon(act.activityType)}
              </div>
              
              {/* Content */}
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{act.title}</h4>
                  <span className="text-xs text-slate-400 font-medium" dir="ltr">
                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: faIR })}
                  </span>
                </div>
                {act.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap leading-relaxed mb-3">
                    {act.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {act.user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span>{act.user?.username || 'سیستم'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
