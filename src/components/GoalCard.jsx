import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function GoalCard({ goal, currentProgress, isVerified, onScheduleAdvisor }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const targetProgress = Math.min((currentProgress / goal.target_amount) * 100, 100);
    const duration = 1500;
    const startTime = Date.now();
    const startProgress = animatedProgress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedProgress(startProgress + (targetProgress - startProgress) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentProgress, goal.target_amount]);

  useEffect(() => {
    // Calculate glow intensity based on progress
    const progressPercent = (currentProgress / goal.target_amount) * 100;
    setGlowIntensity(Math.min(progressPercent / 100, 1));
  }, [currentProgress, goal.target_amount]);

  const progressPercent = Math.min((currentProgress / goal.target_amount) * 100, 100);
  const level = Math.min(Math.floor(progressPercent / 25) + 1, 4); // 4 levels max

  const isHomeGoal = goal.title?.toLowerCase().includes('home') || goal.title?.toLowerCase().includes('down payment');
  const isRetirementGoal = goal.title?.toLowerCase().includes('retirement') || goal.title?.toLowerCase().includes('legacy');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`goal-card ${isVerified ? 'verified' : ''}`}
      style={{
        '--glow-intensity': glowIntensity,
        '--progress-percent': `${animatedProgress}%`,
        borderLeft: isHomeGoal ? '4px solid #287E33' : isRetirementGoal ? '4px solid #002D72' : '4px solid #666'
      }}
    >
      <div className="goal-card-header">
        <div className="goal-card-title-row">
          <div className="goal-card-icon">
            {isHomeGoal ? '🏠' : isRetirementGoal ? '💰' : '🎯'}
          </div>
          <div className="goal-card-title">{goal.title}</div>
        </div>
        {isVerified && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="verified-badge"
          >
            ✓ Verified via Echo/Textract
          </motion.span>
        )}
      </div>

      <div className="goal-card-progress-section">
        <div className="goal-card-amounts">
          <div className="goal-card-current">
            ${currentProgress.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="goal-card-target">
            of ${goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="goal-card-progress-bar-container">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="goal-card-progress-bar"
            style={{
              background: isHomeGoal 
                ? 'linear-gradient(90deg, #287E33 0%, #34C759 100%)'
                : isRetirementGoal
                ? 'linear-gradient(90deg, #002D72 0%, #003A8A 100%)'
                : 'linear-gradient(90deg, #666 0%, #888 100%)'
            }}
          />
          <div className="goal-card-progress-text">
            {animatedProgress.toFixed(1)}% Complete
          </div>
        </div>
      </div>

      {goal.description && (
        <div className="goal-card-description">{goal.description}</div>
      )}

      {goal.timeline && (
        <div className="goal-card-timeline">
          <span className="timeline-icon">📅</span>
          {goal.timeline}
        </div>
      )}

      <div className="goal-card-level-section">
        <div className="goal-card-level">
          <span className="level-label">Financial Readiness Level {level}</span>
          <div className="level-indicator">
            {[1, 2, 3, 4].map((lvl) => (
              <motion.div
                key={lvl}
                initial={{ scale: 0 }}
                animate={{ scale: lvl <= level ? 1 : 0.5 }}
                transition={{ delay: 0.5 + lvl * 0.1 }}
                className={`level-dot ${lvl <= level ? 'active' : ''}`}
                style={{
                  background: lvl <= level 
                    ? (isHomeGoal ? '#287E33' : isRetirementGoal ? '#002D72' : '#666')
                    : '#e0e0e0'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn btn-primary goal-card-cta"
        onClick={() => onScheduleAdvisor && onScheduleAdvisor(goal)}
        style={{
          background: isHomeGoal
            ? 'linear-gradient(135deg, #287E33 0%, #34C759 100%)'
            : isRetirementGoal
            ? 'linear-gradient(135deg, #002D72 0%, #003A8A 100%)'
            : 'linear-gradient(135deg, #666 0%, #888 100%)'
        }}
      >
        Schedule Meeting - {goal.title}
      </motion.button>
    </motion.div>
  );
}

export default GoalCard;
