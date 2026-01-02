import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  FileText, 
  Target, 
  MessageSquare, 
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AITools = () => {
  const [activeTab, setActiveTab] = useState('cover-letter');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    position: '',
    job_description: '',
    user_skills: '',
  });

  const tools = [
    {
      id: 'cover-letter',
      title: 'Cover Letter Generator',
      icon: FileText,
      description: 'Generate professional cover letters tailored to job descriptions',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'resume-tailor',
      title: 'Resume Tailor',
      icon: Target,
      description: 'Get suggestions to optimize your resume for specific roles',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 'interview-prep',
      title: 'Interview Prep',
      icon: MessageSquare,
      description: 'Generate likely interview questions and answer frameworks',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      id: 'insights',
      title: 'Application Insights',
      icon: Lightbulb,
      description: 'Get AI-powered insights about your job search strategy',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  const handleGenerate = async () => {
    if (!formData.job_description && activeTab !== 'insights') {
      toast.error('Please fill in the job description');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      let endpoint = '';
      
      switch (activeTab) {
        case 'cover-letter':
          endpoint = '/ai/cover-letter';
          break;
        case 'resume-tailor':
          endpoint = '/ai/resume-tailor';
          break;
        case 'interview-prep':
          endpoint = '/ai/interview-prep';
          break;
        case 'insights':
          endpoint = '/ai/insights';
          break;
        default:
          endpoint = '/ai/cover-letter';
      }

      const response = await axios.post(`${API}${endpoint}`, {
        company_name: formData.company_name,
        position: formData.position,
        job_description: formData.job_description,
        user_skills: formData.user_skills,
      });

      setResult(response.data.content);
      toast.success('Generated successfully!');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const activeTool = tools.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 fade-in" data-testid="ai-tools-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
          AI Tools 🤖
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enhance your job applications with AI-powered tools
        </p>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTab(tool.id);
              setResult('');
            }}
            className={`p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
              activeTab === tool.id ? 'shadow-xl' : 'shadow-md'
            }`}
            style={{
              background: activeTab === tool.id ? tool.gradient : 'var(--bg-primary)',
              border: activeTab === tool.id ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                activeTab === tool.id ? 'bg-white bg-opacity-20' : ''
              }`}
              style={{
                background: activeTab === tool.id ? 'rgba(255,255,255,0.2)' : tool.gradient,
              }}
            >
              <tool.icon
                size={24}
                color={activeTab === tool.id ? 'white' : 'white'}
              />
            </div>
            <h3
              className="font-semibold mb-2"
              style={{
                color: activeTab === tool.id ? 'white' : 'var(--text-primary)',
              }}
            >
              {tool.title}
            </h3>
            <p
              className="text-sm"
              style={{
                color: activeTab === tool.id ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
              }}
            >
              {tool.description}
            </p>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div
          className="rounded-xl p-6 shadow-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: activeTool.gradient }}
            >
              <activeTool.icon size={20} color="white" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {activeTool.title}
            </h2>
          </div>

          {activeTab !== 'insights' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g., Google"
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
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Software Engineer"
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
                  Job Description *
                </label>
                <textarea
                  rows={6}
                  value={formData.job_description}
                  onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                  placeholder="Paste the job description here..."
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {activeTab === 'cover-letter' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Your Skills (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.user_skills}
                    onChange={(e) => setFormData({ ...formData, user_skills: e.target.value })}
                    placeholder="e.g., React, Node.js, Python, 5 years experience..."
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="py-8 text-center">
              <Lightbulb size={48} style={{ color: 'var(--status-screening)', margin: '0 auto' }} />
              <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
                Get personalized insights based on your application history
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-6 py-3 px-4 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: activeTool.gradient }}
            data-testid="generate-btn"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate with AI
              </>
            )}
          </button>
        </div>

        {/* Result Area */}
        <div
          className="rounded-xl p-6 shadow-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Result
            </h2>
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div
            className="min-h-[400px] p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-pulse">
                    <Sparkles size={48} style={{ color: 'var(--status-interview)', margin: '0 auto' }} />
                  </div>
                  <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
                    AI is generating your content...
                  </p>
                </div>
              </div>
            ) : result ? (
              <div
                className="whitespace-pre-wrap"
                style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
              >
                {result}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Your AI-generated content will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITools;
