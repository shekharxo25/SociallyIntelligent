'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Plus, 
  RotateCw, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Video, 
  ChevronDown, 
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  Info,
  ExternalLink,
  MessageCircle,
  Globe,
  Radio,
  FileSearch,
  CheckCircle2,
  TrendingDown,
  Clock,
  Bot
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

// Custom YouTube Icon SVG
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
  // Hydration state
  const [isMounted, setIsMounted] = useState(false);

  // Brand States
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  
  // Audit Modal/Form
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditBrandName, setAuditBrandName] = useState('');
  const [auditIndustry, setAuditIndustry] = useState('');
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  // Dashboard Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'mentions' | 'audience' | 'insights'>('overview');
  const [timeRange, setTimeRange] = useState('7d');

  // API Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [mentionsData, setMentionsData] = useState<any>(null);
  const [audienceData, setAudienceData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // Loading States
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // AI Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', text: 'Welcome! I am your SociallyIntelligent assistant. Ask me anything about your brand\'s sentiment, customer opinions, or suggestions to improve perception.' }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Search/Filters for Mentions
  const [mentionsSearch, setMentionsSearch] = useState('');
  const [mentionsFilterPlatform, setMentionsFilterPlatform] = useState('all');
  const [mentionsFilterSentiment, setMentionsFilterSentiment] = useState('all');
  const [mentionsSort, setMentionsSort] = useState('date-desc');

  // Load initial brands
  useEffect(() => {
    setIsMounted(true);
    fetchBrands();
  }, []);

  // Fetch data when brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchOverviewData();
      fetchMentionsData();
      fetchAudienceData();
      fetchAIInsight();
    }
  }, [selectedBrand, timeRange]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchBrands = async (selectNewId?: string) => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(data);
      if (data.length > 0) {
        if (selectNewId) {
          const match = data.find((b: any) => b.id === selectNewId);
          setSelectedBrand(match || data[0]);
        } else if (!selectedBrand) {
          setSelectedBrand(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const handleAuditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditBrandName.trim()) return;

    setIsAuditing(true);
    setAuditSuccess(null);

    try {
      const res = await fetch('/api/brands/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: auditBrandName, industry: auditIndustry }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuditSuccess(`Audit complete! Crawled ${data.mentionsCount} mentions.`);
        await fetchBrands(data.brandId);
        setAuditBrandName('');
        setAuditIndustry('');
        setTimeout(() => setAuditSuccess(null), 3000);
      } else {
        setAuditSuccess(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Audit failed:', err);
      setAuditSuccess('Audit sweep failed.');
    } finally {
      setIsAuditing(false);
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

  const fetchMentionsData = async () => {
    if (!selectedBrand) return;
    setIsLoadingMentions(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/content?range=${timeRange}`);
      const data = await res.json();
      setMentionsData(data);
    } catch (err) {
      console.error('Mentions fetch error:', err);
    } finally {
      setIsLoadingMentions(false);
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
      
      if (data.raw_json?.recommendations) {
        setRecommendations(data.raw_json.recommendations);
      } else {
        setRecommendations([
          { category: 'reach', recommendation_text: `Increase your presence on Reddit. There is active discussion regarding ${selectedBrand.name} in r/startups and r/saas, but no official team response.`, priority: 'high' },
          { category: 'sentiment', recommendation_text: `Address setup friction. Updating the onboarding documentation or adding check-in guides will reduce installation timeout errors.`, priority: 'medium' },
          { category: 'branding', recommendation_text: `Highlight dashboard visual design. Share build-in-public design snapshots to drive X engagement.`, priority: 'low' }
        ]);
      }
    } catch (err) {
      console.error('AI insight error:', err);
    } finally {
      setIsLoadingAI(false);
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
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Error querying AI agent.' }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Filter & Sort Mentions
  const filteredMentions = mentionsData?.posts?.filter((m: any) => {
    const matchesSearch = m.content_text?.toLowerCase().includes(mentionsSearch.toLowerCase()) ||
                          m.author?.toLowerCase().includes(mentionsSearch.toLowerCase());
    const matchesPlatform = mentionsFilterPlatform === 'all' || m.platform === mentionsFilterPlatform;
    const matchesSentiment = mentionsFilterSentiment === 'all' || m.sentiment === mentionsFilterSentiment;
    return matchesSearch && matchesPlatform && matchesSentiment;
  }) || [];

  const sortedMentions = [...filteredMentions].sort((a: any, b: any) => {
    if (mentionsSort === 'date-desc') return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
    if (mentionsSort === 'sentiment-desc') return b.sentiment_score - a.sentiment_score;
    if (mentionsSort === 'sentiment-asc') return a.sentiment_score - b.sentiment_score;
    return 0;
  });

  // Recharts parameters
  const COLORS = ['#0d9488', '#eab308', '#ef4444'];
  const sentimentDistribution = audienceData?.sentiment?.distribution 
    ? [
        { name: 'Positive', value: audienceData.sentiment.distribution.positive },
        { name: 'Neutral', value: audienceData.sentiment.distribution.neutral },
        { name: 'Negative', value: audienceData.sentiment.distribution.negative }
      ]
    : [];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit': return <MessageCircle className="h-3.5 w-3.5 text-orange-500" />;
      case 'youtube': return <Youtube className="h-3.5 w-3.5 text-rose-500" />;
      case 'x': return <span className="font-bold text-[10px] text-gray-400 font-mono">X</span>;
      case 'blogs': return <FileText className="h-3.5 w-3.5 text-sky-400" />;
      case 'news': return <Globe className="h-3.5 w-3.5 text-emerald-400" />;
      default: return <Radio className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  // Safe client render guard
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center tech-grid">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Initializing Interface...</span>
        </div>
      </div>
    );
  }

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
              AGENT
            </span>
          </div>

          {/* Brand Switcher Card */}
          <div className="relative mb-8">
            <button 
              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 text-sm font-medium"
            >
              <div className="truncate text-left">
                <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-mono">AUDITED BRAND</span>
                <span className="truncate block mt-0.5 text-white font-semibold">{selectedBrand?.name || 'Create Brand...'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isBrandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 p-1.5 rounded-xl bg-[#09090d] border border-white/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-fade-in">
                {brands.length === 0 ? (
                  <p className="text-[10px] text-gray-500 p-2 text-center">No brands audited yet</p>
                ) : (
                  brands.map((b) => (
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
                  ))
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview Audit', icon: BarChart3 },
              { id: 'mentions', label: 'Mentions Explorer', icon: MessageSquare },
              { id: 'audience', label: 'Platforms & Buzz', icon: Radio },
              { id: 'insights', label: 'AI Suggestions', icon: Sparkles }
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
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-10">
        
        {/* Sleek Minimalist Header */}
        <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent border-b border-white/[0.04] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white display-font tracking-wide uppercase">
              {activeTab === 'mentions' ? 'Mentions' : activeTab} Metrics
            </span>
            <span className="text-xs text-white/10 font-light">|</span>
            <span className="text-[10px] text-teal-400 font-mono font-bold tracking-widest uppercase border border-teal-500/20 px-2.5 py-0.5 rounded-full bg-teal-950/20">
              Active Audit: {selectedBrand?.name || 'None'}
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
                fetchMentionsData();
                fetchAudienceData();
                fetchAIInsight(true);
              }}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-gray-400 hover:text-white hover:border-indigo-500/30 transition-all duration-300"
              title="Recrawl brand listening parameters"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Workspace Viewport */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          
          {/* Keyless Mode Alert */}
          {(!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) && (
            <div className="mb-6 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.02] text-yellow-400 text-xs flex items-center gap-3 animate-fade-in">
              <Info className="h-4.5 w-4.5 shrink-0 text-yellow-500" />
              <div className="leading-relaxed">
                <span className="font-semibold text-white uppercase tracking-wider block text-[10px] mb-0.5">Demo Mode Sandbox</span>
                GEMINI_API_KEY is not defined. We are simulating context-specific social listening mentions and recommendations. Populate the env variable to query actual Gemini models!
              </div>
            </div>
          )}

          {/* Audit Brand Search Bar - Above and in the Middle */}
          <div className="max-w-2xl mx-auto mb-8 p-5 rounded-2xl glass-panel border border-indigo-500/10 relative overflow-hidden animate-fade-in">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03),transparent_60%)] pointer-events-none" />
            
            <form onSubmit={handleAuditBrand} className="w-full flex flex-col sm:flex-row items-center gap-3 relative z-10">
              <div className="relative w-full sm:flex-1">
                <FileSearch className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  required
                  disabled={isAuditing}
                  placeholder="Brand Name to Audit (e.g. Supabase)"
                  value={auditBrandName}
                  onChange={(e) => setAuditBrandName(e.target.value)}
                  className="w-full bg-[#08080c] border border-white/[0.04] rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-300 font-semibold"
                />
              </div>
              
              <input
                type="text"
                disabled={isAuditing}
                placeholder="Industry (e.g. Tech)"
                value={auditIndustry}
                onChange={(e) => setAuditIndustry(e.target.value)}
                className="w-full sm:w-44 bg-[#08080c] border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-300 font-semibold"
              />
              
              <button
                type="submit"
                disabled={isAuditing || !auditBrandName.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Auditing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Audit Brand
                  </>
                )}
              </button>
            </form>
            
            {auditSuccess && (
              <p className="text-[10px] text-center text-teal-400 mt-3 bg-teal-950/20 border border-teal-900/50 px-3.5 py-2 rounded-lg font-mono animate-fade-in">
                {auditSuccess}
              </p>
            )}
          </div>

          {/* ACTIVE TAB: OVERVIEW AUDIT */}
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
                        title: 'Total Web Mentions', 
                        value: overviewData?.kpis?.mentions?.value || 0,
                        delta: `+${overviewData?.kpis?.mentions?.change || 0} new posts this week`,
                        deltaPositive: true,
                        icon: MessageSquare 
                      },
                      { 
                        title: 'Average Net Sentiment', 
                        value: `${overviewData?.kpis?.avgSentiment?.value || 50}%`,
                        delta: 'Healthy reputation index',
                        deltaPositive: true,
                        icon: Sparkles 
                      },
                      { 
                        title: 'Primary Buzz Channel', 
                        value: overviewData?.kpis?.primaryPlatform?.value || 'Reddit',
                        delta: 'Platform with highest count',
                        deltaPositive: true,
                        icon: Radio 
                      },
                      { 
                        title: 'Weekly Buzz Level', 
                        value: overviewData?.kpis?.buzzIndex?.value || 'Low',
                        delta: 'Mentions velocity check',
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
                              <CheckCircle2 className="h-3 w-3" />
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
                    {/* Mentions Area Chart */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-2 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Daily Crawled Mentions Volume</h4>
                          <span className="text-[10px] text-gray-500">Daily interaction and visual velocity</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overviewData?.timeseries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
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
                            <Area type="monotone" dataKey="mentions" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorMentions)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Net Sentiment Timeseries */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-3 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Daily Sentiment Index Trend</h4>
                          <span className="text-[10px] text-gray-500">Temporal variation in reputation polarity</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(14,179,158,0.5)]"></span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={overviewData?.timeseries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            <Line type="monotone" dataKey="sentiment" stroke="#0eb39e" strokeWidth={2.5} dot={{ r: 3, stroke: '#0eb39e', strokeWidth: 1 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACTIVE TAB: MENTIONS EXPLORER */}
          {activeTab === 'mentions' && (
            <div className="space-y-6">
              {isLoadingMentions ? (
                <div className="flex flex-col items-center justify-center py-28 gap-4 animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Scanning nodes...</span>
                </div>
              ) : (
                <>
                  {/* Search and Filters Bar */}
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl glass-panel animate-fade-in">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search crawled mentions by username or keywords..."
                        value={mentionsSearch}
                        onChange={(e) => setMentionsSearch(e.target.value)}
                        className="w-full bg-[#08080c] border border-white/[0.04] rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-300 font-medium"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <select
                          value={mentionsFilterPlatform}
                          onChange={(e) => setMentionsFilterPlatform(e.target.value)}
                          className="bg-[#08080c] border border-white/[0.04] rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        >
                          <option value="all">All Platforms</option>
                          <option value="reddit">Reddit</option>
                          <option value="youtube">YouTube</option>
                          <option value="x">X</option>
                          <option value="blogs">Blogs</option>
                          <option value="news">News</option>
                        </select>
                      </div>

                      <div>
                        <select
                          value={mentionsFilterSentiment}
                          onChange={(e) => setMentionsFilterSentiment(e.target.value)}
                          className="bg-[#08080c] border border-white/[0.04] rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        >
                          <option value="all">All Sentiments</option>
                          <option value="positive">Positive</option>
                          <option value="neutral">Neutral</option>
                          <option value="negative">Negative</option>
                        </select>
                      </div>

                      <div>
                        <select
                          value={mentionsSort}
                          onChange={(e) => setMentionsSort(e.target.value)}
                          className="bg-[#08080c] border border-white/[0.04] rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        >
                          <option value="date-desc">Newest First</option>
                          <option value="sentiment-desc">Sentiment: High to Low</option>
                          <option value="sentiment-asc">Sentiment: Low to High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mentions Table Feed */}
                  <div className="rounded-2xl glass-panel overflow-hidden animate-fade-in stagger-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-gray-500 font-mono uppercase tracking-widest bg-white/[0.01]">
                            <th className="p-5 font-semibold">Mention & Content</th>
                            <th className="p-5 font-semibold">Platform</th>
                            <th className="p-5 font-semibold">Author</th>
                            <th className="p-5 font-semibold">Date Crawled</th>
                            <th className="p-5 font-semibold">Sentiment Index</th>
                            <th className="p-5 font-semibold">Sentiment Badge</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {sortedMentions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-10 text-center text-gray-500 font-medium">No mentions found matching the active filters.</td>
                            </tr>
                          ) : (
                            sortedMentions.map((m: any) => (
                              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors duration-300">
                                <td className="p-5 max-w-lg">
                                  <p className="text-gray-200 text-xs leading-relaxed italic">&ldquo;{m.content_text}&rdquo;</p>
                                  <div className="mt-2.5">
                                    <a 
                                      href={m.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
                                    >
                                      View Original Link
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                </td>
                                <td className="p-5 capitalize">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                                    {getPlatformIcon(m.platform)}
                                    {m.platform}
                                  </span>
                                </td>
                                <td className="p-5 text-gray-300 font-semibold">{m.author}</td>
                                <td className="p-5 text-gray-400 font-mono">
                                  {new Date(m.posted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </td>
                                <td className="p-5 font-mono text-white font-bold">{(m.sentiment_score * 100).toFixed(0)}%</td>
                                <td className="p-5">
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                    m.sentiment === 'positive' ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 
                                    m.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 
                                    'bg-white/[0.02] text-gray-400 border-white/[0.04]'
                                  }`}>
                                    {m.sentiment}
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

          {/* ACTIVE TAB: PLATFORMS & BUZZ */}
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
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Web Sentiment Summary</h4>
                        <span className="text-[10px] text-gray-500">Aggregate perception score distribution</span>
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
                        <div className="h-48 flex items-center justify-center text-xs text-gray-500">No sentiment parameters parsed.</div>
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

                    {/* Mentions Share Chart */}
                    <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-2 lg:col-span-2 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Mentions Breakdown by Platform</h4>
                          <span className="text-[10px] text-gray-500">Volumetric share of discussions</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={mentionsData?.posts?.reduce((acc: any[], cur: any) => {
                            const match = acc.find(a => a.name === cur.platform);
                            if (match) match.value += 1;
                            else acc.push({ name: cur.platform, value: 1 });
                            return acc;
                          }, []) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} className="capitalize font-mono" />
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
                            <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Daily Mentions volume bars */}
                  <div className="p-6 rounded-2xl glass-panel animate-fade-in stagger-3 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Daily Crawled Volume (Velocity)</h4>
                        <span className="text-[10px] text-gray-500">Crawled mentions added per 24 hour interval</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-teal-400"></span>
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

          {/* ACTIVE TAB: AI SUGGESTIONS */}
          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start animate-fade-in">
              {/* Left 3 Cols: AI Markdown Audit Summary & Recommendations */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. Markdown summary */}
                <div className="p-6 rounded-2xl glass-panel relative overflow-hidden border border-indigo-500/10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.05),transparent_45%)] pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-5 mb-5 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Web Listening Brand Audit</h4>
                        <p className="text-[9px] text-gray-500">Weekly automated cognitive diagnostics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchAIInsight(true)}
                      disabled={isLoadingAI}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-indigo-500/20 text-xs font-bold transition text-indigo-300 disabled:opacity-50"
                    >
                      {isLoadingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                      Regenerate
                    </button>
                  </div>

                  <div className="relative z-10">
                    {isLoadingAI ? (
                      <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Analyzing crawled mentions...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-xs max-w-none text-gray-300 whitespace-pre-line leading-relaxed text-xs">
                        {aiInsight || "Launch an audit search in the sidebar to generate AI reports."}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Structured recommendations */}
                <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-5">Actionable Social Media Audit Actions</h4>
                  
                  <div className="space-y-3">
                    {recommendations.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-8">No suggestions generated yet.</p>
                    ) : (
                      recommendations.map((rec: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] flex items-start gap-4 justify-between hover:border-white/[0.08] transition-all duration-300"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider font-mono">
                              Category: {rec.category}
                            </span>
                            <p className="text-xs text-gray-300 leading-relaxed font-normal">
                              {rec.recommendation_text}
                            </p>
                          </div>
                          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 font-mono ${
                            rec.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            rec.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                      ))
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
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Grounded Audit Assistant</h4>
                        <p className="text-[9px] text-gray-500">Ask about crawled opinions & topics</p>
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
                          Consulting audit data...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/[0.04] bg-[#07070a]/30 flex gap-2.5">
                    <input
                      type="text"
                      placeholder="e.g., What are users complaining about?"
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

    </div>
  );
}
