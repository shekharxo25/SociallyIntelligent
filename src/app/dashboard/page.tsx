'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Plus, 
  RotateCw, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Upload, 
  Users, 
  Video, 
  ChevronDown, 
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  Info,
  ExternalLink,
  Bot,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    height="1em"
    width="1em"
    className={props.className}
  >
    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function Dashboard() {
  // Brand States
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandIndustry, setNewBrandIndustry] = useState('');

  // Dashboard Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'audience' | 'insights'>('overview');
  const [timeRange, setTimeRange] = useState('7d');

  // API Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [audienceData, setAudienceData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  
  // Loading States
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  // Ingestion Modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [ytChannelHandle, setYtChannelHandle] = useState('');
  const [ytChannelId, setYtChannelId] = useState('');
  const [isConnectingYT, setIsConnectingYT] = useState(false);

  // CSV State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // AI Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', text: 'Hello! I am SociallyIntelligent AI. Ask me details about your content performance, sentiment, or audience engagement trends.' }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Search/Filters for Content
  const [contentSearch, setContentSearch] = useState('');
  const [contentSort, setContentSort] = useState('views-desc');

  // Load initial brands
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch data when brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchOverviewData();
      fetchContentData();
      fetchAudienceData();
      fetchAIInsight();
    }
  }, [selectedBrand, timeRange]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(data);
      if (data.length > 0) {
        setSelectedBrand(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName, industry: newBrandIndustry }),
      });
      const data = await res.json();
      if (res.ok) {
        setBrands([...brands, data]);
        setSelectedBrand(data);
        setIsAddingBrand(false);
        setNewBrandName('');
        setNewBrandIndustry('');
      }
    } catch (err) {
      console.error('Failed to create brand:', err);
    }
  };

  const fetchOverviewData = async () => {
    if (!selectedBrand) return;
    setIsLoadingOverview(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/overview?range=${timeRange}`);
      const data = await res.json();
      setOverviewData(data);
    } catch (err) {
      console.error('Overview fetch error:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  const fetchContentData = async () => {
    if (!selectedBrand) return;
    setIsLoadingContent(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/content?range=${timeRange}`);
      const data = await res.json();
      setContentData(data);
    } catch (err) {
      console.error('Content fetch error:', err);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const fetchAudienceData = async () => {
    if (!selectedBrand) return;
    setIsLoadingAudience(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/audience?range=${timeRange}`);
      const data = await res.json();
      setAudienceData(data);
    } catch (err) {
      console.error('Audience fetch error:', err);
    } finally {
      setIsLoadingAudience(false);
    }
  };

  const fetchAIInsight = async (forceRegenerate = false) => {
    if (!selectedBrand) return;
    setIsLoadingAI(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'weekly_overview', regenerate: forceRegenerate }),
      });
      const data = await res.json();
      setAiInsight(data.summary_markdown || '');
    } catch (err) {
      console.error('AI insight error:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleConnectYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytChannelHandle || !ytChannelId) return;

    setIsConnectingYT(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await fetchOverviewData();
      setIsConnectModalOpen(false);
      setYtChannelHandle('');
      setYtChannelId('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnectingYT(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBrand) return;

    setIsUploadingCSV(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brandId', selectedBrand.id);

    try {
      const res = await fetch('/api/uploads/csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage(`Success! ${data.message}`);
        fetchOverviewData();
        fetchContentData();
        fetchAudienceData();
        fetchAIInsight(true);
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setUploadMessage('Upload failed.');
    } finally {
      setIsUploadingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedBrand) return;

    const userMsg = chatInput;
    setChatMessages([...chatMessages, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'qa', question: userMsg }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', text: data.answer || 'No response.' }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Error querying AI engine. Please verify GEMINI_API_KEY.' }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Filter & Sort Posts
  const filteredPosts = contentData?.posts?.filter((post: any) => {
    return post.content_text?.toLowerCase().includes(contentSearch.toLowerCase()) ||
           post.hashtags?.some((h: string) => h.toLowerCase().includes(contentSearch.toLowerCase()));
  }) || [];

  const sortedPosts = [...filteredPosts].sort((a: any, b: any) => {
    if (contentSort === 'views-desc') return b.metrics.views - a.metrics.views;
    if (contentSort === 'views-asc') return a.metrics.views - b.metrics.views;
    if (contentSort === 'eng-desc') return b.metrics.engagementRate - a.metrics.engagementRate;
    if (contentSort === 'date-desc') return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
    return 0;
  });

  // Sentiment Distribution Colors
  const COLORS = ['#0d9488', '#eab308', '#ef4444'];
  const sentimentDistribution = audienceData?.sentiment?.distribution 
    ? [
        { name: 'Positive', value: audienceData.sentiment.distribution.positive },
        { name: 'Neutral', value: audienceData.sentiment.distribution.neutral },
        { name: 'Negative', value: audienceData.sentiment.distribution.negative }
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030305] text-[#e2e8f0] tech-grid relative">
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none pulse-light" />
      <div className="absolute bottom-20 right-10 w-[450px] h-[450px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none pulse-light" style={{ animationDelay: '3s' }} />

      {/* 1. SIDEBAR DOCK - FROSTED NEURAL DECK */}
      <aside className="w-full md:w-64 glass-panel flex flex-col justify-between shrink-0 p-5 relative z-10 md:sticky md:top-0 md:h-screen">
        <div>
          {/* Header/Logo */}
          <div className="flex items-center gap-2.5 mb-8 px-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white display-font uppercase">
                Socially
              </span>
              <span className="text-[10px] tracking-wider text-teal-400 font-mono font-bold uppercase mt-[-2px]">
                Intelligent
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-900/60 ml-auto">
              PRO
            </span>
          </div>

          {/* Brand Switcher Card */}
          <div className="relative mb-8">
            <button 
              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 text-sm font-medium"
            >
              <div className="truncate text-left">
                <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-mono">WORKSPACE</span>
                <span className="truncate block mt-0.5 text-white font-semibold">{selectedBrand?.name || 'Select Workspace'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isBrandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 p-1.5 rounded-xl bg-[#09090d] border border-white/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-fade-in">
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBrand(b);
                      setIsBrandDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${selectedBrand?.id === b.id ? 'bg-white/[0.03] text-teal-400 font-semibold' : 'text-gray-400'}`}
                  >
                    {b.name}
                  </button>
                ))}
                <div className="border-t border-white/[0.06] mt-2 pt-2">
                  <button
                    onClick={() => {
                      setIsAddingBrand(true);
                      setIsBrandDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 font-semibold transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Workspace
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'content', label: 'Content Insights', icon: Video },
              { id: 'audience', label: 'Audience Dynamics', icon: Users },
              { id: 'insights', label: 'Cognitive Engine', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${isActive ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Data Source Configuration */}
        <div className="space-y-2 mt-8 pt-5 border-t border-white/[0.06]">
          <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-2 text-center">INTEGRATIONS</span>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold transition duration-300"
          >
            <Youtube className="h-3.5 w-3.5" />
            YouTube Ingestion
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCSV}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] text-xs font-semibold text-gray-300 transition duration-300 disabled:opacity-50"
          >
            {isUploadingCSV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-gray-400" />}
            Upload CSV Source
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVUpload} 
            accept=".csv" 
            className="hidden" 
          />
          {uploadMessage && (
            <p className="text-[10px] text-center text-teal-400 mt-2 bg-teal-950/20 border border-teal-900/50 p-2 rounded-lg font-mono animate-fade-in">{uploadMessage}</p>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-10">
        
        {/* Sleek Minimalist Header */}
        <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent border-b border-white/[0.04] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white display-font tracking-wide uppercase">{activeTab} Metrics</span>
            <span className="text-xs text-white/10 font-light">|</span>
            <span className="text-[10px] text-teal-400 font-mono font-bold tracking-widest uppercase border border-teal-500/20 px-2 py-0.5 rounded-full bg-teal-950/20">
              {selectedBrand?.industry || 'Unspecified Industry'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Time selector with glassy capsule design */}
            <div className="flex bg-white/[0.02] border border-white/[0.04] p-1 rounded-xl text-xs font-medium">
              <button 
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-300 ${timeRange === '7d' ? 'bg-white/[0.08] text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                7d
              </button>
              <button 
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-300 ${timeRange === '30d' ? 'bg-white/[0.08] text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                30d
              </button>
            </div>
            
            {/* Action Refresh Button */}
            <button
              onClick={() => {
                fetchOverviewData();
                fetchContentData();
                fetchAudienceData();
                fetchAIInsight(true);
              }}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-gray-400 hover:text-white hover:border-indigo-500/30 transition-all duration-300"
              title="Sync cognitive models"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Workspace Viewport */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          
          {/* Demo Banner */}
          {(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) && (
            <div className="mb-8 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.02] text-yellow-400 text-xs flex items-center gap-3 animate-fade-in">
              <Info className="h-4.5 w-4.5 shrink-0 text-yellow-500" />
              <div className="leading-relaxed">
                <span className="font-semibold text-white uppercase tracking-wider block text-[10px] mb-0.5">Sandboxed Mode</span>
                Workspace is operating on seed data. To ingest live profiles, configure your Supabase variables in <code>.env.local</code>.
              </div>
            </div>
          )}

          {/* TABS VIEWPORT */}

          {/* ACTIVE TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {isLoadingOverview ? (
                <div className="flex flex-col items-center justify-center py-28 gap-4 animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Fetching payload...</span>
                </div>
              ) : (
                <>
                  {/* Staggered Cards Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { 
                        title: 'Subscribers', 
                        value: overviewData?.kpis?.subscribers?.value?.toLocaleString() || 0,
                        delta: `${overviewData?.kpis?.subscribers?.change >= 0 ? '+' : ''}${overviewData?.kpis?.subscribers?.change?.toLocaleString()} (${overviewData?.kpis?.subscribers?.percentChange}%)`,
                        deltaPositive: overviewData?.kpis?.subscribers?.change >= 0,
                        icon: Users 
                      },
                      { 
                        title: 'Visual Reach', 
                        value: overviewData?.kpis?.views?.value?.toLocaleString() || 0,
                        delta: `+${overviewData?.kpis?.views?.percentChange || 0}% vs last week`,
                        deltaPositive: true,
                        icon: Video 
                      },
                      { 
                        title: 'Cognitive Signals', 
                        value: overviewData?.kpis?.engagements?.value?.toLocaleString() || 0,
                        delta: `+${overviewData?.kpis?.engagements?.percentChange || 0}% vs benchmark`,
                        deltaPositive: true,
                        icon: MessageSquare 
                      },
                      { 
                        title: 'Intelligent Friction', 
                        value: `${overviewData?.kpis?.engagementRate?.value || 0}%`,
                        delta: `+${overviewData?.kpis?.engagementRate?.percentChange || 0}% vs baseline`,
                        deltaPositive: true,
                        icon: TrendingUp 
                      }
                    ].map((kpi, idx) => {
                      const Icon = kpi.icon;
                      return (
                        <div 
                          key={kpi.title} 
                          className={`p-5 rounded-2xl glass-panel glass-panel-hover animate-fade-in stagger-${idx + 1} flex items-center justify-between relative overflow-hidden`}
                        >
                          <div className="relative z-10">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-semibold block">{kpi.title}</span>
                            <h3 className="text-2xl font-bold tracking-tight text-white mt-2 font-display">{kpi.value}</h3>
                            <span className={`text-[10px] font-semibold flex items-center gap-1 mt-2 ${kpi.deltaPositive ? 'text-teal-400' : 'text-rose-400'}`}>
                              <Clock className="h-3 w-3" />
                              {kpi.delta}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-indigo-400 relative z-10">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Staggered Charts Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* views / impressions Area Chart */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-2 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Reach Diagnostics</h4>
                          <span className="text-[10px] text-gray-500">Daily interaction and visual velocity</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overviewData?.timeseries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} className="font-mono" />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} className="font-mono" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                                borderColor: 'rgba(255, 255, 255, 0.06)', 
                                borderRadius: '12px',
                                color: '#FFF',
                                fontSize: '11px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Area type="monotone" dataKey="views" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Subscriber Growth Chart */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-3 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Growth Projection</h4>
                          <span className="text-[10px] text-gray-500">Cumulative workspace network growth</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(14,179,158,0.5)]"></span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={overviewData?.timeseries || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} className="font-mono" />
                            <YAxis stroke="rgba(255,255,255,0.2)" domain={['auto', 'auto']} fontSize={9} className="font-mono" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                                borderColor: 'rgba(255, 255, 255, 0.06)', 
                                borderRadius: '12px',
                                color: '#FFF',
                                fontSize: '11px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Line type="monotone" dataKey="followers" stroke="#0eb39e" strokeWidth={2.5} dot={{ r: 3, stroke: '#0eb39e', strokeWidth: 1 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACTIVE TAB: CONTENT PERFORMANCE */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {isLoadingContent ? (
                <div className="flex flex-col items-center justify-center py-28 gap-4 animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Parsing feeds...</span>
                </div>
              ) : (
                <>
                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel animate-fade-in">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Filter content payload by label, tag, or copy..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full bg-[#08080c] border border-white/[0.04] rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-300 font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-3.5">
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">SORT ORDER</span>
                      <select
                        value={contentSort}
                        onChange={(e) => setContentSort(e.target.value)}
                        className="bg-[#08080c] border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      >
                        <option value="views-desc">Visual Reach: High to Low</option>
                        <option value="views-asc">Visual Reach: Low to High</option>
                        <option value="eng-desc">Interaction Quotient: High to Low</option>
                        <option value="date-desc">Indexed Date: Newest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Content Posts Table */}
                  <div className="rounded-2xl glass-panel overflow-hidden animate-fade-in stagger-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-gray-500 font-mono uppercase tracking-widest bg-white/[0.01]">
                            <th className="p-5 font-semibold">Indexed Resource</th>
                            <th className="p-5 font-semibold">Platform</th>
                            <th className="p-5 font-semibold">Date Indexed</th>
                            <th className="p-5 font-semibold text-right">Reach</th>
                            <th className="p-5 font-semibold text-right">Likes</th>
                            <th className="p-5 font-semibold text-right">Responses</th>
                            <th className="p-5 font-semibold text-center">Friction Quotient</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {sortedPosts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-gray-500 font-medium">No resources located. Modify filter criteria.</td>
                            </tr>
                          ) : (
                            sortedPosts.map((post: any) => (
                              <tr key={post.id} className="hover:bg-white/[0.02] transition-colors duration-300">
                                <td className="p-5 max-w-sm">
                                  <a 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="font-semibold text-white hover:text-indigo-400 hover:underline block truncate flex items-center gap-1.5"
                                  >
                                    {post.content_text}
                                    <ExternalLink className="h-3 w-3 inline text-gray-500 shrink-0" />
                                  </a>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <span className="text-[9px] text-gray-400 bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded font-mono uppercase">
                                      {post.content_type}
                                    </span>
                                    {post.hashtags?.map((tag: string) => (
                                      <span key={tag} className="text-[9px] text-teal-400/80 font-mono">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-5 capitalize">
                                  <span className="inline-flex items-center gap-1.5 text-gray-300 font-semibold">
                                    {post.platform === 'youtube' ? <Youtube className="h-3.5 w-3.5 text-rose-500" /> : <FileText className="h-3.5 w-3.5 text-gray-400" />}
                                    {post.platform}
                                  </span>
                                </td>
                                <td className="p-5 text-gray-400 font-mono">
                                  {new Date(post.posted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </td>
                                <td className="p-5 text-white font-mono font-bold text-right">{post.metrics.views.toLocaleString()}</td>
                                <td className="p-5 text-gray-400 font-mono text-right">{post.metrics.likes.toLocaleString()}</td>
                                <td className="p-5 text-gray-400 font-mono text-right">{post.metrics.comments.toLocaleString()}</td>
                                <td className="p-5 text-center">
                                  <span className="inline-block text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    {post.metrics.engagementRate}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACTIVE TAB: AUDIENCE & SENTIMENT */}
          {activeTab === 'audience' && (
            <div className="space-y-8">
              {isLoadingAudience ? (
                <div className="flex flex-col items-center justify-center py-28 gap-4 animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Deciphering responses...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sentiment Share - Donut Chart */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in flex flex-col justify-between relative overflow-hidden">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sentiment Balance</h4>
                        <span className="text-[10px] text-gray-500">Distribution analysis of user interactions</span>
                      </div>

                      {sentimentDistribution.length > 0 ? (
                        <div className="h-48 flex items-center justify-center relative my-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sentimentDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {sentimentDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                                  borderColor: 'rgba(255, 255, 255, 0.06)', 
                                  borderRadius: '12px',
                                  color: '#FFF',
                                  fontSize: '11px'
                                }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold tracking-tight text-white font-display">
                              {audienceData?.sentiment?.distribution?.positive || 0}%
                            </span>
                            <span className="text-[9px] font-mono font-semibold tracking-wider text-teal-400 uppercase">POS SIGNAL</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-gray-500">No signals registered.</div>
                      )}

                      {/* Legend */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-white/[0.04] pt-4">
                        <div>
                          <span className="block w-2 h-2 rounded-full bg-teal-500 mx-auto mb-1.5 shadow-[0_0_8px_rgba(13,148,136,0.5)]"></span>
                          <span className="text-gray-500 text-[10px] font-semibold">Positive</span>
                          <span className="block text-white font-bold font-mono mt-0.5">{audienceData?.sentiment?.distribution?.positive || 0}%</span>
                        </div>
                        <div>
                          <span className="block w-2 h-2 rounded-full bg-yellow-500 mx-auto mb-1.5 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
                          <span className="text-gray-500 text-[10px] font-semibold">Neutral</span>
                          <span className="block text-white font-bold font-mono mt-0.5">{audienceData?.sentiment?.distribution?.neutral || 0}%</span>
                        </div>
                        <div>
                          <span className="block w-2 h-2 rounded-full bg-red-500 mx-auto mb-1.5 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                          <span className="text-gray-500 text-[10px] font-semibold">Negative</span>
                          <span className="block text-white font-bold font-mono mt-0.5">{audienceData?.sentiment?.distribution?.negative || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Sentiment Score over time */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-2 lg:col-span-2 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sentiment Velocity</h4>
                          <span className="text-[10px] text-gray-500">Temporal variation in positive polarity coefficient</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={audienceData?.sentiment?.timeseries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} className="font-mono" />
                            <YAxis stroke="rgba(255,255,255,0.2)" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]} fontSize={9} className="font-mono" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                                borderColor: 'rgba(255, 255, 255, 0.06)', 
                                borderRadius: '12px',
                                color: '#FFF',
                                fontSize: '11px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Area type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Daily Subscriber Growth Bars */}
                  <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-3 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Daily Acquisition Index</h4>
                        <span className="text-[10px] text-gray-500">Subscribers added per 24 hour interval</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={audienceData?.growth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} className="font-mono" />
                          <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} className="font-mono" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                              borderColor: 'rgba(255, 255, 255, 0.06)', 
                              borderRadius: '12px',
                              color: '#FFF',
                              fontSize: '11px'
                            }} 
                          />
                          <Bar dataKey="change" fill="url(#indigoTealGradient)" radius={[6, 6, 0, 0]}>
                            <defs>
                              <linearGradient id="indigoTealGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#0d9488" />
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACTIVE TAB: COGNITIVE ENGINE (AI INSIGHTS & QA) */}
          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start animate-fade-in">
              {/* Left 3 Cols: AI Markdown Insight */}
              <div className="lg:col-span-3 space-y-6">
                <div className="p-6 rounded-2xl glass-panel relative overflow-hidden border border-indigo-500/10">
                  
                  {/* Glowing Radial Mesh */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.05),transparent_45%)] pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-5 mb-5 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Synthesized Analytical Reports</h4>
                        <p className="text-[9px] text-gray-500">Weekly automated cognitive diagnostics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchAIInsight(true)}
                      disabled={isLoadingAI}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-indigo-500/20 text-xs font-bold transition text-indigo-300 disabled:opacity-50"
                    >
                      {isLoadingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                      Synthesize
                    </button>
                  </div>

                  <div className="relative z-10">
                    {isLoadingAI ? (
                      <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Compiling telemetry...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-xs max-w-none text-gray-300 whitespace-pre-line leading-relaxed text-xs">
                        {aiInsight || "No telemetry aggregated. Initiate synthesize operation to pull cognitive metrics."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 2 Cols: Grounded Chat Assistant */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl glass-panel border border-white/[0.04] h-[580px] flex flex-col overflow-hidden relative">
                  
                  {/* Chat Header */}
                  <div className="p-5 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4.5 w-4.5 text-teal-400" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cognitive Assistant</h4>
                        <p className="text-[9px] text-gray-500">Query platform database directly</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping"></span>
                      <span className="text-[9px] font-mono text-gray-500">LIVE</span>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-br from-indigo-600/80 to-purple-600/80 text-white rounded-tr-none shadow-[0_4px_15px_rgba(99,102,241,0.15)] border border-indigo-500/25' 
                              : 'bg-white/[0.02] border border-white/[0.05] text-gray-300 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isChatSending && (
                      <div className="flex justify-start">
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2 text-gray-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                          Indexing platform metrics...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/[0.04] bg-[#07070a]/30 flex gap-2.5">
                    <input
                      type="text"
                      placeholder="Ask concerning engagement, view spikes, etc..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatSending}
                      className="flex-1 bg-[#08080c] border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 placeholder-gray-600 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isChatSending || !chatInput.trim()}
                      className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 text-white shrink-0"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. MODAL: ADD BRAND (FORM) */}
      {isAddingBrand && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#08080c] p-6 shadow-3xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 display-font">Initialize New Workspace</h3>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <label className="block text-[9px] text-gray-500 font-semibold uppercase tracking-wider font-mono mb-1.5">Workspace Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SociallyIntelligent Lab"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 font-semibold uppercase tracking-wider font-mono mb-1.5">Industry Segment</label>
                <input
                  type="text"
                  placeholder="e.g. AI SaaS, Creative Agency"
                  value={newBrandIndustry}
                  onChange={(e) => setNewBrandIndustry(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingBrand(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-gray-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white text-xs font-semibold transition"
                >
                  Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: CONNECT YOUTUBE */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#08080c] p-6 shadow-3xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-[40px] pointer-events-none" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2 display-font">
              <Youtube className="h-5 w-5 text-rose-500" />
              Configure YouTube Pipe
            </h3>
            <p className="text-[10px] text-gray-500 mb-5 leading-relaxed font-medium">
              Specify channel handle and external identifier. Background workers index engagement matrices daily.
            </p>
            <form onSubmit={handleConnectYouTube} className="space-y-4">
              <div>
                <label className="block text-[9px] text-gray-500 font-semibold uppercase tracking-wider font-mono mb-1.5">Channel Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. @GoogleDeepMind"
                  value={ytChannelHandle}
                  onChange={(e) => setYtChannelHandle(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 font-semibold uppercase tracking-wider font-mono mb-1.5">Channel ID (External ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UCxOQ3DkcsbYNE6H8uQQuVA"
                  value={ytChannelId}
                  onChange={(e) => setYtChannelId(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-gray-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnectingYT}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isConnectingYT && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Establish Pipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
