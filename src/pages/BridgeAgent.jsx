import React, { useState, useEffect } from 'react';
import { getPortfolioData, subscribeToPortfolioChanges, addExtractedAccount, savePortfolioData } from '../services/portfolioService';
import { uploadPortfolio } from '../services/api';
import GoalCard from '../components/GoalCard';

function BridgeAgent() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Load initial portfolio data
    const data = getPortfolioData();
    setPortfolioData(data);
    setLastUpdate(data.last_updated);

    // Load goals from quiz results (stored in localStorage)
    const quizResults = localStorage.getItem('quiz_results');
    const userProfile = localStorage.getItem('user_profile');
    
    if (quizResults) {
      try {
        const results = JSON.parse(quizResults);
        if (results.goal_cards) {
          // Update goal cards with target from user_profile if available
          let goalCards = results.goal_cards;
          if (userProfile) {
            const profile = JSON.parse(userProfile);
            goalCards = goalCards.map(goal => ({
              ...goal,
              target_amount: profile.target_amount || goal.target_amount || 100000,
              timeline: profile.timeline ? getTimelineLabel(profile.timeline) : goal.timeline
            }));
          }
          setGoals(goalCards);
        }
      } catch (error) {
        console.error('Error parsing quiz results:', error);
      }
    }

    // Subscribe to portfolio changes
    const unsubscribe = subscribeToPortfolioChanges((newData) => {
      if (newData.last_updated !== lastUpdate) {
        setSyncing(true);
        setTimeout(() => {
          setPortfolioData(newData);
          setLastUpdate(newData.last_updated);
          setSyncing(false);
        }, 1500);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [lastUpdate]);

  // Calculate progress for each goal based on account types
  const calculateGoalProgress = (goal) => {
    if (!portfolioData || !portfolioData.accounts || portfolioData.accounts.length === 0) {
      return 0;
    }

    const goalTitle = goal.title.toLowerCase();
    let progress = 0;

    // Map account types to goals
    portfolioData.accounts.forEach(account => {
      const accountType = account.account_type.toLowerCase();
      const balance = account.total_balance || 0;

      // Retirement goals
      if (goalTitle.includes('retirement') || goalTitle.includes('ira')) {
        if (accountType.includes('ira') || accountType.includes('401') || accountType.includes('retirement')) {
          progress += balance;
        }
      }
      // Home/Down Payment goals
      else if (goalTitle.includes('home') || goalTitle.includes('down payment') || goalTitle.includes('house')) {
        if (accountType.includes('savings') || accountType.includes('brokerage')) {
          progress += balance * 0.3; // Assume 30% allocated to home
        }
      }
      // Emergency Fund goals
      else if (goalTitle.includes('emergency') || goalTitle.includes('safety')) {
        if (accountType.includes('savings') || accountType.includes('cash')) {
          progress += balance * 0.5; // Assume 50% allocated to emergency
        }
      }
      // Education goals
      else if (goalTitle.includes('education') || goalTitle.includes('college')) {
        if (accountType.includes('529') || accountType.includes('education')) {
          progress += balance;
        }
      }
      // General wealth building
      else {
        // Default: allocate a portion based on account type
        if (!accountType.includes('ira') && !accountType.includes('401')) {
          progress += balance * 0.2;
        }
      }
    });

    return progress;
  };

  // Check if a goal has a verified account
  const isGoalVerified = (goal) => {
    if (!portfolioData || !portfolioData.accounts) return false;
    
    const goalTitle = goal.title.toLowerCase();
    return portfolioData.accounts.some(account => {
      const accountType = account.account_type.toLowerCase();
      
      if (goalTitle.includes('retirement') || goalTitle.includes('ira')) {
        return accountType.includes('ira') || accountType.includes('401') || accountType.includes('retirement');
      }
      if (goalTitle.includes('home') || goalTitle.includes('down payment')) {
        return accountType.includes('savings') || accountType.includes('brokerage');
      }
      if (goalTitle.includes('emergency')) {
        return accountType.includes('savings') || accountType.includes('cash');
      }
      if (goalTitle.includes('education') || goalTitle.includes('college')) {
        return accountType.includes('529') || accountType.includes('education');
      }
      
      return true; // Default to verified if any account exists
    });
  };

  const handleScheduleAdvisor = (goal) => {
    // In a real app, this would open a scheduling modal or redirect
    alert(`Scheduling advisor consultation for: ${goal.title}\n\nThis would open your advisor scheduling interface.`);
  };

  // Calculate total assets by account type
  const getAccountTypeSummary = () => {
    if (!portfolioData || !portfolioData.accounts) return {};
    
    const summary = {};
    portfolioData.accounts.forEach(account => {
      const type = account.account_type || 'Unknown';
      if (!summary[type]) {
        summary[type] = { count: 0, total: 0 };
      }
      summary[type].count += 1;
      summary[type].total += account.total_balance || 0;
    });
    
    return summary;
  };

  const getTimelineLabel = (timeline) => {
    const labels = {
      'short': '1-3 Years',
      'medium': '5 Years',
      'long': '10+ Years'
    };
    return labels[timeline] || 'Ongoing';
  };

  const accountSummary = getAccountTypeSummary();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUploadPortfolio = async () => {
    if (!uploadFile) {
      setUploadError('Please select a portfolio file first');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadPortfolio(uploadFile);
      
      // Process the uploaded portfolio data
      if (result.portfolio_data) {
        // Convert portfolio data to account format
        const holdings = result.portfolio_data.holdings || [];
        const accounts = holdings.map((holding, index) => ({
          id: `uploaded_${Date.now()}_${index}`,
          account_type: holding.type || holding.category || 'Portfolio Holding',
          total_balance: holding.value || holding.amount || 0,
          asset_classes: holding.asset_classes || [holding.category || 'Mixed'],
          extracted_at: new Date().toISOString(),
          document_name: result.portfolio_data.source_document || uploadFile.name
        }));

        // Update portfolio data
        const currentData = getPortfolioData();
        const updatedData = {
          ...currentData,
          accounts: [...(currentData.accounts || []), ...accounts],
          total_balance: (currentData.total_balance || 0) + accounts.reduce((sum, acc) => sum + (acc.total_balance || 0), 0),
          last_updated: new Date().toISOString()
        };
        
        savePortfolioData(updatedData);
        setPortfolioData(updatedData);

        // Update goals if goal_cards are provided
        if (result.goal_cards && result.goal_cards.length > 0) {
          setGoals(result.goal_cards);
          localStorage.setItem('quiz_results', JSON.stringify({
            goal_cards: result.goal_cards,
            case_id: result.case_id
          }));
        }

        setUploadSuccess(`Portfolio uploaded successfully! ${accounts.length} account(s) added. ${result.s3_key ? 'Stored in AWS S3.' : 'Stored locally.'}`);
        setUploadFile(null);
      }
    } catch (err) {
      console.error('Portfolio upload error:', err);
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload portfolio');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bridge-container">
      {/* Portfolio Summary Card - Sidebar on Desktop */}
      <div className="card portfolio-summary-card">
        <div className="card-header">
          <h2 className="card-title">
            Portfolio Summarizer
            <span className="agent-badge agent-bridge">The Bridge</span>
          </h2>
        </div>
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--lpl-text-light)', fontSize: 'var(--font-size-sm)' }}>
          Upload portfolio documents (statements, reports, etc.) to extract data, generate AI summaries, create goal cards, and store securely in AWS. The Bridge translates complex holdings into understandable financial goals.
        </p>

        {/* Portfolio Upload Section */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontWeight: 600, color: 'var(--lpl-navy)', fontSize: 'var(--font-size-base)' }}>
            Upload Portfolio
          </h3>
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploadFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploadFile && document.getElementById('portfolio-file-input').click()}
            style={{ marginBottom: 'var(--spacing-md)' }}
          >
            <input
              id="portfolio-file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            {uploadFile ? (
              <div className="upload-zone-content">
                <div className="upload-icon">✓</div>
                <p className="upload-file-name">{uploadFile.name}</p>
                <p className="upload-file-size">
                  {(uploadFile.size / 1024).toFixed(2)} KB
                </p>
                <button 
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadFile(null);
                    setUploadError(null);
                    setUploadSuccess(null);
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  Choose Different File
                </button>
              </div>
            ) : (
              <div className="upload-zone-content">
                <div className="upload-icon">📊</div>
                <p className="upload-title">Drop portfolio document here</p>
                <p className="upload-subtitle">or click to browse</p>
                <p className="upload-hint">PDF, PNG, or JPG files accepted</p>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleUploadPortfolio}
            disabled={!uploadFile || uploading}
            style={{ width: '100%' }}
          >
            {uploading ? 'Uploading & Summarizing...' : 'Upload & Summarize Portfolio'}
          </button>

          {uploadError && (
            <div className="error-message" style={{ marginTop: 'var(--spacing-md)' }}>
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="success-message" style={{ marginTop: 'var(--spacing-md)' }}>
              {uploadSuccess}
            </div>
          )}
        </div>

        {/* Syncing Animation */}
        {syncing && (
          <div className="syncing-animation">
            <div className="syncing-spinner"></div>
            <p className="syncing-text">Syncing to Goals...</p>
          </div>
        )}

        {/* Total Assets Summary */}
        <div className="portfolio-summary">
          <div className="summary-stat">
            <div className="summary-stat-label">Total Assets</div>
            <div className="summary-stat-value">
              ${(portfolioData?.total_balance || 0).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat-label">Accounts</div>
            <div className="summary-stat-value">
              {portfolioData?.accounts?.length || 0}
            </div>
          </div>
          {portfolioData?.last_updated && (
            <div className="summary-stat">
              <div className="summary-stat-label">Last Updated</div>
              <div className="summary-stat-value" style={{ fontSize: 'var(--font-size-sm)' }}>
                {new Date(portfolioData.last_updated).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Account Breakdown */}
        {Object.keys(accountSummary).length > 0 && (
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', fontWeight: 600, color: 'var(--lpl-navy)', fontSize: 'var(--font-size-lg)' }}>
              Account Breakdown
            </h3>
            <div className="account-breakdown">
              {Object.entries(accountSummary).map(([type, data]) => (
                <div key={type} className="account-breakdown-item">
                  <div className="account-breakdown-header">
                    <span className="account-breakdown-type">{type}</span>
                    <span className="account-breakdown-count">{data.count} account{data.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="account-breakdown-value">
                    ${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!portfolioData || !portfolioData.accounts || portfolioData.accounts.length === 0) && (
          <div className="empty-state">
            <p style={{ color: 'var(--lpl-text-light)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              No portfolio data yet. Upload a portfolio JSON file above to get started.
            </p>
          </div>
        )}
      </div>

      {/* Goal Cards Section - Main Content Area */}
      <div className="goal-cards-section">
        {goals.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Personalized Goal Cards</h3>
              <span className="goals-count">{goals.length} Active Goal{goals.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="goal-cards-grid">
              {goals.map((goal, index) => {
                const currentProgress = calculateGoalProgress(goal);
                const verified = isGoalVerified(goal);
                
                // Get target from user_profile if available, otherwise use goal's target
                const userProfile = localStorage.getItem('user_profile');
                let targetAmount = goal.target_amount || 100000;
                if (userProfile) {
                  try {
                    const profile = JSON.parse(userProfile);
                    // Use profile target if goal type matches
                    if (goal.goal_type === profile.primary_focus) {
                      targetAmount = profile.target_amount;
                    }
                  } catch (e) {
                    console.error('Error parsing user profile:', e);
                  }
                }
                
                // Ensure goal has target_amount from user_profile
                const goalWithTarget = {
                  ...goal,
                  target_amount: targetAmount,
                  description: goal.description || goal.purpose || '',
                  timeline: goal.timeline || goal.estimated_time || 'Ongoing'
                };

                return (
                  <GoalCard
                    key={index}
                    goal={goalWithTarget}
                    currentProgress={currentProgress}
                    isVerified={verified}
                    onScheduleAdvisor={handleScheduleAdvisor}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <p style={{ color: 'var(--lpl-text-light)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                Upload a portfolio to generate Goal Cards, or complete the Personalization Quiz in the Dashboard tab.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BridgeAgent;
