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
  Youtube, 
  ChevronDown, 
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  Info
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
    { role: 'assistant', text: 'Hi! I am MeltMini AI. Ask me anything about this brand\'s performance, top posts, or growth trends.' }
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
      // Simulate/Trigger API connection
      // In full build, this stores handle & ID in platform_accounts
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Let's trigger a fresh sync
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
        // Refresh all data
        fetchOverviewData();
        fetchContentData();
        fetchAudienceData();
        fetchAIInsight(true);
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setUploadMessage('Upload failed due to network error.');
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
  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];
  const sentimentDistribution = audienceData?.sentiment?.distribution 
    ? [
        { name: 'Positive', value: audienceData.sentiment.distribution.positive },
        { name: 'Neutral', value: audienceData.sentiment.distribution.neutral },
        { name: 'Negative', value: audienceData.sentiment.distribution.negative }
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0B0F] text-[#F3F4F6]">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-r border-[#1E1E24] bg-[#0E0E12] flex flex-col justify-between shrink-0 p-4">
        <div>
          {/* Header/Logo */}
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              MeltMini
            </span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900/50">
              Free Tier
            </span>
          </div>

          {/* Brand Switcher */}
          <div className="relative mb-6">
            <button 
              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#14141A] border border-[#1E1E24] hover:bg-[#1C1C24] transition text-sm font-medium"
            >
              <div className="truncate text-left">
                <span className="block text-[10px] text-gray-500 uppercase font-semibold">Active Brand</span>
                <span className="truncate block mt-0.5">{selectedBrand?.name || 'Loading...'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isBrandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1.5 p-1.5 rounded-lg bg-[#121216] border border-[#1E1E24] shadow-xl">
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBrand(b);
                      setIsBrandDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-md text-xs hover:bg-[#1E1E24] transition ${selectedBrand?.id === b.id ? 'bg-[#1C1C24] text-indigo-400 font-semibold' : 'text-gray-400'}`}
                  >
                    {b.name}
                  </button>
                ))}
                <div className="border-t border-[#1E1E24] mt-1.5 pt-1.5">
                  <button
                    onClick={() => {
                      setIsAddingBrand(true);
                      setIsBrandDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-1.5 p-2 rounded-md text-xs text-indigo-400 hover:bg-[#1E1E24] font-medium transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Brand
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === 'overview' ? 'bg-[#1C1C24] text-indigo-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-[#14141A]'}`}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === 'content' ? 'bg-[#1C1C24] text-indigo-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-[#14141A]'}`}
            >
              <Video className="h-4 w-4" />
              Content Performance
            </button>
            <button
              onClick={() => setActiveTab('audience')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === 'audience' ? 'bg-[#1C1C24] text-indigo-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-[#14141A]'}`}
            >
              <Users className="h-4 w-4" />
              Audience & Sentiment
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === 'insights' ? 'bg-[#1C1C24] text-indigo-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-[#14141A]'}`}
            >
              <Sparkles className="h-4 w-4" />
              AI Insights
            </button>
          </nav>
        </div>

        {/* Brand Ingestion Actions */}
        <div className="space-y-2 mt-6 pt-4 border-t border-[#1E1E24]">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#14141A] border border-indigo-900/30 text-indigo-400 hover:bg-indigo-950/20 text-xs font-semibold transition"
          >
            <Youtube className="h-3.5 w-3.5" />
            Connect YouTube Channel
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCSV}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#14141A] border border-[#1E1E24] hover:bg-[#1C1C24] text-xs font-semibold transition disabled:opacity-50"
          >
            {isUploadingCSV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload Platform CSV
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVUpload} 
            accept=".csv" 
            className="hidden" 
          />
          {uploadMessage && (
            <p className="text-[10px] text-center text-indigo-400 mt-1 truncate bg-indigo-950/20 border border-indigo-900/50 p-1.5 rounded">{uploadMessage}</p>
          )}
        </div>
      </aside>

      {/* 2. MAIN LAYOUT AND TABS */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        {/* Header Bar */}
        <header className="h-16 border-b border-[#1E1E24] px-6 flex items-center justify-between shrink-0 bg-[#0B0B0F]/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm capitalize">{activeTab} Dashboard</span>
            <span className="text-xs text-gray-500 font-normal">|</span>
            <span className="text-xs text-gray-500 font-normal truncate">{selectedBrand?.industry || 'No Industry'}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Selector */}
            <div className="flex bg-[#14141A] border border-[#1E1E24] p-0.5 rounded-lg text-xs">
              <button 
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 rounded-md transition ${timeRange === '7d' ? 'bg-[#1C1C24] text-indigo-400 font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 rounded-md transition ${timeRange === '30d' ? 'bg-[#1C1C24] text-indigo-400 font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
              >
                30 Days
              </button>
            </div>
            
            {/* Refresh */}
            <button
              onClick={() => {
                fetchOverviewData();
                fetchContentData();
                fetchAudienceData();
                fetchAIInsight(true);
              }}
              className="p-2 rounded-lg bg-[#14141A] border border-[#1E1E24] text-gray-400 hover:text-gray-200 hover:bg-[#1C1C24] transition"
              title="Sync metrics and insights"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Viewport */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 relative">
          
          {/* Demo Mode Banner (if Supabase credentials are placeholders) */}
          {(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) && (
            <div className="mb-6 p-3 rounded-lg border border-yellow-900/30 bg-yellow-950/10 text-yellow-500 text-xs flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                <strong>Demo Mode Active:</strong> You are viewing mock performance statistics. To display your live data, define the database environment variables in <code>.env.local</code> and run your Supabase setup.
              </span>
            </div>
          )}

          {/* ACTIVE TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isLoadingOverview ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
              ) : (
                <>
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-[#1E1E24] bg-[#0E0E12] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Subscribers</span>
                        <h3 className="text-2xl font-bold mt-1 text-white">{overviewData?.kpis?.subscribers?.value?.toLocaleString() || 0}</h3>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-1.5 ${overviewData?.kpis?.subscribers?.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <TrendingUp className="h-3 w-3" />
                          {overviewData?.kpis?.subscribers?.change >= 0 ? '+' : ''}{overviewData?.kpis?.subscribers?.change?.toLocaleString()} ({overviewData?.kpis?.subscribers?.percentChange}%)
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#14141A] border border-[#1E1E24] text-indigo-400">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#1E1E24] bg-[#0E0E12] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Video Views</span>
                        <h3 className="text-2xl font-bold mt-1 text-white">{overviewData?.kpis?.views?.value?.toLocaleString() || 0}</h3>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-1.5 ${overviewData?.kpis?.views?.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <TrendingUp className="h-3 w-3" />
                          +{overviewData?.kpis?.views?.percentChange}% vs last week
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#14141A] border border-[#1E1E24] text-indigo-400">
                        <Video className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#1E1E24] bg-[#0E0E12] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Engagements</span>
                        <h3 className="text-2xl font-bold mt-1 text-white">{overviewData?.kpis?.engagements?.value?.toLocaleString() || 0}</h3>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-1.5 ${overviewData?.kpis?.engagements?.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <TrendingUp className="h-3 w-3" />
                          +{overviewData?.kpis?.engagements?.percentChange}% vs last week
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#14141A] border border-[#1E1E24] text-indigo-400">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#1E1E24] bg-[#0E0E12] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Avg Engagement Rate</span>
                        <h3 className="text-2xl font-bold mt-1 text-white">{overviewData?.kpis?.engagementRate?.value || 0}%</h3>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-1.5 ${overviewData?.kpis?.engagementRate?.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <TrendingUp className="h-3 w-3" />
                          +{overviewData?.kpis?.engagementRate?.percentChange}% vs baseline
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#14141A] border border-[#1E1E24] text-indigo-400">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* views / impressions Area Chart */}
                    <div className="p-6 rounded-xl border border-[#1E1E24] bg-[#0E0E12]">
                      <h4 className="text-sm font-semibold mb-4 text-white">Daily Views & Reach</h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overviewData?.timeseries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                            <YAxis stroke="#9CA3AF" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0E0E12', borderColor: '#1E1E24', color: '#FFF' }} />
                            <Area type="monotone" dataKey="views" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Subscriber Growth Chart */}
                    <div className="p-6 rounded-xl border border-[#1E1E24] bg-[#0E0E12]">
                      <h4 className="text-sm font-semibold mb-4 text-white">Subscriber growth (Cumulative)</h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={overviewData?.timeseries || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0E0E12', borderColor: '#1E1E24', color: '#FFF' }} />
                            <Line type="monotone" dataKey="followers" stroke="#A855F7" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
                <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
              ) : (
                <>
                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#1E1E24] bg-[#0E0E12]">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search posts by title or hashtag..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full bg-[#14141A] border border-[#1E1E24] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-semibold shrink-0">Sort By</span>
                      <select
                        value={contentSort}
                        onChange={(e) => setContentSort(e.target.value)}
                        className="bg-[#14141A] border border-[#1E1E24] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="views-desc">Views: High to Low</option>
                        <option value="views-asc">Views: Low to High</option>
                        <option value="eng-desc">Engagement Rate: High to Low</option>
                        <option value="date-desc">Publish Date: Newest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Content Posts Table */}
                  <div className="rounded-xl border border-[#1E1E24] bg-[#0E0E12] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-[#1E1E24] text-gray-500 text-xs font-semibold bg-[#121216]/50">
                            <th className="p-4">Post Info & Title</th>
                            <th className="p-4">Platform</th>
                            <th className="p-4">Date Published</th>
                            <th className="p-4">Views</th>
                            <th className="p-4">Likes</th>
                            <th className="p-4">Comments</th>
                            <th className="p-4">Engagement Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E1E24]">
                          {sortedPosts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-gray-500 text-xs font-medium">No posts matches search filters.</td>
                            </tr>
                          ) : (
                            sortedPosts.map((post: any) => (
                              <tr key={post.id} className="hover:bg-[#14141A]/50 transition">
                                <td className="p-4 max-w-sm">
                                  <a 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="font-medium text-white hover:text-indigo-400 hover:underline block truncate"
                                  >
                                    {post.content_text}
                                  </a>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-[10px] text-gray-500 bg-[#14141A] border border-[#1E1E24] px-1.5 py-0.5 rounded font-mono uppercase">
                                      {post.content_type}
                                    </span>
                                    {post.hashtags?.map((tag: string) => (
                                      <span key={tag} className="text-[10px] text-indigo-400/80">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 capitalize">
                                  <span className="inline-flex items-center gap-1 text-xs">
                                    {post.platform === 'youtube' ? <Youtube className="h-3.5 w-3.5 text-rose-500" /> : <FileText className="h-3.5 w-3.5 text-gray-400" />}
                                    {post.platform}
                                  </span>
                                </td>
                                <td className="p-4 text-xs text-gray-400">
                                  {new Date(post.posted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </td>
                                <td className="p-4 text-white font-mono font-medium">{post.metrics.views.toLocaleString()}</td>
                                <td className="p-4 text-gray-400 font-mono">{post.metrics.likes.toLocaleString()}</td>
                                <td className="p-4 text-gray-400 font-mono">{post.metrics.comments.toLocaleString()}</td>
                                <td className="p-4">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-900/50">
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
            <div className="space-y-6">
              {isLoadingAudience ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sentiment Share - Donut Chart */}
                    <div className="p-6 rounded-xl border border-[#1E1E24] bg-[#0E0E12] flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 text-white">Sentiment distribution</h4>
                        <p className="text-[10px] text-gray-500">Based on recent comment summaries</p>
                      </div>

                      {sentimentDistribution.length > 0 ? (
                        <div className="h-48 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sentimentDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {sentimentDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-gray-500">No sentiment data available.</div>
                      )}

                      {/* Legend */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-[#1E1E24] pt-4 mt-2">
                        <div>
                          <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-1"></span>
                          <span className="text-gray-500">Positive</span>
                          <span className="block text-white font-bold font-mono mt-0.5">{audienceData?.sentiment?.distribution?.positive || 0}%</span>
                        </div>
                        <div>
                          <span className="block w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto mb-1"></span>
                          <span className="text-gray-500">Neutral</span>
                          <span className="block text-white font-bold font-mono mt-0.5">{audienceData?.sentiment?.distribution?.neutral || 0}%</span>
                        </div>
                        <div>
                          <span className="block w-2.5 h-2.5 rounded-full bg-rose-500 mx-auto mb-1"></span>
                          <span className="text-gray-500">Negative</span>
                          <span className="block text-white font-bold font-mono mt-0.5">{audienceData?.sentiment?.distribution?.negative || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Sentiment Score over time */}
                    <div className="p-6 rounded-xl border border-[#1E1E24] bg-[#0E0E12] lg:col-span-2">
                      <h4 className="text-sm font-semibold mb-4 text-white">Sentiment Trend (0.0 to 1.0)</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={audienceData?.sentiment?.timeseries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                            <YAxis stroke="#9CA3AF" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]} fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0E0E12', borderColor: '#1E1E24', color: '#FFF' }} />
                            <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Daily Subscriber Growth Bars */}
                  <div className="p-6 rounded-xl border border-[#1E1E24] bg-[#0E0E12]">
                    <h4 className="text-sm font-semibold mb-4 text-white">Daily Subscriber Growth</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={audienceData?.growth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                          <YAxis stroke="#9CA3AF" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#0E0E12', borderColor: '#1E1E24', color: '#FFF' }} />
                          <Bar dataKey="change" fill="#A855F7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACTIVE TAB: AI INSIGHTS & QA */}
          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {/* Left 3 Cols: AI Markdown Insight */}
              <div className="lg:col-span-3 space-y-6">
                <div className="p-6 rounded-xl border border-[#1E1E24] bg-[#0E0E12] relative overflow-hidden">
                  
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 gradient-glow pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-[#1E1E24] pb-4 mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      <h4 className="text-sm font-semibold text-white">AI Weekly Insights Summary</h4>
                    </div>
                    <button
                      onClick={() => fetchAIInsight(true)}
                      disabled={isLoadingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14141A] border border-[#1E1E24] hover:bg-[#1C1C24] text-xs font-semibold transition text-indigo-400 disabled:opacity-50"
                    >
                      {isLoadingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                      Regenerate
                    </button>
                  </div>

                  <div className="relative z-10">
                    {isLoadingAI ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="text-xs text-gray-500 font-medium">Analyzing dashboard metrics...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-xs max-w-none text-gray-300 space-y-4 whitespace-pre-line leading-relaxed">
                        {aiInsight || "No insights compiled yet. Press Regenerate to fetch your first AI performance report."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 2 Cols: Grounded Chat Assistant */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-[#1E1E24] bg-[#0E0E12] h-[550px] flex flex-col overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-[#1E1E24] bg-[#121216]/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">Ask MeltMini AI</h4>
                      <p className="text-[10px] text-gray-500">Grounded strictly in historical stats</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-[#14141A] border border-[#1E1E24] text-gray-300 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isChatSending && (
                      <div className="flex justify-start">
                        <div className="bg-[#14141A] border border-[#1E1E24] rounded-xl rounded-tl-none p-3 text-xs flex items-center gap-1.5 text-gray-400">
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                          Consulting metrics payload...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-[#1E1E24] bg-[#121216]/30 flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Which video had the highest engagement?"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatSending}
                      className="flex-1 bg-[#14141A] border border-[#1E1E24] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isChatSending || !chatInput.trim()}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 text-white shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1E1E24] bg-[#0E0E12] p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-4">Create New Brand</h3>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-[#14141A] border border-[#1E1E24] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Industry</label>
                <input
                  type="text"
                  placeholder="e.g. SaaS, E-commerce"
                  value={newBrandIndustry}
                  onChange={(e) => setNewBrandIndustry(e.target.value)}
                  className="w-full bg-[#14141A] border border-[#1E1E24] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBrand(false)}
                  className="px-4 py-2 rounded-lg bg-[#14141A] border border-[#1E1E24] text-gray-400 hover:text-gray-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                >
                  Create Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: CONNECT YOUTUBE */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1E1E24] bg-[#0E0E12] p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Youtube className="h-5 w-5 text-rose-500" />
              Connect YouTube Channel
            </h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
              Input the handle and channel ID. Once connected, MeltMini's background sync will fetch channel aggregates and video stats daily.
            </p>
            <form onSubmit={handleConnectYouTube} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Channel Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. @MrBeast"
                  value={ytChannelHandle}
                  onChange={(e) => setYtChannelHandle(e.target.value)}
                  className="w-full bg-[#14141A] border border-[#1E1E24] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">Channel ID (External ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UCX6OQ3DkcsbYNE6H8uQQuVA"
                  value={ytChannelId}
                  onChange={(e) => setYtChannelId(e.target.value)}
                  className="w-full bg-[#14141A] border border-[#1E1E24] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#14141A] border border-[#1E1E24] text-gray-400 hover:text-gray-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnectingYT}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
                >
                  {isConnectingYT && <Loader2 className="h-3 w-3 animate-spin" />}
                  Connect Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
