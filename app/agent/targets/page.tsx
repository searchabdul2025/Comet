'use client';

import { useEffect, useState } from 'react';
import { Target, Trophy, Activity, RefreshCw, FileText } from 'lucide-react';

interface Summary {
  period: string;
  target: number;
  submitted: number;
  achieved: number;
  bonus: number;
  baseSalary?: number;
  totalCompensation?: number;
  completion: number;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function AgentTargetsPage() {
  const [period, setPeriod] = useState(currentMonth());
  const [summary, setSummary] = useState<Summary>({
    period: currentMonth(),
    target: 0,
    submitted: 0,
    achieved: 0,
    bonus: 0,
    completion: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (p = period) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/targets/summary?period=${p}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load summary');
      setSummary(json.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const progress = Math.min(100, summary.completion || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target size={26} className="text-emerald-600" />
            My Target
          </h1>
          <p className="text-gray-600">Track your submissions vs. assigned target.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-md text-sm text-black bg-white"
          />
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading target summary...</div>
      )}

      {!loading && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Target size={16} className="text-blue-600" />
            Target
          </div>
          <div className="text-3xl font-semibold text-gray-900">{summary.target}</div>
          <p className="text-xs text-slate-500">Allocated by supervisor/admin</p>
          <p className="text-xs text-slate-400 mt-1">Period: {summary.period}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <FileText size={16} className="text-purple-600" />
            Submitted
          </div>
          <div className="text-3xl font-semibold text-gray-900">{summary.submitted || 0}</div>
          <p className="text-xs text-slate-500">Total submissions this month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Activity size={16} className="text-emerald-600" />
            Achieved
          </div>
          <div className="text-3xl font-semibold text-gray-900">{summary.achieved}</div>
          <p className="text-xs text-slate-500">Submissions counted for target</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Trophy size={16} className="text-amber-500" />
            Bonus
          </div>
          <div className="text-3xl font-semibold text-gray-900">${(summary.bonus || 0).toLocaleString()}</div>
          <p className="text-xs text-slate-500">Calculated bonus (after base salary)</p>
          {summary.baseSalary !== undefined && summary.baseSalary > 0 && (
            <p className="text-xs text-emerald-600 mt-1">
              Base: ${summary.baseSalary.toLocaleString()} | Total: ${(summary.totalCompensation || summary.baseSalary + summary.bonus || 0).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <p className="text-sm text-gray-600">Live completion against your monthly target.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-slate-700 font-medium">{progress}%</span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

