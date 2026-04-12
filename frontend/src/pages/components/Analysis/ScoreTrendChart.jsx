import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://seostory.de/api';

export default function ScoreTrendChart({ siteId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/sites/${siteId}/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        // Silently skip if site not found (404) or any server error
        if (!res.ok) {
          setData([]);
          return;
        }

        const json = await res.json();
        if (json.success) {
          // Format data for chart
          const formatted = json.data.map(item => ({
            date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: parseFloat(item.score || 0),
            issues: item.issues_found || 0,
            fullDate: new Date(item.created_at).toLocaleString()
          }));
          setData(formatted);
        } else {
          setData([]);
        }
      } catch (err) {
        // Network error — fail silently, chart will show empty state
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (siteId) fetchHistory();
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-100 h-[300px]">
        <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
        <span className="text-sm text-slate-500 font-medium">Loading health trends...</span>
      </div>
    );
  }

  if (error || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-100 h-[300px] text-center">
        <AlertCircle className="text-slate-300 mb-2" size={32} />
        <h4 className="text-sm font-semibold text-slate-700">Not enough data to show trends</h4>
        <p className="text-xs text-slate-500 max-w-[200px] mt-1">
          Complete more audits to see your SEO improvement progress.
        </p>
      </div>
    );
  }

  const latestScore = data[data.length - 1].score;
  const previousScore = data[data.length - 2].score;
  const diff = (latestScore - previousScore).toFixed(1);
  const isUp = latestScore >= previousScore;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            SEO Health Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Overall site health score progress</p>
        </div>
        
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
          isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {isUp ? '↑' : '↓'} {Math.abs(diff)}pts
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              name="Health Score"
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
