import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPortfolioData, subscribeToPortfolioChanges, addExtractedAccount, savePortfolioData } from '../services/portfolioService';
import { uploadPortfolio } from '../services/api';

function BridgeAgent() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [syncingAnimation, setSyncingAnimation] = useState(false);

  useEffect(() => {
    // Load initial portfolio data
    const data = getPortfolioData();
    setPortfolioData(data);
    setLastUpdate(data.last_updated);

    // Load portfolio summary if available
    const savedSummary = localStorage.getItem('portfolio_summary');
    if (savedSummary) {
      try {
        setPortfolioSummary(JSON.parse(savedSummary));
      } catch (error) {
        console.error('Error parsing portfolio summary:', error);
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

        // Update portfolio summary if provided
        if (result.summary || result.portfolio_summary) {
          // Trigger syncing animation
          setSyncingAnimation(true);
          setTimeout(() => {
            const summary = {
              text: result.summary || result.portfolio_summary,
              total_value: result.total_account_value || updatedData.total_balance,
              accounts: accounts,
              generated_at: new Date().toISOString()
            };
            setPortfolioSummary(summary);
            localStorage.setItem('portfolio_summary', JSON.stringify(summary));
            setSyncingAnimation(false);
          }, 2000);
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
          Upload portfolio documents (statements, reports, etc.) to extract data and generate a clear, heir-friendly summary. The Bridge translates complex financial documents into plain language so you understand exactly what you've inherited.
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

        {/* Syncing Animation - Visual data flow from document to Goal Cards */}
        <AnimatePresence>
          {(syncing || syncingAnimation) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="syncing-animation-bridge"
            >
              <div className="syncing-content">
                <div className="syncing-icon-container">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1.5, repeat: Infinity }
                    }}
                    className="syncing-icon"
                  >
                    🔄
                  </motion.div>
                </div>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="syncing-text"
                >
                  Processing your portfolio and generating heir-friendly summary...
                </motion.p>
                <div className="syncing-progress">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="syncing-progress-bar"
                  />
                </div>
                <div className="syncing-steps">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="syncing-step"
                  >
                    ✓ Extracting data with Textract
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="syncing-step"
                  >
                    ✓ Generating summary with Bedrock
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="syncing-step"
                  >
                    ✓ Generating Heir-Friendly Summary
                  </motion.div>
                </div>
              </div>
              <style jsx>{`
                .syncing-animation-bridge {
                  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                  border: 2px solid #002D72;
                  border-radius: 12px;
                  padding: 2rem;
                  margin: 1.5rem 0;
                  text-align: center;
                }

                .syncing-content {
                  max-width: 400px;
                  margin: 0 auto;
                }

                .syncing-icon-container {
                  margin-bottom: 1rem;
                }

                .syncing-icon {
                  font-size: 3rem;
                  display: inline-block;
                }

                .syncing-text {
                  font-size: 1.125rem;
                  font-weight: 600;
                  color: #002D72;
                  margin-bottom: 1rem;
                }

                .syncing-progress {
                  width: 100%;
                  height: 8px;
                  background: #e0e0e0;
                  border-radius: 4px;
                  overflow: hidden;
                  margin-bottom: 1.5rem;
                }

                .syncing-progress-bar {
                  height: 100%;
                  background: linear-gradient(90deg, #002D72 0%, #287E33 100%);
                  border-radius: 4px;
                }

                .syncing-steps {
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                  text-align: left;
                }

                .syncing-step {
                  font-size: 0.875rem;
                  color: #666;
                  padding: 0.5rem;
                  background: white;
                  border-radius: 6px;
                }
              `}</style>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* Portfolio Summary for Heir - Main Content Area */}
      <div className="portfolio-summary-section">
        {portfolioSummary ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card portfolio-summary-card-main"
          >
            <div className="card-header">
              <h3 className="card-title">Your Inherited Portfolio Summary</h3>
              <span className="summary-badge">Generated by The Bridge</span>
            </div>

            {/* AI-Generated Summary */}
            <div className="heir-summary-content">
              <div className="summary-intro">
                <h4 style={{ color: '#002D72', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                  What You've Inherited
                </h4>
                <p style={{ color: '#666', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  This summary explains your inherited portfolio in plain language. We've translated complex financial terms into clear explanations.
                </p>
              </div>

              <div className="summary-text">
                {portfolioSummary.text ? (
                  <div 
                    className="summary-markdown"
                    dangerouslySetInnerHTML={{ 
                      __html: portfolioSummary.text
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                ) : (
                  <p>Portfolio summary is being generated...</p>
                )}
              </div>

              {/* Detailed Account Breakdown */}
              {portfolioData && portfolioData.accounts && portfolioData.accounts.length > 0 && (
                <div className="detailed-accounts" style={{ marginTop: '2rem' }}>
                  <h4 style={{ color: '#002D72', marginBottom: '1rem', fontSize: '1.125rem' }}>
                    Account Details
                  </h4>
                  <div className="accounts-list">
                    {portfolioData.accounts.map((account, index) => (
                      <motion.div
                        key={account.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="account-detail-card"
                      >
                        <div className="account-detail-header">
                          <div>
                            <div className="account-detail-type">{account.account_type || 'Account'}</div>
                            {account.document_name && (
                              <div className="account-detail-source">From: {account.document_name}</div>
                            )}
                          </div>
                          <div className="account-detail-balance">
                            ${(account.total_balance || 0).toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                        </div>
                        {account.asset_classes && account.asset_classes.length > 0 && (
                          <div className="account-detail-assets">
                            <span className="assets-label">Asset Classes:</span>
                            <div className="assets-tags">
                              {account.asset_classes.map((asset, i) => (
                                <span key={i} className="asset-tag">{asset}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {account.extracted_at && (
                          <div className="account-detail-date">
                            Extracted: {new Date(account.extracted_at).toLocaleDateString()}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Value Summary */}
              {portfolioSummary.total_value && (
                <div className="total-value-summary" style={{ 
                  marginTop: '2rem', 
                  padding: '1.5rem', 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '12px',
                  border: '2px solid #002D72'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                      Total Inherited Value
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#002D72' }}>
                      ${portfolioSummary.total_value.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="next-steps" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
                <h4 style={{ color: '#002D72', marginBottom: '1rem', fontSize: '1.125rem' }}>
                  Recommended Next Steps
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666', lineHeight: '1.8' }}>
                  <li>Review this summary with a financial advisor</li>
                  <li>Understand any tax implications of your inheritance</li>
                  <li>Consider your long-term financial goals</li>
                  <li>Update beneficiary designations if needed</li>
                </ul>
                <button 
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                  onClick={() => alert('This would open your advisor scheduling interface.')}
                >
                  Schedule Meeting with Advisor
                </button>
              </div>
            </div>

            <style jsx>{`
              .portfolio-summary-card-main {
                max-width: 900px;
                margin: 0 auto;
              }

              .summary-badge {
                font-size: 0.75rem;
                padding: 0.25rem 0.75rem;
                background: #002D72;
                color: white;
                border-radius: 12px;
                font-weight: 600;
              }

              .heir-summary-content {
                padding: 1.5rem 0;
              }

              .summary-text {
                background: white;
                padding: 1.5rem;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                line-height: 1.8;
                color: #333;
                font-size: 0.9375rem;
              }

              .summary-text p {
                margin: 0 0 1rem 0;
              }

              .summary-text p:last-child {
                margin-bottom: 0;
              }

              .summary-text strong {
                color: #002D72;
                font-weight: 600;
              }

              .accounts-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
              }

              .account-detail-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 1.25rem;
                transition: box-shadow 0.2s;
              }

              .account-detail-card:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }

              .account-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
              }

              .account-detail-type {
                font-weight: 600;
                color: #002D72;
                font-size: 1rem;
                margin-bottom: 0.25rem;
              }

              .account-detail-source {
                font-size: 0.8125rem;
                color: #666;
              }

              .account-detail-balance {
                font-size: 1.25rem;
                font-weight: 700;
                color: #287E33;
              }

              .account-detail-assets {
                margin-top: 0.75rem;
                padding-top: 0.75rem;
                border-top: 1px solid #f0f0f0;
              }

              .assets-label {
                font-size: 0.8125rem;
                color: #666;
                margin-right: 0.5rem;
              }

              .assets-tags {
                display: inline-flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
              }

              .asset-tag {
                font-size: 0.75rem;
                padding: 0.25rem 0.75rem;
                background: #f0f0f0;
                border-radius: 12px;
                color: #002D72;
                font-weight: 500;
              }

              .account-detail-date {
                font-size: 0.75rem;
                color: #999;
                margin-top: 0.5rem;
              }
            `}</style>
          </motion.div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <p style={{ color: 'var(--lpl-text-light)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                Upload a portfolio document to generate a clear, heir-friendly summary of what you've inherited.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BridgeAgent;
