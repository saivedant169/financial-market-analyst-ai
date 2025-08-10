// Market Data Service - Real-time stock data
class MarketDataService {
  constructor() {
    // API keys
    this.alphaVantageKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
    this.polygonKey = process.env.REACT_APP_POLYGON_KEY;
    this.finnhubKey = process.env.REACT_APP_FINNHUB_KEY;
    
    // Cache for API rate limiting
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  async getRealTimeStockData(symbol) {
    // Check cache first
    const cacheKey = `quote_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      if (this.alphaVantageKey) {
        const data = await this.fetchAlphaVantageData(symbol);
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else {
        // Fallback to free APIs or mock data with realistic variation
        return this.generateRealisticMockData(symbol);
      }
    } catch (error) {
      console.error('Market Data Error:', error);
      // Return mock data with realistic variation as fallback
      return this.generateRealisticMockData(symbol);
    }
  }

  async fetchAlphaVantageData(symbol) {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
    );
    const data = await response.json();
    
    // Check for rate limit or error messages
    if (data['Information']) {
      throw new Error('Rate limit exceeded - using simulated data');
    }
    
    if (data['Error Message']) {
      throw new Error(`API Error: ${data['Error Message']}`);
    }
    
    if (data['Note']) {
      throw new Error(`API Note: ${data['Note']}`);
    }
    
    return this.parseAlphaVantageData(data);
  }

  async getCompanyFundamentals(symbol) {
    try {
      // Using Finnhub API
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${this.finnhubKey}`
      );
      const data = await response.json();
      
      return this.parseFundamentals(data);
    } catch (error) {
      console.error('Fundamentals Error:', error);
      throw new Error('Failed to fetch fundamentals');
    }
  }

  async getSECFilings(symbol) {
    try {
      // Using SEC EDGAR API (free)
      const response = await fetch(
        `https://data.sec.gov/submissions/CIK${symbol}.json`,
        {
          headers: {
            'User-Agent': 'Financial Analyst AI (contact@example.com)'
          }
        }
      );
      const data = await response.json();
      
      return this.parseSECData(data);
    } catch (error) {
      console.error('SEC Data Error:', error);
      throw new Error('Failed to fetch SEC filings');
    }
  }

  async getNewsAndSentiment(symbol) {
    try {
      // Using News API or Finnhub news
      const response = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2025-07-01&to=2025-08-10&token=${this.finnhubKey}`
      );
      const news = await response.json();
      
      // Get sentiment analysis
      const sentimentResponse = await fetch(
        `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${this.finnhubKey}`
      );
      const sentiment = await sentimentResponse.json();
      
      return {
        news: this.parseNews(news),
        sentiment: this.parseSentiment(sentiment)
      };
    } catch (error) {
      console.error('News/Sentiment Error:', error);
      throw new Error('Failed to fetch news and sentiment');
    }
  }

  parseAlphaVantageData(data) {
    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('Invalid response format');
    }
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: new Date().toISOString()
    };
  }

  generateRealisticMockData(symbol) {
    // Base prices for major stocks (approximate recent values)
    const basePrices = {
      'AAPL': 180,
      'MSFT': 415,
      'NVDA': 450,
      'GOOGL': 140,
      'META': 500,
      'AMZN': 140,
      'TSLA': 240,
      'BRK.B': 430,
      'JPM': 185,
      'V': 245
    };

    const basePrice = basePrices[symbol] || 100;
    
    // Generate realistic random variation (-3% to +3%)
    const variation = (Math.random() - 0.5) * 0.06;
    const currentPrice = basePrice * (1 + variation);
    
    // Generate daily change (-2% to +2%)
    const dailyChange = (Math.random() - 0.5) * 0.04;
    const change = currentPrice * dailyChange;
    const changePercent = dailyChange * 100;
    
    // Generate volume (realistic ranges)
    const baseVolume = symbol === 'AAPL' ? 50000000 : 
                      symbol === 'NVDA' ? 25000000 : 
                      symbol === 'MSFT' ? 30000000 : 20000000;
    const volume = Math.floor(baseVolume * (0.5 + Math.random()));
    
    return {
      symbol,
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      high: Math.round((currentPrice * 1.02) * 100) / 100,
      low: Math.round((currentPrice * 0.98) * 100) / 100,
      open: Math.round((currentPrice * (1 - dailyChange * 0.5)) * 100) / 100,
      previousClose: Math.round((currentPrice - change) * 100) / 100,
      timestamp: new Date().toISOString(),
      isLive: false, // This is simulated data
      source: 'Simulated (Rate Limited)'
    };
  }

  // Batch fetch multiple stocks efficiently
  async getBatchStockData(symbols) {
    const promises = symbols.map(symbol => this.getRealTimeStockData(symbol));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { symbol: symbols[index], data: result.value, error: null };
      } else {
        return { 
          symbol: symbols[index], 
          data: this.generateRealisticMockData(symbols[index]), 
          error: result.reason.message 
        };
      }
    });
  }

  parseFundamentals(data) {
    return {
      peRatio: data.metric?.peNormalizedAnnual,
      pbRatio: data.metric?.pbAnnual,
      marketCap: data.metric?.marketCapitalization,
      roe: data.metric?.roeRfy,
      roa: data.metric?.roaRfy,
      debtToEquity: data.metric?.totalDebt2TotalEquityAnnual,
      currentRatio: data.metric?.currentRatioAnnual,
      revenueGrowth: data.metric?.revenueGrowthTTMYoy,
      epsGrowth: data.metric?.epsGrowthTTMYoy
    };
  }

  parseSECData(data) {
    return {
      filings: data.filings?.recent || [],
      company: {
        name: data.name,
        cik: data.cik,
        sic: data.sic,
        sicDescription: data.sicDescription,
        exchanges: data.exchanges
      }
    };
  }

  parseNews(news) {
    return news.slice(0, 10).map(article => ({
      headline: article.headline,
      summary: article.summary,
      url: article.url,
      source: article.source,
      datetime: new Date(article.datetime * 1000),
      sentiment: article.sentiment
    }));
  }

  parseSentiment(sentiment) {
    return {
      buzz: sentiment.buzz,
      sentiment: sentiment.sentiment,
      companyNewsScore: sentiment.companyNewsScore,
      sectorAverageNewsScore: sentiment.sectorAverageNewsScore
    };
  }
}

export default MarketDataService;
