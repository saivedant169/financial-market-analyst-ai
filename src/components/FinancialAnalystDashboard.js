import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertCircle, Search, BarChart3, FileText, Briefcase, Bell, ChevronRight, ArrowUpRight, ArrowDownRight, Activity, RefreshCw } from 'lucide-react';
import AIFinancialService from '../services/aiService';
import MarketDataService from '../services/marketDataService';
import NewsService from '../services/newsService';

// Helper functions for company data
const getCompanyName = (symbol) => {
  const names = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'NVDA': 'NVIDIA Corp.',
    'GOOGL': 'Alphabet Inc.',
    'META': 'Meta Platforms Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'BRK.B': 'Berkshire Hathaway Inc.'
  };
  return names[symbol] || symbol;
};

const getMarketCap = (symbol, price) => {
  // Approximate market caps based on shares outstanding
  const shareData = {
    'AAPL': { shares: 15.5, unit: 'B' },
    'MSFT': { shares: 7.4, unit: 'B' },
    'NVDA': { shares: 2.5, unit: 'B' },
    'GOOGL': { shares: 1.2, unit: 'B' },
    'META': { shares: 2.5, unit: 'B' },
    'AMZN': { shares: 10.5, unit: 'B' },
    'TSLA': { shares: 3.2, unit: 'B' },
    'BRK.B': { shares: 1.4, unit: 'B' }
  };

  const data = shareData[symbol];
  if (!data) return 'N/A';
  
  const marketCap = (price * data.shares) / 1000; // Convert to trillions
  return marketCap >= 1 ? `${marketCap.toFixed(1)}T` : `${(marketCap * 1000).toFixed(0)}B`;
};

// Major stocks to display in watchlist
const watchlistSymbols = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'BRK.B'];

const FinancialAnalystDashboard = () => {
  console.log('FinancialAnalystDashboard component loading...');
  
  const [activeTab, setActiveTab] = useState('market');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [liveStocks, setLiveStocks] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [marketAlerts, setMarketAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

  console.log('State initialized successfully');

  // Initialize services
  const [aiService] = useState(() => {
    try {
      console.log('Initializing AI service...');
      return new AIFinancialService();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      setAiError(error.message);
      return null;
    }
  });
  
  const [marketService] = useState(() => {
    try {
      console.log('Initializing market service...');
      return new MarketDataService();
    } catch (error) {
      console.error('Failed to initialize market service:', error);
      return null;
    }
  });
  
  const [newsService] = useState(() => {
    try {
      console.log('Initializing news service...');
      return new NewsService();
    } catch (error) {
      console.error('Failed to initialize news service:', error);
      return null;
    }
  });

  console.log('Services initialized:', { aiService: !!aiService, marketService: !!marketService, newsService: !!newsService });

  const loadLiveStockData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const stockData = await marketService.getBatchStockData(watchlistSymbols);
      const processedData = stockData.map(({ symbol, data, error }) => ({
        ...data,
        name: getCompanyName(symbol),
        marketCap: getMarketCap(symbol, data.price),
        error
      }));
      
      setLiveStocks(processedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [marketService]);

  const loadMarketAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
    try {
      const alerts = await newsService.getMarketAlerts();
      setMarketAlerts(alerts);
    } catch (error) {
      console.error('Failed to load market alerts:', error);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [newsService]);

  // Load live stock data on component mount and refresh
  useEffect(() => {
    loadLiveStockData();
    loadMarketAlerts();
    
    // Refresh data every 30 seconds
    const stockInterval = setInterval(loadLiveStockData, 30000);
    // Refresh alerts every 5 minutes
    const alertsInterval = setInterval(loadMarketAlerts, 300000);
    
    return () => {
      clearInterval(stockInterval);
      clearInterval(alertsInterval);
    };
  }, [loadLiveStockData, loadMarketAlerts]);

  // Extended stock database for search functionality - Fortune 500 Companies
  const allStocks = [
    // Technology
    { symbol: 'AAPL', name: 'Apple Inc.', price: 195.42, change: 2.34, changePercent: 1.21, marketCap: '3.2T', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 425.67, change: -1.23, changePercent: -0.29, marketCap: '3.1T', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 892.45, change: 15.67, changePercent: 1.79, marketCap: '2.2T', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.89, change: 3.45, changePercent: 2.47, marketCap: '1.8T', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 512.78, change: 8.92, changePercent: 1.77, marketCap: '1.3T', sector: 'Technology' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1654.32, change: 12.45, changePercent: 0.76, marketCap: '765B', sector: 'Technology' },
    { symbol: 'ORCL', name: 'Oracle Corp.', price: 134.56, change: 1.87, changePercent: 1.41, marketCap: '380B', sector: 'Technology' },
    { symbol: 'CRM', name: 'Salesforce Inc.', price: 287.43, change: 3.21, changePercent: 1.13, marketCap: '285B', sector: 'Technology' },
    { symbol: 'ADBE', name: 'Adobe Inc.', price: 543.21, change: 7.89, changePercent: 1.47, marketCap: '245B', sector: 'Technology' },
    { symbol: 'INTC', name: 'Intel Corp.', price: 34.78, change: -0.45, changePercent: -1.28, marketCap: '145B', sector: 'Technology' },
    { symbol: 'IBM', name: 'International Business Machines Corp.', price: 198.76, change: 2.34, changePercent: 1.19, marketCap: '180B', sector: 'Technology' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.', price: 56.43, change: 0.87, changePercent: 1.57, marketCap: '230B', sector: 'Technology' },
    { symbol: 'HPE', name: 'Hewlett Packard Enterprise Co.', price: 18.92, change: 0.23, changePercent: 1.23, marketCap: '25B', sector: 'Technology' },
    { symbol: 'HPQ', name: 'HP Inc.', price: 29.87, change: -0.12, changePercent: -0.40, marketCap: '30B', sector: 'Technology' },
    
    // Financial Services
    { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 432.10, change: 1.23, changePercent: 0.29, marketCap: '950B', sector: 'Financial Services' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 189.45, change: -0.87, changePercent: -0.46, marketCap: '550B', sector: 'Financial Services' },
    { symbol: 'V', name: 'Visa Inc.', price: 245.67, change: 3.21, changePercent: 1.32, marketCap: '520B', sector: 'Financial Services' },
    { symbol: 'MA', name: 'Mastercard Inc.', price: 412.67, change: 1.87, changePercent: 0.46, marketCap: '390B', sector: 'Financial Services' },
    { symbol: 'BAC', name: 'Bank of America Corp.', price: 34.56, change: -0.23, changePercent: -0.66, marketCap: '280B', sector: 'Financial Services' },
    { symbol: 'WFC', name: 'Wells Fargo & Co.', price: 47.89, change: 0.56, changePercent: 1.18, marketCap: '175B', sector: 'Financial Services' },
    { symbol: 'GS', name: 'Goldman Sachs Group Inc.', price: 387.21, change: 4.32, changePercent: 1.13, marketCap: '130B', sector: 'Financial Services' },
    { symbol: 'MS', name: 'Morgan Stanley', price: 98.76, change: 1.23, changePercent: 1.26, marketCap: '165B', sector: 'Financial Services' },
    { symbol: 'C', name: 'Citigroup Inc.', price: 65.43, change: -0.87, changePercent: -1.31, marketCap: '125B', sector: 'Financial Services' },
    { symbol: 'AXP', name: 'American Express Co.', price: 234.56, change: 2.87, changePercent: 1.24, marketCap: '175B', sector: 'Financial Services' },
    { symbol: 'SPGI', name: 'S&P Global Inc.', price: 456.78, change: 5.67, changePercent: 1.26, marketCap: '140B', sector: 'Financial Services' },
    { symbol: 'BLK', name: 'BlackRock Inc.', price: 798.45, change: 8.21, changePercent: 1.04, marketCap: '120B', sector: 'Financial Services' },
    
    // Healthcare
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 542.34, change: 4.56, changePercent: 0.85, marketCap: '510B', sector: 'Healthcare' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 167.89, change: 0.45, changePercent: 0.27, marketCap: '445B', sector: 'Healthcare' },
    { symbol: 'LLY', name: 'Eli Lilly and Co.', price: 789.12, change: 15.67, changePercent: 2.02, marketCap: '750B', sector: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer Inc.', price: 28.93, change: -0.34, changePercent: -1.16, marketCap: '165B', sector: 'Healthcare' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', price: 176.54, change: 2.12, changePercent: 1.22, marketCap: '315B', sector: 'Healthcare' },
    { symbol: 'MRK', name: 'Merck & Co. Inc.', price: 112.87, change: 1.45, changePercent: 1.30, marketCap: '285B', sector: 'Healthcare' },
    { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', price: 587.32, change: 6.78, changePercent: 1.17, marketCap: '230B', sector: 'Healthcare' },
    { symbol: 'ABT', name: 'Abbott Laboratories', price: 109.76, change: 0.98, changePercent: 0.90, marketCap: '195B', sector: 'Healthcare' },
    { symbol: 'DHR', name: 'Danaher Corp.', price: 267.43, change: 3.21, changePercent: 1.22, marketCap: '190B', sector: 'Healthcare' },
    { symbol: 'CVS', name: 'CVS Health Corp.', price: 76.89, change: -0.56, changePercent: -0.72, marketCap: '100B', sector: 'Healthcare' },
    
    // Consumer Discretionary
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.32, change: -2.45, changePercent: -1.35, marketCap: '1.9T', sector: 'Consumer Discretionary' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 234.56, change: 5.67, changePercent: 2.48, marketCap: '750B', sector: 'Consumer Discretionary' },
    { symbol: 'HD', name: 'Home Depot Inc.', price: 334.21, change: 2.89, changePercent: 0.87, marketCap: '345B', sector: 'Consumer Discretionary' },
    { symbol: 'MCD', name: 'McDonald\'s Corp.', price: 287.65, change: 1.87, changePercent: 0.65, marketCap: '210B', sector: 'Consumer Discretionary' },
    { symbol: 'NKE', name: 'Nike Inc.', price: 98.76, change: -1.23, changePercent: -1.23, marketCap: '155B', sector: 'Consumer Discretionary' },
    { symbol: 'SBUX', name: 'Starbucks Corp.', price: 104.32, change: 0.87, changePercent: 0.84, marketCap: '120B', sector: 'Consumer Discretionary' },
    { symbol: 'LOW', name: 'Lowe\'s Companies Inc.', price: 245.67, change: 3.21, changePercent: 1.32, marketCap: '155B', sector: 'Consumer Discretionary' },
    { symbol: 'TJX', name: 'TJX Companies Inc.', price: 112.45, change: 1.34, changePercent: 1.21, marketCap: '130B', sector: 'Consumer Discretionary' },
    { symbol: 'F', name: 'Ford Motor Co.', price: 12.87, change: 0.23, changePercent: 1.82, marketCap: '52B', sector: 'Consumer Discretionary' },
    { symbol: 'GM', name: 'General Motors Co.', price: 43.21, change: -0.67, changePercent: -1.53, marketCap: '60B', sector: 'Consumer Discretionary' },
    
    // Consumer Staples
    { symbol: 'WMT', name: 'Walmart Inc.', price: 167.89, change: 0.87, changePercent: 0.52, marketCap: '455B', sector: 'Consumer Staples' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', price: 156.78, change: -0.34, changePercent: -0.22, marketCap: '375B', sector: 'Consumer Staples' },
    { symbol: 'KO', name: 'Coca-Cola Co.', price: 62.45, change: 0.12, changePercent: 0.19, marketCap: '270B', sector: 'Consumer Staples' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', price: 174.32, change: 1.87, changePercent: 1.08, marketCap: '240B', sector: 'Consumer Staples' },
    { symbol: 'COST', name: 'Costco Wholesale Corp.', price: 876.54, change: 8.92, changePercent: 1.03, marketCap: '390B', sector: 'Consumer Staples' },
    { symbol: 'WBA', name: 'Walgreens Boots Alliance Inc.', price: 21.87, change: -0.45, changePercent: -2.02, marketCap: '19B', sector: 'Consumer Staples' },
    { symbol: 'KR', name: 'Kroger Co.', price: 54.32, change: 0.67, changePercent: 1.25, marketCap: '40B', sector: 'Consumer Staples' },
    { symbol: 'CL', name: 'Colgate-Palmolive Co.', price: 87.65, change: 0.34, changePercent: 0.39, marketCap: '75B', sector: 'Consumer Staples' },
    
    // Energy
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 112.45, change: 1.67, changePercent: 1.51, marketCap: '465B', sector: 'Energy' },
    { symbol: 'CVX', name: 'Chevron Corp.', price: 156.78, change: 2.34, changePercent: 1.52, marketCap: '295B', sector: 'Energy' },
    { symbol: 'COP', name: 'ConocoPhillips', price: 98.76, change: 1.23, changePercent: 1.26, marketCap: '125B', sector: 'Energy' },
    { symbol: 'EOG', name: 'EOG Resources Inc.', price: 134.56, change: 2.87, changePercent: 2.18, marketCap: '80B', sector: 'Energy' },
    { symbol: 'SLB', name: 'Schlumberger Ltd.', price: 47.89, change: 0.76, changePercent: 1.61, marketCap: '68B', sector: 'Energy' },
    { symbol: 'PSX', name: 'Phillips 66', price: 123.45, change: 1.67, changePercent: 1.37, marketCap: '60B', sector: 'Energy' },
    { symbol: 'VLO', name: 'Valero Energy Corp.', price: 145.32, change: 2.34, changePercent: 1.64, marketCap: '55B', sector: 'Energy' },
    
    // Industrials
    { symbol: 'GE', name: 'General Electric Co.', price: 187.65, change: 3.45, changePercent: 1.87, marketCap: '205B', sector: 'Industrials' },
    { symbol: 'CAT', name: 'Caterpillar Inc.', price: 345.67, change: 4.32, changePercent: 1.27, marketCap: '185B', sector: 'Industrials' },
    { symbol: 'BA', name: 'Boeing Co.', price: 234.56, change: -2.87, changePercent: -1.21, marketCap: '140B', sector: 'Industrials' },
    { symbol: 'RTX', name: 'Raytheon Technologies Corp.', price: 98.76, change: 1.23, changePercent: 1.26, marketCap: '145B', sector: 'Industrials' },
    { symbol: 'LMT', name: 'Lockheed Martin Corp.', price: 467.89, change: 5.67, changePercent: 1.23, marketCap: '115B', sector: 'Industrials' },
    { symbol: 'UNP', name: 'Union Pacific Corp.', price: 245.32, change: 2.87, changePercent: 1.18, marketCap: '155B', sector: 'Industrials' },
    { symbol: 'UPS', name: 'United Parcel Service Inc.', price: 187.65, change: 1.43, changePercent: 0.77, marketCap: '165B', sector: 'Industrials' },
    { symbol: 'FDX', name: 'FedEx Corp.', price: 287.43, change: 3.76, changePercent: 1.33, marketCap: '75B', sector: 'Industrials' },
    { symbol: 'DE', name: 'Deere & Co.', price: 398.76, change: 4.32, changePercent: 1.10, marketCap: '120B', sector: 'Industrials' },
    { symbol: 'MMM', name: '3M Co.', price: 123.45, change: -0.87, changePercent: -0.70, marketCap: '70B', sector: 'Industrials' },
    
    // Utilities
    { symbol: 'NEE', name: 'NextEra Energy Inc.', price: 87.65, change: 0.45, changePercent: 0.52, marketCap: '175B', sector: 'Utilities' },
    { symbol: 'DUK', name: 'Duke Energy Corp.', price: 98.76, change: 0.67, changePercent: 0.68, marketCap: '75B', sector: 'Utilities' },
    { symbol: 'SO', name: 'Southern Co.', price: 76.54, change: 0.34, changePercent: 0.45, marketCap: '82B', sector: 'Utilities' },
    { symbol: 'D', name: 'Dominion Energy Inc.', price: 54.32, change: -0.23, changePercent: -0.42, marketCap: '45B', sector: 'Utilities' },
    { symbol: 'AEP', name: 'American Electric Power Co. Inc.', price: 87.89, change: 0.56, changePercent: 0.64, marketCap: '45B', sector: 'Utilities' },
    
    // Materials
    { symbol: 'LIN', name: 'Linde plc', price: 432.10, change: 5.67, changePercent: 1.33, marketCap: '220B', sector: 'Materials' },
    { symbol: 'APD', name: 'Air Products and Chemicals Inc.', price: 287.65, change: 3.45, changePercent: 1.22, marketCap: '65B', sector: 'Materials' },
    { symbol: 'FCX', name: 'Freeport-McMoRan Inc.', price: 43.21, change: 0.87, changePercent: 2.05, marketCap: '63B', sector: 'Materials' },
    { symbol: 'NUE', name: 'Nucor Corp.', price: 156.78, change: 2.34, changePercent: 1.52, marketCap: '45B', sector: 'Materials' },
    { symbol: 'DOW', name: 'Dow Inc.', price: 54.32, change: 0.76, changePercent: 1.42, marketCap: '38B', sector: 'Materials' },
    
    // Communication Services
    { symbol: 'VZ', name: 'Verizon Communications Inc.', price: 43.21, change: -0.12, changePercent: -0.28, marketCap: '180B', sector: 'Communication Services' },
    { symbol: 'T', name: 'AT&T Inc.', price: 19.87, change: 0.23, changePercent: 1.17, marketCap: '140B', sector: 'Communication Services' },
    { symbol: 'CMCSA', name: 'Comcast Corp.', price: 45.67, change: 0.87, changePercent: 1.94, marketCap: '200B', sector: 'Communication Services' },
    { symbol: 'DIS', name: 'Walt Disney Co.', price: 98.76, change: 1.23, changePercent: 1.26, marketCap: '180B', sector: 'Communication Services' },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 487.65, change: 8.92, changePercent: 1.86, marketCap: '210B', sector: 'Communication Services' },
    
    // Real Estate
    { symbol: 'AMT', name: 'American Tower Corp.', price: 234.56, change: 2.87, changePercent: 1.24, marketCap: '105B', sector: 'Real Estate' },
    { symbol: 'PLD', name: 'Prologis Inc.', price: 134.56, change: 1.67, changePercent: 1.26, marketCap: '125B', sector: 'Real Estate' },
    { symbol: 'CCI', name: 'Crown Castle Inc.', price: 123.45, change: 1.23, changePercent: 1.01, marketCap: '55B', sector: 'Real Estate' },
    { symbol: 'EQIX', name: 'Equinix Inc.', price: 876.54, change: 8.76, changePercent: 1.01, marketCap: '80B', sector: 'Real Estate' },
    { symbol: 'SPG', name: 'Simon Property Group Inc.', price: 134.56, change: 1.87, changePercent: 1.41, marketCap: '50B', sector: 'Real Estate' }
  ];

  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateReport = async () => {
    if (!selectedStock) {
      alert('Please select a stock from the watchlist first.');
      return;
    }

    if (!aiService) {
      setAiError('AI service not available. Please check your OpenAI API key in the .env file.');
      return;
    }

    setIsGeneratingReport(true);
    setAiError(null);
    
    try {
      // Use AI service to generate analysis
      const report = await aiService.generateStockAnalysis(selectedStock);
      setGeneratedReport(report);
    } catch (error) {
      console.error('Failed to generate AI report:', error);
      setAiError(error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedSearchIndex(-1);
    
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const filtered = allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      stock.sector.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Limit to 8 results

    setSearchResults(filtered);
    setShowSearchDropdown(true);
  };

  const handleKeyDown = (e) => {
    if (!showSearchDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length) {
          selectStock(searchResults[selectedSearchIndex]);
        }
        break;
      case 'Escape':
        setShowSearchDropdown(false);
        setSelectedSearchIndex(-1);
        break;
      default:
        // No action needed for other keys
        break;
    }
  };

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);
    setSelectedSearchIndex(-1);
    
    // Add to watchlist if not already there
    const isInWatchlist = liveStocks.some(watchlistStock => watchlistStock.symbol === stock.symbol);
    if (!isInWatchlist) {
      // In a real app, you'd update the watchlist state here
      console.log(`Added ${stock.symbol} to watchlist`);
    }
  };

  const MarketAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Powered Market Analysis</h2>
          <div className="flex items-center space-x-3">
            {!aiService && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">
                ⚠️ AI Not Configured
              </div>
            )}
            {aiService && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                ✅ AI Ready
              </div>
            )}
            <button 
              onClick={generateReport}
              disabled={isGeneratingReport || !aiService}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGeneratingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>AI Analyzing...</span>
                </>
              ) : (
                <span>🤖 Generate AI Report</span>
              )}
            </button>
          </div>
        </div>

        {/* AI Error Display */}
        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-red-900 font-semibold mb-2">AI Analysis Error</h3>
                <p className="text-red-800 text-sm mb-3">{aiError}</p>
                <div className="bg-red-100 rounded p-3 text-sm text-red-800">
                  <strong>Quick Fix:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Get a free OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                    <li>Add it to your <code className="bg-red-200 px-1 rounded">.env</code> file: <code className="bg-red-200 px-1 rounded">REACT_APP_OPENAI_API_KEY=sk-your-key</code></li>
                    <li>Restart the development server: <code className="bg-red-200 px-1 rounded">npm start</code></li>
                  </ol>
                </div>
                <button 
                  onClick={() => setAiError(null)}
                  className="mt-3 text-red-600 hover:text-red-800 text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No AI Service Warning */}
        {!aiService && !aiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-yellow-900 font-semibold mb-2">🤖 AI Analysis Requires Setup</h3>
                <p className="text-yellow-800 mb-4">
                  This application is designed for AI-powered financial analysis. To enable real AI insights:
                </p>
                <div className="bg-yellow-100 rounded p-4 text-sm text-yellow-800">
                  <strong>Setup Steps:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI API Keys</a> (Free $5 credit included)</li>
                    <li>Create an API key (starts with sk-...)</li>
                    <li>Add to <code className="bg-yellow-200 px-1 rounded">.env</code> file: <code className="bg-yellow-200 px-1 rounded">REACT_APP_OPENAI_API_KEY=sk-your-key</code></li>
                    <li>Restart server: <code className="bg-yellow-200 px-1 rounded">npm start</code></li>
                  </ol>
                  <p className="mt-3 font-medium">💰 Cost: ~$0.001 per analysis (0.1 cent)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Report Section */}
        {generatedReport && (
          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900 flex items-center">
                  <FileText className="w-6 h-6 mr-2" />
                  {generatedReport.isAIGenerated ? '🤖 AI-Generated Analysis Report' : '📊 Analysis Report (Demo Mode)'}
                </h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Print
                  </button>
                  <button 
                    onClick={() => setGeneratedReport(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-blue-700 mb-4 flex items-center justify-between">
                <span>Generated on: {generatedReport.generatedAt} | Stock: {generatedReport.stock.symbol}</span>
                {!generatedReport.isAIGenerated && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                    Demo Mode - Add OpenAI API key for AI analysis
                  </span>
                )}
                {generatedReport.isAIGenerated && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    ✨ Powered by OpenAI GPT-4
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Executive Summary */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
                  <p className="text-gray-700 text-sm">{generatedReport.sections.executiveSummary}</p>
                </div>

                {/* Key Metrics */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">${generatedReport.sections.marketPosition.currentPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P/E Ratio:</span>
                      <span className="font-medium">{generatedReport.sections.marketPosition.peRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Cap:</span>
                      <span className="font-medium">{generatedReport.sections.marketPosition.marketCap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Beta:</span>
                      <span className="font-medium">{generatedReport.sections.marketPosition.beta}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Technical Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend:</span>
                      <span className={`font-medium ${generatedReport.sections.technicalAnalysis.trend === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>
                        {generatedReport.sections.technicalAnalysis.trend}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Support:</span>
                      <span className="font-medium">${generatedReport.sections.technicalAnalysis.support}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resistance:</span>
                      <span className="font-medium">${generatedReport.sections.technicalAnalysis.resistance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RSI:</span>
                      <span className="font-medium">{generatedReport.sections.technicalAnalysis.rsi}</span>
                    </div>
                  </div>
                </div>

                {/* Fundamental Analysis */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Fundamental Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue Growth:</span>
                      <span className="font-medium text-green-600">{generatedReport.sections.fundamentalAnalysis.revenueGrowth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Earnings Growth:</span>
                      <span className="font-medium text-green-600">{generatedReport.sections.fundamentalAnalysis.earningsGrowth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className="font-medium">{generatedReport.sections.fundamentalAnalysis.profitMargin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ROE:</span>
                      <span className="font-medium">{generatedReport.sections.fundamentalAnalysis.roe}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-6 bg-white rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3">Investment Recommendation</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <span className="text-gray-600 block">Rating</span>
                    <span className={`font-bold text-lg ${generatedReport.sections.recommendation.rating === 'BUY' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {generatedReport.sections.recommendation.rating}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-600 block">Target Price</span>
                    <span className="font-bold text-lg text-green-600">${generatedReport.sections.recommendation.targetPrice}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-600 block">Timeframe</span>
                    <span className="font-bold text-lg text-gray-900">{generatedReport.sections.recommendation.timeframe}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-600 block">Confidence</span>
                    <span className="font-bold text-lg text-blue-600">{generatedReport.sections.recommendation.confidence}</span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="mt-6 bg-white rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3">Risk Factors</h4>
                <ul className="space-y-2">
                  {generatedReport.sections.risks.map((risk, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedStock && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Executive Summary
              </h3>
              <p className="text-gray-700">
                {selectedStock.symbol} shows strong technical momentum with price above all major moving averages. 
                Recent earnings beat expectations, supporting bullish sentiment in the near term.
              </p>
            </div>

            {/* Current Market Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Stock Price</p>
                <p className="text-2xl font-bold text-gray-900">${selectedStock.price}</p>
                <p className={`text-sm ${selectedStock.change > 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                  {selectedStock.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {selectedStock.change > 0 ? '+' : ''}{selectedStock.changePercent}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">P/E Ratio</p>
                <p className="text-2xl font-bold text-gray-900">28.5</p>
                <p className="text-sm text-gray-500">Industry Avg: 25.3</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Market Cap</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStock.marketCap}</p>
                <p className="text-sm text-gray-500">Large Cap</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Volume</p>
                <p className="text-2xl font-bold text-gray-900">45.2M</p>
                <p className="text-sm text-gray-500">Avg: 52.1M</p>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Detailed Analysis
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Technical Analysis:</strong> The stock has broken above its 50-day moving average with increasing volume, 
                  suggesting strong bullish momentum. RSI at 65 indicates room for further upside without being overbought.
                </p>
                <p>
                  <strong>Fundamental Drivers:</strong> Q4 earnings exceeded consensus by 12%, driven by strong product demand 
                  and margin expansion. Management raised full-year guidance, signaling confidence in continued growth.
                </p>
                <p>
                  <strong>Market Sentiment:</strong> Institutional ownership increased by 3.2% last quarter. Options flow 
                  shows bullish positioning with call/put ratio at 1.8.
                </p>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Risk Factors
              </h3>
              <ul className="space-y-2 text-red-800">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Valuation at premium to historical average (P/E 28.5 vs 5-year avg 22.3)
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Exposure to global supply chain disruptions
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Regulatory scrutiny in key markets could impact growth
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Competition intensifying in core product segments
                </li>
              </ul>
            </div>

            {/* Recommendation */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recommendation
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">Rating:</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full font-bold">BUY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">Target Price:</span>
                  <span className="text-green-900 font-bold">${(selectedStock.price * 1.15).toFixed(2)} (+15%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">Timeframe:</span>
                  <span className="text-green-900 font-bold">6-12 months</span>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
                  Initiate position with 3-5% portfolio allocation
                </li>
                <li className="flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
                  Set stop loss at ${(selectedStock.price * 0.92).toFixed(2)} (-8%)
                </li>
                <li className="flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
                  Monitor upcoming earnings release on Feb 15
                </li>
                <li className="flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
                  Review position if price reaches resistance at $210
                </li>
              </ul>
            </div>
          </div>
        )}

        {!selectedStock && (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Select a stock from the watchlist to view detailed analysis</p>
          </div>
        )}
      </div>
    </div>
  );

  const SECFilings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">SEC Filings Analysis</h2>
        
        <div className="space-y-4">
          {['10-K Annual Report', '10-Q Quarterly Report', '8-K Current Report', 'DEF 14A Proxy Statement'].map((filing, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{filing}</h3>
                  <p className="text-sm text-gray-600 mt-1">Filed: {new Date().toLocaleDateString()}</p>
                </div>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Key Finding:</strong> Revenue increased 12% YoY, exceeding guidance
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Financial Impact:</strong> EPS of $5.42 vs $4.89 expected
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Portfolio = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Recommendations</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Conservative Portfolio</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Expected Return</span>
                <span className="font-bold text-green-600">8-10% annually</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Risk Level</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Low</span>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">Allocation:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bonds</span>
                    <span className="font-medium">40%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Large Cap Stocks</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">International</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash/REITs</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Growth Portfolio</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Expected Return</span>
                <span className="font-bold text-green-600">15-20% annually</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Risk Level</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">High</span>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">Allocation:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Growth Stocks</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tech Sector</span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Emerging Markets</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Alternative Assets</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Financial Market Analyst Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stocks, news, filings..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Search Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 mb-2 px-2">Search Results ({searchResults.length})</div>
                      {searchResults.map((stock, index) => (
                        <button
                          key={stock.symbol}
                          onClick={() => selectStock(stock)}
                          className={`w-full text-left p-3 rounded-lg transition-colors border-b border-gray-100 last:border-b-0 ${
                            index === selectedSearchIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">{stock.symbol}</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{stock.sector}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{stock.name}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-medium text-gray-900">${stock.price}</p>
                              <p className={`text-sm ${stock.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stock.change > 0 ? '+' : ''}{stock.changePercent}%
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No Results Message */}
                {showSearchDropdown && searchResults.length === 0 && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No stocks found for "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try searching by symbol, company name, or sector</p>
                    </div>
                  </div>
                )}
              </div>
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'market', label: 'Market Analysis', icon: BarChart3 },
              { id: 'filings', label: 'SEC Filings', icon: FileText },
              { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Watchlist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Live Watchlist</h3>
                <div className="flex items-center space-x-2">
                  {isLoadingData ? (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <button 
                      onClick={loadLiveStockData}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Refresh data"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {lastUpdated && (
                    <span className="text-xs text-gray-500">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Data source indicator */}
              {liveStocks.length > 0 && (
                <div className="mb-3 text-xs text-gray-500 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    liveStocks[0]?.isLive ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  {liveStocks[0]?.source || 'Loading...'}
                </div>
              )}
              
              <div className="space-y-2">
                {liveStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStock?.symbol === stock.symbol
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{stock.symbol}</p>
                        <p className="text-sm text-gray-600">{stock.name}</p>
                        {stock.error && (
                          <p className="text-xs text-red-500">⚠️ {stock.error}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${stock.price}</p>
                        <p className={`text-sm ${stock.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change > 0 ? '+' : ''}{stock.changePercent}%
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Live Market Alerts</h3>
                <div className="flex items-center space-x-2">
                  {isLoadingAlerts ? (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <button 
                      onClick={loadMarketAlerts}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Refresh alerts"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <Bell className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              
              {/* Data source indicator */}
              {marketAlerts.length > 0 && (
                <div className="mb-3 text-xs text-gray-500 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    marketAlerts[0]?.isLive ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  {marketAlerts[0]?.source || 'Loading...'}
                </div>
              )}
              
              <div className="space-y-3">
                {marketAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <div className="mt-1 text-sm flex-shrink-0">
                      {newsService.getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${newsService.getAlertColor(alert.type)}`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {newsService.formatTimeAgo(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {marketAlerts.length === 0 && !isLoadingAlerts && (
                  <div className="text-center text-gray-500 py-4">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent alerts</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'market' && <MarketAnalysis />}
            {activeTab === 'filings' && <SECFilings />}
            {activeTab === 'portfolio' && <Portfolio />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalystDashboard;
