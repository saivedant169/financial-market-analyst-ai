// News and Market Alerts Service - Real-time market news and alerts
class NewsService {
  constructor() {
    this.alphaVantageKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
    this.finnhubKey = process.env.REACT_APP_FINNHUB_KEY;
    this.newsApiKey = process.env.REACT_APP_NEWS_API_KEY;
    
    // Cache for rate limiting
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes for news
  }

  async getMarketAlerts() {
    const cacheKey = 'market_alerts';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      let alerts = [];
      
      // Try multiple sources for comprehensive alerts
      if (this.alphaVantageKey) {
        const avNews = await this.fetchAlphaVantageNews();
        alerts = [...alerts, ...avNews];
      }
      
      if (this.finnhubKey) {
        const finnhubNews = await this.fetchFinnhubNews();
        alerts = [...alerts, ...finnhubNews];
      }
      
      // If no API keys, generate realistic mock alerts
      if (alerts.length === 0) {
        alerts = this.generateRealisticMarketAlerts();
      }
      
      // Sort by time and limit to most recent
      alerts = alerts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      this.cache.set(cacheKey, { data: alerts, timestamp: Date.now() });
      return alerts;
      
    } catch (error) {
      console.error('News Service Error:', error);
      return this.generateRealisticMarketAlerts();
    }
  }

  async fetchAlphaVantageNews() {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${this.alphaVantageKey}`
      );
      const data = await response.json();
      
      if (data.feed) {
        return data.feed.slice(0, 5).map(article => ({
          id: article.url,
          title: this.createAlertFromNews(article.title, article.ticker_sentiment),
          type: this.determineAlertType(article.overall_sentiment_score),
          timestamp: new Date(article.time_published),
          source: 'Alpha Vantage',
          isLive: true
        }));
      }
      return [];
    } catch (error) {
      console.error('Alpha Vantage news error:', error);
      return [];
    }
  }

  async fetchFinnhubNews() {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${this.finnhubKey}`
      );
      const data = await response.json();
      
      return data.slice(0, 5).map(article => ({
        id: article.id,
        title: this.createAlertFromNews(article.headline),
        type: this.determineAlertTypeFromHeadline(article.headline),
        timestamp: new Date(article.datetime * 1000),
        source: 'Finnhub',
        isLive: true
      }));
    } catch (error) {
      console.error('Finnhub news error:', error);
      return [];
    }
  }

  createAlertFromNews(headline, tickerSentiment = null) {
    // Extract key information and create alert-style title
    const title = headline.substring(0, 80);
    
    if (tickerSentiment && tickerSentiment.length > 0) {
      const mainTicker = tickerSentiment[0];
      const sentiment = parseFloat(mainTicker.ticker_sentiment_score);
      if (sentiment > 0.2) {
        return `${mainTicker.ticker} showing bullish momentum - ${title}`;
      } else if (sentiment < -0.2) {
        return `${mainTicker.ticker} facing bearish pressure - ${title}`;
      }
    }
    
    return title;
  }

  determineAlertType(sentimentScore) {
    if (sentimentScore > 0.2) return 'bullish';
    if (sentimentScore < -0.2) return 'bearish';
    return 'neutral';
  }

  determineAlertTypeFromHeadline(headline) {
    const bullishKeywords = ['beat', 'surge', 'rally', 'jump', 'gain', 'bullish', 'up', 'rise'];
    const bearishKeywords = ['fall', 'drop', 'decline', 'bear', 'down', 'plunge', 'crash'];
    
    const lowerHeadline = headline.toLowerCase();
    
    if (bullishKeywords.some(word => lowerHeadline.includes(word))) {
      return 'bullish';
    }
    if (bearishKeywords.some(word => lowerHeadline.includes(word))) {
      return 'bearish';
    }
    return 'neutral';
  }

  generateRealisticMarketAlerts() {
    const currentTime = new Date();
    const symbols = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'TSLA', 'AMZN'];
    
    const alertTemplates = [
      {
        template: "{symbol} showing bullish momentum after earnings beat",
        type: 'bullish',
        minutesAgo: Math.floor(Math.random() * 30)
      },
      {
        template: "Fed minutes suggest higher rates for longer",
        type: 'bearish',
        minutesAgo: Math.floor(Math.random() * 60)
      },
      {
        template: "{symbol} filed 10-Q report - Revenue up {percent}% YoY",
        type: 'neutral',
        minutesAgo: Math.floor(Math.random() * 120)
      },
      {
        template: "Tech sector rallies on AI breakthrough announcement",
        type: 'bullish',
        minutesAgo: Math.floor(Math.random() * 45)
      },
      {
        template: "{symbol} announces stock buyback program worth $" + "{amount}B",
        type: 'bullish',
        minutesAgo: Math.floor(Math.random() * 90)
      },
      {
        template: "Market volatility increases amid geopolitical tensions",
        type: 'bearish',
        minutesAgo: Math.floor(Math.random() * 180)
      },
      {
        template: "{symbol} upgrades price target to $" + "{price}",
        type: 'bullish',
        minutesAgo: Math.floor(Math.random() * 60)
      },
      {
        template: "Crypto market surge lifts blockchain-related stocks",
        type: 'bullish',
        minutesAgo: Math.floor(Math.random() * 30)
      }
    ];

    return alertTemplates.slice(0, 6).map((template, index) => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const percent = Math.floor(Math.random() * 20) + 5;
      const amount = (Math.random() * 50 + 10).toFixed(1);
      const price = (150 + Math.random() * 200).toFixed(0);
      
      let title = template.template
        .replace('{symbol}', symbol)
        .replace('{percent}', percent)
        .replace('{amount}', amount)
        .replace('{price}', price);
      
      const alertTime = new Date(currentTime.getTime() - template.minutesAgo * 60000);
      
      return {
        id: `alert_${index}_${Date.now()}`,
        title,
        type: template.type,
        timestamp: alertTime,
        source: 'Market Simulation',
        isLive: false,
        minutesAgo: template.minutesAgo
      };
    });
  }

  formatTimeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  getAlertColor(type) {
    switch (type) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-blue-600';
    }
  }

  getAlertIcon(type) {
    switch (type) {
      case 'bullish': return '🟢';
      case 'bearish': return '🔴';
      default: return '🔵';
    }
  }
}

export default NewsService;
