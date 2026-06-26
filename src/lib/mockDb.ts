interface Brand {
  id: string;
  name: string;
  industry: string;
  created_at: string;
}

interface Mention {
  id: string;
  platform: string;
  url: string;
  content_text: string;
  posted_at: string;
  author: string;
  sentiment: string;
  sentiment_score: number;
}

interface Recommendation {
  category: string;
  recommendation_text: string;
  priority: string;
}

interface MockDb {
  brands: Brand[];
  mentions: Record<string, Mention[]>;
  recommendations: Record<string, Recommendation[]>;
  aiInsights: Record<string, Record<string, string>>;
}

const globalForMockDb = global as unknown as { mockDb: MockDb };

if (!globalForMockDb.mockDb) {
  globalForMockDb.mockDb = {
    brands: [],
    mentions: {},
    recommendations: {},
    aiInsights: {},
  };
}

export const mockDb = {
  getBrands: (): Brand[] => {
    return globalForMockDb.mockDb.brands;
  },
  
  getBrand: (id: string): Brand | undefined => {
    return globalForMockDb.mockDb.brands.find(b => b.id === id);
  },

  addBrand: (name: string, industry: string): Brand => {
    // Check if brand name already exists
    const existing = globalForMockDb.mockDb.brands.find(
      b => b.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newBrand: Brand = {
      id: 'mock-brand-' + Math.random().toString(36).substring(2, 9),
      name,
      industry: industry || 'General',
      created_at: new Date().toISOString(),
    };
    globalForMockDb.mockDb.brands.push(newBrand);
    return newBrand;
  },

  getMentions: (brandId: string): Mention[] => {
    return globalForMockDb.mockDb.mentions[brandId] || [];
  },

  setMentions: (brandId: string, mentions: any[]): void => {
    globalForMockDb.mockDb.mentions[brandId] = mentions.map((m, index) => ({
      id: m.id || `mention-${brandId}-${index}-${Math.random().toString(36).substring(2, 5)}`,
      platform: m.platform,
      url: m.url || '#',
      content_text: m.content_text,
      posted_at: m.posted_at || m.date || new Date().toISOString(),
      author: m.author || 'Anonymous',
      sentiment: m.sentiment || 'neutral',
      sentiment_score: typeof m.sentiment_score === 'number' ? m.sentiment_score : 0.5,
    }));
  },

  getRecommendations: (brandId: string): Recommendation[] => {
    return globalForMockDb.mockDb.recommendations[brandId] || [];
  },

  setRecommendations: (brandId: string, recommendations: Recommendation[]): void => {
    globalForMockDb.mockDb.recommendations[brandId] = recommendations;
  },

  getAiInsights: (brandId: string, scope: string): string => {
    return globalForMockDb.mockDb.aiInsights[brandId]?.[scope] || '';
  },

  setAiInsights: (brandId: string, scope: string, insight: string): void => {
    if (!globalForMockDb.mockDb.aiInsights[brandId]) {
      globalForMockDb.mockDb.aiInsights[brandId] = {};
    }
    globalForMockDb.mockDb.aiInsights[brandId][scope] = insight;
  }
};
