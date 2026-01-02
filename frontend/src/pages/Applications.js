import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  DollarSign,
  MapPin,
  Calendar,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusColumns = [
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'screening', label: 'Screening', color: '#eab308' },
  { id: 'interview', label: 'Interview', color: '#10b981' },
  { id: 'offer', label: 'Offer', color: '#8b5cf6' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    position: '',
    job_description: '',
    job_url: '',
    status: 'applied',
    salary_min: '',
    salary_max: '',
    location: '',
    location_type: 'remote',
    notes: '',
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`);
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
    };

    try {
      if (editingApp) {
        await axios.put(`${API}/applications/${editingApp.id}`, payload);
        toast.success('Application updated!');
      } else {
        await axios.post(`${API}/applications`, payload);
        toast.success('Application added!');
      }
      
      setShowModal(false);
      setEditingApp(null);
      resetForm();
      fetchApplications();
    } catch (error) {
      toast.error('Failed to save application');
    }
  };

  const handleEdit = (app) => {
    setEditingApp(app);
    setFormData({
      company_name: app.company_name,
      position: app.position,
      job_description: app.job_description || '',
      job_url: app.job_url || '',
      status: app.status,
      salary_min: app.salary_min || '',
      salary_max: app.salary_max || '',
      location: app.location || '',
      location_type: app.location_type || 'remote',
      notes: app.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await axios.delete(`${API}/applications/${id}`);
        toast.success('Application deleted');
        fetchApplications();
      } catch (error) {
        toast.error('Failed to delete application');
      }
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${appId}`, { status: newStatus });
      fetchApplications();
      toast.success('Status updated!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      position: '',
      job_description: '',
      job_url: '',
      status: 'applied',
      salary_min: '',
      salary_max: '',
      location: '',
      location_type: 'remote',
      notes: '',
    });
  };

  const getApplicationsByStatus = (status) => {
    return applications.filter(app => app.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 mx-auto rounded-full" style={{ background: 'var(--gradient-primary)' }} />
          </div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="applications-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
            Applications
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your job applications
          </p>
        </div>
        <button
          onClick={() => {
            setEditingApp(null);
            resetForm();
            setShowModal(true);
          }}
          data-testid="add-new-application-btn"
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <Plus size={20} />
          Add Application
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const columnApps = getApplicationsByStatus(column.id);
          return (
            <div
              key={column.id}
              className="min-w-[280px] rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {column.label}
                  </h3>
                </div>
                <span
                  className="text-sm font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {columnApps.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-lg border shadow-sm hover:shadow-md transition-all group"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4
                        className="font-semibold text-sm line-clamp-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {app.company_name}
                      </h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(app)}
                          className="p-1 rounded hover:bg-opacity-10 transition-colors"
                          style={{ color: 'var(--status-interview)' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1 rounded hover:bg-opacity-10 transition-colors"
                          style={{ color: 'var(--status-rejected)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p
                      className="text-xs mb-3 line-clamp-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {app.position}
                    </p>

                    {app.location && (
                      <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <MapPin size={12} />
                        <span>{app.location}</span>
                      </div>
                    )}

                    {(app.salary_min || app.salary_max) && (
                      <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <DollarSign size={12} />
                        <span>
                          {app.salary_min ? `$${app.salary_min}k` : ''} 
                          {app.salary_min && app.salary_max ? ' - ' : ''}
                          {app.salary_max ? `$${app.salary_max}k` : ''}
                        </span>
                      </div>
                    )}

                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--status-interview)' }}
                      >
                        <ExternalLink size={12} />
                        View Job
                      </a>
                    )}

                    {/* Status Changer */}
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="w-full mt-3 text-xs px-2 py-1 rounded border"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {statusColumns.map(col => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                ))}

                {columnApps.length === 0 && (
                  <p className="text-center text-xs py-8" style={{ color: 'var(--text-tertiary)' }}>
                    No applications
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className="w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingApp ? 'Edit Application' : 'Add Application'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Job Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.job_description}
                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Job URL
                  </label>
                  <input
                    type="url"
                    value={formData.job_url}
                    onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {statusColumns.map(col => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Min Salary (k)
                    </label>
                    <input
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Max Salary (k)
                    </label>
                    <input
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Location Type
                    </label>
                    <select
                      value={formData.location_type}
                      onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold border transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {editingApp ? 'Update' : 'Add'} Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
