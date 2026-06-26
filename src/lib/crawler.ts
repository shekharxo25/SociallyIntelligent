interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function crawlBrandMentions(brandName: string): Promise<SearchResult[]> {
  // Queries targeting major social spaces and news
  const queries = [
    `"${brandName}" site:reddit.com`,
    `"${brandName}" site:youtube.com`,
    `"${brandName}" site:twitter.com`,
    `"${brandName}" site:news.ycombinator.com`,
    `"${brandName}" news`
  ];
  
  const results: SearchResult[] = [];
  
  for (const q of queries) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (!res.ok) continue;
      
      const html = await res.text();
      
      // Parse results using string splits and regex
      const resultBlocks = html.split('<div class="result results_links');
      
      let qCount = 0;
      for (let i = 1; i < resultBlocks.length; i++) {
        const block = resultBlocks[i];
        
        // Extract URL and Title
        const aMatch = block.match(/<a class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
        if (!aMatch) continue;
        
        let linkUrl = aMatch[1];
        // Clean DuckDuckGo redirect wrapper links
        if (linkUrl.includes('uddg=')) {
          const uParam = linkUrl.split('uddg=')[1]?.split('&')[0];
          if (uParam) {
            linkUrl = decodeURIComponent(uParam);
          }
        }
        
        const title = aMatch[2].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
        
        // Extract Snippet
        const sMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
        const snippet = sMatch ? sMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim() : '';
        
        results.push({
          title,
          url: linkUrl,
          snippet
        });
        
        qCount++;
        // Grab top 4 results per query to keep payload compact and highly relevant
        if (qCount >= 4) break;
      }
    } catch (err) {
      console.error(`Failed to fetch DDG query "${q}":`, err);
    }
  }
  
  return results;
}
