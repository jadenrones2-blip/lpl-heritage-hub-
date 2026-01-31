// Portfolio Data Service - Manages portfolio_data.json
const PORTFOLIO_DATA_KEY = 'portfolio_data';

export const getPortfolioData = () => {
  try {
    const data = localStorage.getItem(PORTFOLIO_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Return default structure
    return {
      accounts: [],
      total_balance: 0,
      last_updated: null,
      extracted_data: []
    };
  } catch (error) {
    console.error('Error reading portfolio data:', error);
    return {
      accounts: [],
      total_balance: 0,
      last_updated: null,
      extracted_data: []
    };
  }
};

export const savePortfolioData = (data) => {
  try {
    const dataToSave = {
      ...data,
      last_updated: new Date().toISOString()
    };
    localStorage.setItem(PORTFOLIO_DATA_KEY, JSON.stringify(dataToSave));
    return dataToSave;
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    throw error;
  }
};

export const addExtractedAccount = (extractedData) => {
  const portfolioData = getPortfolioData();
  
  // Add the new account
  const newAccount = {
    id: Date.now().toString(),
    account_type: extractedData.account_type || 'Unknown',
    total_balance: extractedData.total_balance || 0,
    asset_classes: extractedData.asset_classes || [],
    extracted_at: new Date().toISOString(),
    document_name: extractedData.document_name || 'Unknown Document'
  };
  
  portfolioData.accounts.push(newAccount);
  portfolioData.extracted_data.push(extractedData);
  
  // Recalculate total balance
  portfolioData.total_balance = portfolioData.accounts.reduce(
    (sum, acc) => sum + (acc.total_balance || 0),
    0
  );
  
  return savePortfolioData(portfolioData);
};

export const clearPortfolioData = () => {
  try {
    localStorage.removeItem(PORTFOLIO_DATA_KEY);
  } catch (error) {
    console.error('Error clearing portfolio data:', error);
  }
};

// Subscribe to changes (for React components)
// Note: localStorage events only fire in other windows, so we use polling
export const subscribeToPortfolioChanges = (callback) => {
  let lastData = JSON.stringify(getPortfolioData());
  
  // Poll for changes (since localStorage events don't fire in same window)
  const interval = setInterval(() => {
    const currentData = JSON.stringify(getPortfolioData());
    if (currentData !== lastData) {
      lastData = currentData;
      callback(getPortfolioData());
    }
  }, 500);
  
  // Also listen for storage events (for cross-tab updates)
  const handleStorageChange = (e) => {
    if (e.key === PORTFOLIO_DATA_KEY) {
      callback(getPortfolioData());
      lastData = JSON.stringify(getPortfolioData());
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('storage', handleStorageChange);
  };
};
