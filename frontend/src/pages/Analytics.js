import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 mx-auto rounded-full" style={{ background: 'var(--gradient-primary)' }} />
          </div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statusData = stats?.status_breakdown ? [
    { name: 'Applied', value: stats.status_breakdown.applied, color: '#3b82f6' },
    { name: 'Screening', value: stats.status_breakdown.screening, color: '#eab308' },
    { name: 'Interview', value: stats.status_breakdown.interview, color: '#10b981' },
    { name: 'Offer', value: stats.status_breakdown.offer, color: '#8b5cf6' },
    { name: 'Rejected', value: stats.status_breakdown.rejected, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  const barData = stats?.status_breakdown ? [
    { status: 'Applied', count: stats.status_breakdown.applied },
    { status: 'Screening', count: stats.status_breakdown.screening },
    { status: 'Interview', count: stats.status_breakdown.interview },
    { status: 'Offer', count: stats.status_breakdown.offer },
    { status: 'Rejected', count: stats.status_breakdown.rejected },
  ] : [];

  const metricCards = [
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: Users,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Response Rate',
      value: `${stats?.response_rate || 0}%`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Interview Rate',
      value: `${stats?.interview_rate || 0}%`,
      icon: Target,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: 'Offers Received',
      value: stats?.offers || 0,
      icon: Award,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  return (
    <div className="space-y-6 fade-in" data-testid="analytics-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
          Analytics 📊
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Insights into your job search performance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <div
            key={index}
            className="rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300"
            style={{ background: metric.gradient }}
          >
            <div className="flex items-start justify-between">
              <div className="text-white">
                <p className="text-sm opacity-90 mb-1">{metric.title}</p>
                <h3 className="text-4xl font-bold">{metric.value}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <metric.icon size={24} color="white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div
          className="rounded-xl p-6 shadow-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Application Status Distribution
          </h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p style={{ color: 'var(--text-tertiary)' }}>No data available</p>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div
          className="rounded-xl p-6 shadow-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Application Count by Status
          </h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="status" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p style={{ color: 'var(--text-tertiary)' }}>No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div
        className="rounded-xl p-6 shadow-md"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Success Rate
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats?.interview_rate || 0}%
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Applications leading to interviews
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Active Applications
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {(stats?.status_breakdown?.applied || 0) + 
               (stats?.status_breakdown?.screening || 0) + 
               (stats?.status_breakdown?.interview || 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              In progress applications
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Total Interviews
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats?.total_interviews || 0}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Interviews scheduled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
