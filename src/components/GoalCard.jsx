import React, { useState, useEffect } from 'react';

function GoalCard({ goal, currentProgress, isVerified, onScheduleAdvisor }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const targetProgress = Math.min((currentProgress / goal.target_amount) * 100, 100);
    const duration = 1000;
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
  const level = Math.floor(progressPercent / 25) + 1; // 4 levels

  return (
    <div 
      className={`goal-card ${isVerified ? 'verified' : ''}`}
      style={{
        '--glow-intensity': glowIntensity,
        '--progress-percent': `${animatedProgress}%`
      }}
    >
      <div className="goal-card-header">
        <div className="goal-card-title">{goal.title}</div>
        {isVerified && (
          <span className="verified-badge">✓ Verified</span>
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
          <div 
            className="goal-card-progress-bar"
            style={{ width: `${animatedProgress}%` }}
          ></div>
          <div className="goal-card-progress-text">
            {animatedProgress.toFixed(1)}% Complete
          </div>
        </div>
      </div>

      {goal.description && (
        <div className="goal-card-description">{goal.description}</div>
      )}

      {goal.timeline && (
        <div className="goal-card-timeline">{goal.timeline}</div>
      )}

      <div className="goal-card-level">
        <span className="level-label">Level {level}</span>
        <div className="level-indicator">
          {[1, 2, 3, 4].map((lvl) => (
            <div 
              key={lvl} 
              className={`level-dot ${lvl <= level ? 'active' : ''}`}
            ></div>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-primary goal-card-cta"
        onClick={() => onScheduleAdvisor && onScheduleAdvisor(goal)}
      >
        Schedule with Advisor
      </button>
    </div>
  );
}

export default GoalCard;
