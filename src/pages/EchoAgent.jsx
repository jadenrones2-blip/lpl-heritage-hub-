import React, { useState, useEffect } from 'react';
import { analyzeDocument } from '../services/api';
import CaseDetail from './CaseDetail';

function EchoAgent() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);

  useEffect(() => {
    // Check if user just completed quiz
    const userProfile = localStorage.getItem('user_profile');
    const quizCompleted = sessionStorage.getItem('quiz_completed');
    if (userProfile && !quizCompleted) {
      setShowQuizPrompt(true);
      sessionStorage.setItem('quiz_completed', 'true');
      // Hide prompt after 10 seconds
      setTimeout(() => setShowQuizPrompt(false), 10000);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
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
      setFile(e.dataTransfer.files[0]);
      setResults(null);
      setError(null);
    }
  };

  // Mock extraction function - simulates AWS Textract
  const mockExtractData = (documentText) => {
    // Simulate extraction logic
    const accountTypes = ['Roth IRA', 'Traditional IRA', '401(k)', 'Brokerage Account', 'Savings Account'];
    const assetClasses = ['Stocks', 'Bonds', 'Mutual Funds', 'ETFs', 'Cash', 'Real Estate'];
    
    // Try to extract account type
    let accountType = 'Unknown';
    for (const type of accountTypes) {
      if (documentText.toLowerCase().includes(type.toLowerCase())) {
        accountType = type;
        break;
      }
    }
    
    // Try to extract balance (look for dollar amounts)
    const balanceMatches = documentText.match(/\$[\d,]+\.?\d*/g);
    let totalBalance = 0;
    if (balanceMatches && balanceMatches.length > 0) {
      // Take the largest amount found
      const amounts = balanceMatches.map(m => parseFloat(m.replace(/[$,]/g, '')));
      totalBalance = Math.max(...amounts);
    } else {
      // Generate a mock balance if none found
      totalBalance = Math.floor(Math.random() * 500000) + 10000;
    }
    
    // Extract asset classes mentioned
    const foundAssetClasses = assetClasses.filter(ac => 
      documentText.toLowerCase().includes(ac.toLowerCase())
    );
    
    return {
      account_type: accountType,
      total_balance: totalBalance,
      asset_classes: foundAssetClasses.length > 0 ? foundAssetClasses : ['Mixed Assets'],
      document_name: file?.name || 'Unknown Document'
    };
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setScanning(true);
      setError(null);
      setResults(null);

    try {
      // Simulate AWS Textract scanning animation (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Call the API (or use mock if API fails)
      let apiData;
      try {
        apiData = await analyzeDocument(file);
      } catch (apiError) {
        // If API fails, use mock data
        console.log('API call failed, using mock data');
        apiData = {
          extracted_text: `Sample document text for ${file.name}. This is a ${file.name.includes('Roth') ? 'Roth IRA' : 'Financial Account'} document with a balance of $${Math.floor(Math.random() * 500000) + 10000}. Asset classes include Stocks, Bonds, and Mutual Funds.`,
          confidence_level: 'GREEN',
          confidence_score: 95
        };
      }

      setResults(apiData);
      setScanning(false);

      // Save total_account_value for goal generation
      if (apiData.total_account_value) {
        localStorage.setItem('total_account_value', apiData.total_account_value.toString());
      }

      // NIGO analysis complete - no need to extract data for portfolio (they're separate)

      // Show success message
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze document');
      setScanning(false);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Echo Document Intelligence
            <span className="agent-badge agent-echo">Data Extractor</span>
          </h2>
        </div>
        {showQuizPrompt && (() => {
          const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
          const goalTitle = userProfile.primary_focus === 'home' ? 'Home Down Payment' :
                           userProfile.primary_focus === 'retirement' ? 'Retirement Savings' :
                           userProfile.primary_focus === 'emergency' ? 'Emergency Fund' : 'goal';
          return (
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, var(--lpl-navy) 0%, #003A8A 100%)',
              color: 'var(--lpl-white)',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 12px var(--lpl-shadow-medium)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <h3 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                color: 'var(--lpl-white)'
              }}>
                Now, upload a document to see how close you are to your {goalTitle}
              </h3>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                opacity: 0.9,
                margin: 0
              }}>
                We'll analyze your document and show your progress toward your ${userProfile.target_amount?.toLocaleString() || 'goal'}
              </p>
            </div>
          );
        })()}

        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Upload complex financial documents (Account Establishment forms, Roth IRA agreements, etc.) 
          to detect NIGO (Not In Good Order) errors and compliance issues. Echo Intelligence analyzes 
          documents for errors before LPL submission. <strong>Note: NIGO analysis is separate from Portfolio Summarizer.</strong>
        </p>

        {/* High-fidelity Upload Zone */}
        <div 
          className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          {file ? (
            <div className="upload-zone-content">
              <div className="upload-icon">✓</div>
              <p className="upload-file-name">{file.name}</p>
              <p className="upload-file-size">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button 
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResults(null);
                }}
                style={{ marginTop: '1rem' }}
              >
                Choose Different File
              </button>
            </div>
          ) : (
            <div className="upload-zone-content">
              <div className="upload-icon">📄</div>
              <p className="upload-title">Drop your document here</p>
              <p className="upload-subtitle">or click to browse</p>
              <p className="upload-hint">PDF, PNG, or JPG files accepted</p>
            </div>
          )}
        </div>

        {/* Scanning Animation */}
        {scanning && (
          <div className="scanning-animation">
            <div className="scanning-spinner"></div>
            <p className="scanning-text">Scanning with Echo Intelligence...</p>
            <div className="scanning-progress">
              <div className="scanning-progress-bar"></div>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={!file || loading}
          style={{ marginTop: '1rem', width: '100%' }}
        >
          {loading ? 'Processing...' : 'Analyze Document & Check NIGO'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Green Banner for Documents in Good Order */}
      {results && results.nigo_status === 'CLEAN' && (!results.nigo_errors || results.nigo_errors.length === 0) && (
        <div style={{
          padding: '1.5rem',
          background: '#d4edda',
          border: '3px solid #28A745',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✓</div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: '#155724',
            marginBottom: '0.25rem'
          }}>
            DOCUMENT IS IN GOOD ORDER
          </div>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: '#155724'
          }}>
            READY FOR LPL SUBMISSION
          </div>
        </div>
      )}

      {/* NIGO Analysis Results - Prominent Display */}
      {results && results.nigo_errors !== undefined && (
        <div className="card nigo-results">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">NIGO Analysis Results</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* NIGO Status Badge */}
              <span className={`nigo-status-badge ${results.nigo_status?.toLowerCase() || 'unknown'}`}>
                {results.nigo_status === 'NIGO' ? '⚠️ NIGO' : 
                 results.nigo_status === 'REVIEW' ? '🔍 REVIEW' : 
                 results.nigo_status === 'CLEAN' ? '✓ CLEAN' : 
                 '❓ UNKNOWN'}
              </span>
              {/* Confidence Level Badge */}
              {results.confidence_level && (
                <span className={`confidence-badge confidence-${results.confidence_level?.toLowerCase() || 'unknown'}`}>
                  {results.confidence_level === 'GREEN' ? '🟢 Automated' :
                   results.confidence_level === 'YELLOW' ? '🟡 Assisted' :
                   results.confidence_level === 'RED' ? '🔴 Manual Review' : '❓'}
                </span>
              )}
            </div>
          </div>

          {/* Confidence Score */}
          {results.confidence_score !== undefined && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Confidence Score:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: results.confidence_score >= 80 ? '#28A745' : results.confidence_score >= 60 ? '#FFC107' : '#DC3545' }}>
                  {results.confidence_score.toFixed(1)}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${results.confidence_score}%`,
                  height: '100%',
                  background: results.confidence_score >= 80 ? '#28A745' : results.confidence_score >= 60 ? '#FFC107' : '#DC3545',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
          )}

          {/* NIGO Errors List */}
          {results.nigo_errors && results.nigo_errors.length > 0 ? (
            <div>
              <h4 style={{ marginBottom: '1rem', fontWeight: 600, color: '#DC3545' }}>
                ⚠️ {results.nigo_errors.length} NIGO Error{results.nigo_errors.length !== 1 ? 's' : ''} Detected
              </h4>
              <div className="nigo-errors-list">
                {results.nigo_errors.map((error, index) => (
                  <div 
                    key={index} 
                    className={`nigo-error-item nigo-error-${error.severity || 'medium'}`}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      borderRadius: '6px',
                      borderLeft: `4px solid ${
                        error.severity === 'high' ? '#DC3545' : 
                        error.severity === 'medium' ? '#FFC107' : 
                        '#6C757D'
                      }`,
                      background: error.severity === 'high' ? '#fff5f5' : 
                                  error.severity === 'medium' ? '#fffbf0' : 
                                  '#f8f9fa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: error.severity === 'high' ? '#DC3545' : 
                                       error.severity === 'medium' ? '#FFC107' : 
                                       '#6C757D',
                            color: '#fff',
                            textTransform: 'uppercase'
                          }}>
                            {error.severity || 'medium'}
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: '#081D4D',
                            color: '#fff'
                          }}>
                            {error.priority || 'MEDIUM'} Priority
                          </span>
                          {error.type && (
                            <span style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                              {error.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {error.field && (
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#081D4D', marginBottom: '0.25rem' }}>
                            Field: {error.field}
                          </div>
                        )}
                        <div style={{ fontSize: '0.875rem', color: '#333', lineHeight: '1.5' }}>
                          {error.message}
                        </div>
                        {error.confidence && (
                          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                            Confidence: <strong>{error.confidence}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '1.5rem', 
              textAlign: 'center', 
              background: '#d4edda', 
              borderRadius: '6px',
              border: '2px solid #28A745'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
              <div style={{ fontWeight: 600, color: '#155724', fontSize: '1.1rem' }}>
                No NIGO Errors Detected
              </div>
              <div style={{ fontSize: '0.875rem', color: '#155724', marginTop: '0.5rem' }}>
                Document appears to be in good order and ready for submission.
              </div>
            </div>
          )}
        </div>
      )}


      {/* Original Analysis Results (if available) */}
      {results && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Document Analysis</h3>
          </div>
          {results.extracted_text && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Extracted Text:</h4>
              <div style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '14px',
                whiteSpace: 'pre-wrap'
              }}>
                {results.extracted_text}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Case Detail with NIGO Dashboard - Shows 10 Compliance Rules */}
      {results && file && (
        <CaseDetail 
          caseId={`case_${Date.now()}`}
          documentFile={file}
          nigoResults={results}
        />
      )}
    </div>
  );
}

export default EchoAgent;
