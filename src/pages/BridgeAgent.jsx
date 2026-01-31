import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadPortfolio } from '../services/api';

function BridgeAgent() {
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [buildingBridge, setBuildingBridge] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // The 9 extracted fields
  const [extractedData, setExtractedData] = useState(null);
  const [documentName, setDocumentName] = useState(null);

  useEffect(() => {
    // Clear data on mount for fresh demo
    setExtractedData(null);
    setDocumentName(null);
    localStorage.removeItem('portfolio_extracted_data');
  }, []);

  // Simulate AWS Textract + Bedrock extraction
  const extractPortfolioData = async (file) => {
    // Simulate Textract processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate extracted data from PDF
    // In production, this would come from AWS Textract + Bedrock
    const mockExtracted = {
      // Snapshot Fields
      totalAggregatedAssets: 646091.00,
      accountBreakdown: [
        { type: 'Brokerage', balance: 200000.00 },
        { type: 'Retirement', balance: 350000.00 },
        { type: 'Savings', balance: 96091.00 }
      ],
      assetAllocation: {
        stocks: 65,
        bonds: 25,
        cash: 10
      },
      top3Holdings: [
        { ticker: 'AAPL', name: 'Apple Inc.', value: 125000.00 },
        { ticker: 'MSFT', name: 'Microsoft Corp.', value: 98000.00 },
        { ticker: 'GOOGL', name: 'Alphabet Inc.', value: 75000.00 }
      ],
      lastStatementDate: '2026-01-15',
      
      // Bridge (Goal) Fields
      primaryGoalTarget: 200000.00, // From quiz (5-Year Home Down Payment)
      verifiedStatus: true, // "Verified Account" found in document
      projectedCompletion: '2029-12-31',
      
      // Calculated fields
      brokerageValue: 200000.00, // Extracted from account breakdown
    };

    // Calculate derived fields
    const primaryGoalProgress = (mockExtracted.brokerageValue / mockExtracted.primaryGoalTarget) * 100;
    const gapAnalysis = mockExtracted.primaryGoalTarget - mockExtracted.brokerageValue;

    return {
      ...mockExtracted,
      primaryGoalProgress: Math.min(primaryGoalProgress, 100),
      gapAnalysis: Math.max(gapAnalysis, 0)
    };
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setExtractedData(null);
      setDocumentName(null);
      setUploadError(null);
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
      setExtractedData(null);
      setDocumentName(null);
      setUploadError(null);
    }
  };

  const handleUploadPortfolio = async () => {
    if (!uploadFile) {
      setUploadError('Please select a portfolio file first');
      return;
    }

    setUploading(true);
    setBuildingBridge(true);
    setUploadError(null);
    setDocumentName(uploadFile.name);

    try {
      // In production: Upload to S3, trigger Textract, then Bedrock
      // For demo: Simulate extraction
      const extracted = await extractPortfolioData(uploadFile);
      
      // Simulate "Building Your Bridge..." animation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setExtractedData(extracted);
      localStorage.setItem('portfolio_extracted_data', JSON.stringify(extracted));
      setBuildingBridge(false);
      setUploading(false);
    } catch (err) {
      console.error('Portfolio upload error:', err);
      setUploadError(err.message || 'Failed to extract portfolio data');
      setBuildingBridge(false);
      setUploading(false);
    }
  };

  // Pie Chart Component for Asset Allocation
  const PieChart = ({ data }) => {
    const { stocks, bonds, cash } = data;
    const radius = 80;
    const centerX = 0;
    const centerY = 0;
    
    // Convert percentages to angles (in radians, starting from top)
    const stocksAngle = (stocks / 100) * 2 * Math.PI;
    const bondsAngle = (bonds / 100) * 2 * Math.PI;
    const cashAngle = (cash / 100) * 2 * Math.PI;
    
    // Helper function to create arc path
    const createArc = (startAngle, endAngle) => {
      const startX = centerX + radius * Math.cos(startAngle - Math.PI / 2);
      const startY = centerY + radius * Math.sin(startAngle - Math.PI / 2);
      const endX = centerX + radius * Math.cos(endAngle - Math.PI / 2);
      const endY = centerY + radius * Math.sin(endAngle - Math.PI / 2);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      
      return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
    };
    
    let currentAngle = 0;
    const stocksPath = createArc(currentAngle, currentAngle + stocksAngle);
    currentAngle += stocksAngle;
    const bondsPath = createArc(currentAngle, currentAngle + bondsAngle);
    currentAngle += bondsAngle;
    const cashPath = createArc(currentAngle, currentAngle + cashAngle);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <svg width="200" height="200" viewBox="-100 -100 200 200">
          <motion.path
            d={stocksPath}
            fill="#002D72"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.path
            d={bondsPath}
            fill="#287E33"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          />
          <motion.path
            d={cashPath}
            fill="#FFB81C"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
          />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#002D72', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>Stocks: {stocks}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#287E33', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>Bonds: {bonds}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#FFB81C', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>Cash: {cash}%</span>
          </div>
        </div>
      </div>
    );
  };

  // Source Icon Component with Tooltip
  const SourceIcon = ({ documentName }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <div 
        style={{ position: 'relative', display: 'inline-block', marginLeft: '0.5rem' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span style={{ 
          fontSize: '0.875rem', 
          color: '#002D72', 
          cursor: 'help',
          opacity: 0.7
        }}>ℹ️</span>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: '#002D72',
              color: 'white',
              borderRadius: '6px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            Extracted via AI from {documentName}
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #002D72'
            }}></div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Upload Section - Top Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            Portfolio Summarizer
            <span className="agent-badge agent-bridge">The Bridge</span>
          </h2>
        </div>
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--lpl-text-light)', fontSize: 'var(--font-size-sm)' }}>
          Upload portfolio statements to extract and visualize your financial snapshot. The Bridge uses AWS Textract and Bedrock to intelligently map your portfolio data.
        </p>

        {/* Upload Section */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploadFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="portfolio-upload"
              accept=".pdf,.json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="portfolio-upload" style={{ cursor: 'pointer', textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
            {uploadFile ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📄</div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#002D72', 
                    marginBottom: '0.5rem',
                    wordBreak: 'break-word',
                    padding: '0 1rem'
                  }}>
                    {uploadFile.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>✓</span>
                    <span>Click to change file</span>
              </div>
                </motion.div>
              ) : (
                <div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: '4rem', marginBottom: '1.5rem' }}
                  >
                    📄
                  </motion.div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#002D72', 
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.01em'
                  }}>
                    Drag & Drop or Click to Upload
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#666',
                    marginTop: '0.5rem'
                  }}>
                    PDF Portfolio Statement
                  </div>
              </div>
            )}
            </label>
          </div>

          {uploadFile && (
            <motion.button
              whileHover={{ scale: uploading || buildingBridge ? 1 : 1.02 }}
              whileTap={{ scale: uploading || buildingBridge ? 1 : 0.98 }}
              className="btn btn-primary"
              onClick={handleUploadPortfolio}
              disabled={uploading || buildingBridge}
              style={{ 
                width: '100%', 
                marginTop: '1.5rem',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                letterSpacing: '0.01em',
                boxShadow: uploading || buildingBridge ? 'none' : '0 4px 12px rgba(0, 45, 114, 0.2)',
                background: uploading || buildingBridge 
                  ? 'linear-gradient(135deg, #666 0%, #777 100%)'
                  : 'linear-gradient(135deg, #002D72 0%, #003A8A 100%)'
              }}
            >
              {uploading || buildingBridge ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ display: 'inline-block' }}
                  >
                    ⟳
                  </motion.span>
                  Processing...
                </span>
              ) : (
                'Extract Portfolio Data'
              )}
            </motion.button>
          )}

          {uploadError && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#fee', 
              color: '#c33', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* Building Your Bridge Animation */}
        <AnimatePresence>
          {buildingBridge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)',
                borderRadius: '16px',
                border: '2px solid #002D72',
                marginBottom: '2rem',
                boxShadow: '0 8px 24px rgba(0, 45, 114, 0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ fontSize: '3rem', marginBottom: '1rem' }}
              >
                🌉
              </motion.div>
              <motion.h3
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 600, 
                  color: '#002D72',
                  marginBottom: '0.5rem'
                }}
              >
                Building Your Bridge...
              </motion.h3>
              <p style={{ color: '#666', fontSize: '0.875rem' }}>
                Extracting data with AWS Textract and mapping with Bedrock AI
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portfolio Dashboard - 9 Fields */}
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card portfolio-dashboard"
            style={{ 
              marginTop: '2rem',
              boxShadow: '0 4px 20px rgba(0, 45, 114, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 45, 114, 0.1)',
              width: '100%',
              maxWidth: '100%'
            }}
          >
            {/* Header: Total Aggregated Assets */}
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRadius: '12px',
              borderBottom: '2px solid #e0e0e0',
              marginBottom: '2.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#287E33',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Extracted
              </div>
              <h2 style={{ 
                color: '#002D72', 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Total Aggregated Assets
                <SourceIcon documentName={documentName} />
              </h2>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: 700, 
                  color: '#002D72',
                  marginTop: '0.5rem',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1
                }}
              >
                ${extractedData.totalAggregatedAssets.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </motion.div>
            </div>

            {/* Two-Column Layout */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '3rem',
              marginBottom: '2rem',
              width: '100%'
            }}
            className="dashboard-grid"
            >
              {/* Left Column: Snapshot Fields */}
              <div>
                <h3 style={{ 
                  color: '#002D72', 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  marginBottom: '2rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #e0e0e0',
                  letterSpacing: '-0.01em'
                }}>
                  The Snapshot
                </h3>

                {/* Account Breakdown */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Account Breakdown
                    <SourceIcon documentName={documentName} />
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)'
                  }}>
                    {extractedData.accountBreakdown.map((account, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          marginBottom: index < extractedData.accountBreakdown.length - 1 ? '0.75rem' : '0',
                          background: index < extractedData.accountBreakdown.length - 1 ? 'white' : 'transparent',
                          borderRadius: index < extractedData.accountBreakdown.length - 1 ? '8px' : '0',
                          borderLeft: '3px solid #002D72',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 45, 114, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ color: '#002D72', fontWeight: 600, fontSize: '0.9375rem' }}>{account.type}</span>
                        <span style={{ color: '#287E33', fontWeight: 700, fontSize: '1.125rem' }}>
                          ${account.balance.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Asset Allocation - Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Asset Allocation
                    <SourceIcon documentName={documentName} />
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '2rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <PieChart data={extractedData.assetAllocation} />
                  </div>
                </motion.div>

                {/* Top 3 Holdings */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Top 3 Holdings
                    <SourceIcon documentName={documentName} />
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)'
                  }}>
                    {extractedData.top3Holdings.map((holding, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          marginBottom: index < extractedData.top3Holdings.length - 1 ? '0.75rem' : '0',
                          background: index < extractedData.top3Holdings.length - 1 ? 'white' : 'transparent',
                          borderRadius: index < extractedData.top3Holdings.length - 1 ? '8px' : '0',
                          borderLeft: '3px solid #287E33',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 45, 114, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div>
                          <div style={{ color: '#002D72', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{holding.ticker}</div>
                          <div style={{ fontSize: '0.8125rem', color: '#666' }}>{holding.name}</div>
                        </div>
                        <span style={{ color: '#287E33', fontWeight: 700, fontSize: '1.125rem' }}>
                          ${holding.value.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Last Statement Date */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Last Statement Date
                    <SourceIcon documentName={documentName} />
            </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)',
                    color: '#002D72',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}>
                    {new Date(extractedData.lastStatementDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Bridge (Goal) Fields */}
              <div>
                <h3 style={{ 
                  color: '#002D72', 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  marginBottom: '2rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #e0e0e0',
                  letterSpacing: '-0.01em'
                }}>
                  The Bridge
                </h3>

                {/* Primary Goal Progress */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Primary Goal Progress (5-Year Home Down Payment)
                    <SourceIcon documentName={documentName} />
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '1.75rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ color: '#002D72', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                          Current: ${extractedData.brokerageValue.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.8125rem' }}>
                          Target: ${extractedData.primaryGoalTarget.toLocaleString('en-US', { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                          })}
                        </div>
                      </div>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #287E33 0%, #34C759 100%)',
                        color: 'white',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        boxShadow: '0 2px 8px rgba(40, 126, 51, 0.3)'
                      }}>
                        {extractedData.primaryGoalProgress.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '16px', 
                      background: '#e8e8e8', 
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${extractedData.primaryGoalProgress}%` }}
                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #287E33 0%, #34C759 100%)',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(40, 126, 51, 0.4)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Gap Analysis */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Gap Analysis
                    <SourceIcon documentName={documentName} />
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '1.5rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 700, 
                      color: '#002D72',
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.02em'
                    }}>
                      ${extractedData.gapAnalysis.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', fontWeight: 500 }}>
                      Remaining to reach target
                    </div>
                  </div>
                </motion.div>

                {/* Verified Status */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Verified Status
                    <SourceIcon documentName={documentName} />
                  </div>
                  {extractedData.verifiedStatus ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      style={{ 
                        background: 'linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%)', 
                        padding: '1.25rem', 
                        borderRadius: '12px',
                        border: '2px solid #287E33',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 2px 12px rgba(40, 126, 51, 0.2)'
                      }}
                    >
                      <span style={{ fontSize: '1.75rem' }}>✓</span>
                      <span style={{ 
                        color: '#287E33', 
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        letterSpacing: '0.02em'
                      }}>
                        LPL Verified
                      </span>
                    </motion.div>
                  ) : (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                      padding: '1.25rem', 
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 45, 114, 0.1)',
                      color: '#666',
                      textAlign: 'center',
                      fontWeight: 500
                    }}>
                      Not Verified
                    </div>
                  )}
                </motion.div>

                {/* Timeline Status */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#666',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Projected Completion
                    <SourceIcon documentName={documentName} />
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 45, 114, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 45, 114, 0.04)',
                    color: '#002D72',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}>
                    {new Date(extractedData.projectedCompletion).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </motion.div>
                </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!extractedData && !buildingBridge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
              borderRadius: '12px',
              border: '1px dashed rgba(0, 45, 114, 0.2)',
              marginTop: '2rem'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>📊</div>
            <p style={{ 
              color: 'var(--lpl-text-light)', 
              fontSize: '1rem',
              fontWeight: 500,
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Upload a portfolio statement to extract and visualize your financial snapshot.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default BridgeAgent;
