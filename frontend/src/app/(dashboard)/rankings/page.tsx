'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Trophy, Star, TrendingUp, Users } from 'lucide-react';

export default function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<any>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const data = await api.get('/rankings');
      setRankings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const RankMedal = ({ index }: { index: number }) => {
    if (index === 0) return <span className="text-2xl" title="رتبه اول">🥇</span>;
    if (index === 1) return <span className="text-2xl" title="رتبه دوم">🥈</span>;
    if (index === 2) return <span className="text-2xl" title="رتبه سوم">🥉</span>;
    return <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-500 text-sm">{index + 1}</span>;
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
          <Trophy className="w-8 h-8 ml-3 text-amber-500" />
          رتبه‌بندی و بهترین عملکردها
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">تابلوی افتخارات و برترین‌های شبکه فروش</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Reps */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold flex items-center text-gray-900 mb-6 pb-4 border-b border-gray-50">
            <Star className="w-5 h-5 ml-2 text-indigo-500" />
            بهترین کارشناسان
          </h2>
          <div className="space-y-4">
            {rankings?.topReps?.map((rep: any, i: number) => (
              <div key={rep.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center">
                  <div className="w-10 flex justify-center"><RankMedal index={i} /></div>
                  <div className="mr-3">
                    <p className="font-bold text-gray-900">{rep.name}</p>
                    <p className="text-xs text-gray-500 font-mono" dir="ltr">{rep.percent}% تحقق وصول</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-600 text-sm">{Number(rep.collected).toLocaleString('fa-IR')} <span className="text-xs text-gray-400">تومان</span></p>
                </div>
              </div>
            ))}
            {rankings?.topReps?.length === 0 && <p className="text-sm text-gray-500 text-center py-4">داده‌ای یافت نشد</p>}
          </div>
        </div>

        {/* Top Territories */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold flex items-center text-gray-900 mb-6 pb-4 border-b border-gray-50">
            <TrendingUp className="w-5 h-5 ml-2 text-rose-500" />
            بهترین مناطق
          </h2>
          <div className="space-y-4">
            {rankings?.topTerritories?.map((terr: any, i: number) => (
              <div key={terr.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center">
                  <div className="w-10 flex justify-center"><RankMedal index={i} /></div>
                  <div className="mr-3">
                    <p className="font-bold text-gray-900">{terr.name}</p>
                    <p className="text-xs text-gray-500 font-mono" dir="ltr">{Number(terr.totalSales).toLocaleString('fa-IR')} فروش</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-600 text-sm">{Number(terr.totalCollected).toLocaleString('fa-IR')} <span className="text-xs text-gray-400">تومان وصول</span></p>
                </div>
              </div>
            ))}
            {rankings?.topTerritories?.length === 0 && <p className="text-sm text-gray-500 text-center py-4">داده‌ای یافت نشد</p>}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold flex items-center text-gray-900 mb-6 pb-4 border-b border-gray-50">
            <Users className="w-5 h-5 ml-2 text-emerald-500" />
            پرسودترین مشتریان
          </h2>
          <div className="space-y-4">
            {rankings?.topCustomers?.map((cust: any, i: number) => (
              <div key={cust.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center">
                  <div className="w-10 flex justify-center"><RankMedal index={i} /></div>
                  <div className="mr-3">
                    <p className="font-bold text-gray-900 line-clamp-1">{cust.name}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-600 text-sm">{Number(cust.totalCollected).toLocaleString('fa-IR')} <span className="text-xs text-gray-400">تومان</span></p>
                </div>
              </div>
            ))}
            {rankings?.topCustomers?.length === 0 && <p className="text-sm text-gray-500 text-center py-4">داده‌ای یافت نشد</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
