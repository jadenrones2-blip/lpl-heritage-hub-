import React, { useState, useEffect } from 'react';
import { analyzeDocument } from '../services/api';

// Define the 10 compliance rules
const COMPLIANCE_RULES = [
  { id: 1, name: 'SSN Present', field: 'ssn', description: 'Social Security Number must be present and valid (9 digits)' },
  { id: 2, name: 'Physical Address (No PO Box)', field: 'physical_address', description: 'Physical street address required (P.O. Box not acceptable as primary)' },
  { id: 3, name: 'Vague Occupation', field: 'occupation', description: 'Occupation must be specific (not "Business" or "Self-employed" without details)' },
  { id: 4, name: 'Signature Present', field: 'signature', description: 'Wet signature required and must be dated' },
  { id: 5, name: 'Signature Date', field: 'signature_date', description: 'Signature date must be present and within 90 days' },
  { id: 6, name: 'Beneficiary Name', field: 'beneficiary_name', description: 'Beneficiary name must be provided' },
  { id: 7, name: 'Beneficiary Relationship', field: 'beneficiary_relationship', description: 'Beneficiary relationship must be specified' },
  { id: 8, name: 'Date of Birth', field: 'date_of_birth', description: 'Date of birth must be present and valid' },
  { id: 9, name: 'Account Type Selected', field: 'account_type', description: 'Account type must be clearly selected' },
  { id: 10, name: 'Investment Objective', field: 'investment_objective', description: 'Investment objective must be specified' },
];

function CaseDetail({ caseId, documentFile, nigoResults: passedNigoResults }) {
  const [nigoResults, setNigoResults] = useState(passedNigoResults || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState({});

  useEffect(() => {
    if (passedNigoResults) {
      setNigoResults(passedNigoResults);
      updateComplianceStatus(passedNigoResults);
    } else if (documentFile) {
      analyzeDocumentForNIGO(documentFile);
    }
  }, [documentFile, passedNigoResults]);

  const updateComplianceStatus = (results) => {
    const status = {};
    COMPLIANCE_RULES.forEach(rule => {
      // Check if this rule has an error
      const hasError = results.nigo_errors?.some(err => 
        err.field === rule.field || 
        err.type?.includes(rule.field) ||
        err.message?.toLowerCase().includes(rule.field.toLowerCase())
      );
      status[rule.id] = !hasError; // true = passed, false = failed
    });
    setComplianceStatus(status);
  };

  const analyzeDocumentForNIGO = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await analyzeDocument(file);
      setNigoResults(results);
      updateComplianceStatus(results);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze document');
    } finally {
      setLoading(false);
    }
  };

  // Check if document is in good order
  const isInGoodOrder = nigoResults && 
    (!nigoResults.nigo_errors || nigoResults.nigo_errors.length === 0) &&
    nigoResults.nigo_status === 'CLEAN';

  return (
    <div className="case-detail">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">NIGO Compliance Dashboard</h2>
          {nigoResults && (
            <span className={`nigo-status-badge ${nigoResults.nigo_status?.toLowerCase() || 'unknown'}`}>
              {nigoResults.nigo_status === 'NIGO' ? '⚠️ NIGO' : 
               nigoResults.nigo_status === 'REVIEW' ? '🔍 REVIEW' : 
               nigoResults.nigo_status === 'CLEAN' ? '✓ CLEAN' : 
               '❓ UNKNOWN'}
            </span>
          )}
        </div>

        {/* Green Banner for Documents in Good Order */}
        {isInGoodOrder && (
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

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="scanning-spinner"></div>
            <p>Analyzing document for NIGO compliance...</p>
          </div>
        )}

        {error && (
          <div className="error-message" style={{ 
            background: '#f8d7da', 
            color: '#721c24',
            border: '1px solid #f5c6cb',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Compliance Rules Grid */}
        <div className="compliance-rules-grid">
          {COMPLIANCE_RULES.map(rule => {
            const passed = complianceStatus[rule.id];
            const isLoading = loading && complianceStatus[rule.id] === undefined;
            
            return (
              <div 
                key={rule.id} 
                className={`compliance-rule-card ${passed === true ? 'passed' : passed === false ? 'failed' : ''}`}
                style={{
                  padding: '1rem',
                  border: `2px solid ${passed === true ? '#28A745' : passed === false ? '#DC3545' : '#E0E0E0'}`,
                  borderRadius: '8px',
                  background: passed === true ? '#f0f9f4' : passed === false ? '#fff5f5' : '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                {/* Status Icon */}
                <div style={{ fontSize: '2rem', minWidth: '40px', textAlign: 'center' }}>
                  {isLoading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #081D4D', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  ) : passed === true ? (
                    <span style={{ color: '#28A745' }}>✓</span>
                  ) : passed === false ? (
                    <span style={{ color: '#DC3545' }}>✗</span>
                  ) : (
                    <span style={{ color: '#6C757D' }}>—</span>
                  )}
                </div>

                {/* Rule Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '1rem',
                    marginBottom: '0.25rem',
                    color: '#081D4D'
                  }}>
                    {rule.id}. {rule.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {rule.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        {nigoResults && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#f8f9fa', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#28A745' }}>
                {Object.values(complianceStatus).filter(s => s === true).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Passed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC3545' }}>
                {Object.values(complianceStatus).filter(s => s === false).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Failed</div>
            </div>
            {nigoResults.confidence_score !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#081D4D' }}>
                  {nigoResults.confidence_score.toFixed(0)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Confidence</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseDetail;
