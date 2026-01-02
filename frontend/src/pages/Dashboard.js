import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Award,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, appsRes, interviewsRes] = await Promise.all([
        axios.get(`${API}/analytics/stats`),
        axios.get(`${API}/applications`),
        axios.get(`${API}/interviews`),
      ]);

      setStats(statsRes.data);
      setRecentApplications(appsRes.data.slice(0, 5));
      
      // Filter upcoming interviews
      const upcoming = interviewsRes.data
        .filter(i => new Date(i.interview_date) > new Date())
        .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
        .slice(0, 3);
      setUpcomingInterviews(upcoming);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: Briefcase,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Interviews',
      value: stats?.total_interviews || 0,
      icon: Calendar,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Response Rate',
      value: `${stats?.response_rate || 0}%`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: 'Offers',
      value: stats?.offers || 0,
      icon: Award,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      applied: '#3b82f6',
      screening: '#eab308',
      interview: '#10b981',
      offer: '#8b5cf6',
      rejected: '#ef4444',
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            <Sparkles size={48} style={{ color: 'var(--status-interview)' }} />
          </div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
          Welcome back! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here's an overview of your job search progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300"
            style={{ background: stat.gradient }}
          >
            <div className="flex items-start justify-between">
              <div className="text-white">
                <p className="text-sm opacity-90 mb-1">{stat.title}</p>
                <h3 className="text-4xl font-bold">{stat.value}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <stat.icon size={24} color="white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/applications')}
          data-testid="add-application-btn"
          className="group p-6 rounded-xl border-2 border-dashed hover:border-solid transition-all duration-300 flex items-center justify-center gap-3"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Plus size={24} color="white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Add New Application
          </span>
        </button>

        <button
          onClick={() => navigate('/ai-tools')}
          className="group p-6 rounded-xl border-2 border-dashed hover:border-solid transition-all duration-300 flex items-center justify-center gap-3"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
            style={{ background: 'var(--gradient-secondary)' }}
          >
            <Sparkles size={24} color="white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Use AI Tools
          </span>
        </button>
      </div>

      {/* Recent Applications & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div
          className="rounded-xl p-6 shadow-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Recent Applications
            </h2>
            <button
              onClick={() => navigate('/applications')}
              className="text-sm font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--status-interview)' }}
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {recentApplications.length > 0 ? (
              recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-lg border transition-all hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {app.position}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {app.company_name}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(app.status) }}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No applications yet. Start tracking!
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div
          className="rounded-xl p-6 shadow-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Upcoming Interviews
          </h2>

          <div className="space-y-3">
            {upcomingInterviews.length > 0 ? (
              upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--gradient-success)' }}
                    >
                      <Calendar size={20} color="white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {interview.interview_type}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(interview.interview_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No upcoming interviews
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
