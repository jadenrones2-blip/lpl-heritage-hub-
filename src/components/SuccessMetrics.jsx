import React from 'react';
import { motion } from 'framer-motion';

function SuccessMetrics() {
  const metrics = [
    {
      label: 'Estimated Time Saved',
      value: '12 Days',
      description: 'Faster onboarding with Echo NIGO detection',
      icon: '⏱️',
      color: '#287E33'
    },
    {
      label: 'NIGO Reduction',
      value: '40%',
      description: 'Fewer compliance errors',
      icon: '📉',
      color: '#002D72'
    },
    {
      label: 'Documents Processed',
      value: '247',
      description: 'This month',
      icon: '📄',
      color: '#002D72'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="success-metrics"
    >
      <div className="metrics-container">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="metric-card"
          >
            <div className="metric-icon" style={{ background: `${metric.color}15` }}>
              <span style={{ fontSize: '1.5rem' }}>{metric.icon}</span>
            </div>
            <div className="metric-content">
              <div className="metric-value" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-description">{metric.description}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .success-metrics {
          margin-bottom: 2rem;
        }

        .metrics-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;
          min-width: 0;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }

        .metric-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #002D72;
          margin-bottom: 0.125rem;
        }

        .metric-description {
          font-size: 0.75rem;
          color: #666;
          line-height: 1.3;
        }

        @media (max-width: 768px) {
          .metrics-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default SuccessMetrics;
