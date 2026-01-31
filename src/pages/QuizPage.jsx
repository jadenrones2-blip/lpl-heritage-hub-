import React, { useState, useEffect } from 'react';

function QuizPage({ setActiveTab }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    focus: null,
    targetAmount: 100000,
    timeline: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const questions = [
    {
      id: 1,
      question: "What is your primary financial focus today?",
      options: [
        { id: 'home', label: 'Buying a Home', icon: '🏠' },
        { id: 'retirement', label: 'Planning Retirement', icon: '🎯' },
        { id: 'emergency', label: 'Building an Emergency Fund', icon: '🛡️' }
      ]
    },
    {
      id: 2,
      question: "What is the milestone we are working toward?",
      type: 'amount'
    },
    {
      id: 3,
      question: "When do you want to achieve this?",
      options: [
        { id: 'short', label: '1-3 Years', icon: '⚡' },
        { id: 'medium', label: '5 Years', icon: '📅' },
        { id: 'long', label: '10+ Years', icon: '🌟' }
      ]
    }
  ];

  const handleAnswer = (value) => {
    if (currentStep === 1) {
      setAnswers({ ...answers, focus: value });
    } else if (currentStep === 2) {
      setAnswers({ ...answers, targetAmount: value });
    } else if (currentStep === 3) {
      setAnswers({ ...answers, timeline: value });
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      // Create user_profile object (simulating DynamoDB entry)
      const userProfile = {
        user_id: `user_${Date.now()}`,
        primary_focus: answers.focus,
        target_amount: answers.targetAmount,
        timeline: answers.timeline,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage (simulating AWS DynamoDB)
      localStorage.setItem('user_profile', JSON.stringify(userProfile));

      // Create goal card based on focus
      const goalCard = {
        title: getGoalTitle(answers.focus),
        target_amount: answers.targetAmount,
        timeline: getTimelineLabel(answers.timeline),
        description: getGoalDescription(answers.focus),
        goal_type: answers.focus
      };

      // Save goal card
      localStorage.setItem('quiz_results', JSON.stringify({
        goal_cards: [goalCard],
        user_profile: userProfile
      }));

      // Show generating animation for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to Echo page
      if (setActiveTab) {
        setActiveTab('echo');
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError('Failed to save your preferences. Please try again.');
      setIsGenerating(false);
    }
  };

  const getGoalTitle = (focus) => {
    const titles = {
      'home': 'Home Down Payment',
      'retirement': 'Retirement Savings',
      'emergency': 'Emergency Fund'
    };
    return titles[focus] || 'Financial Goal';
  };

  const getGoalDescription = (focus) => {
    const descriptions = {
      'home': 'Building your down payment fund to achieve homeownership',
      'retirement': 'Securing your financial future for retirement',
      'emergency': 'Creating a safety net for unexpected expenses'
    };
    return descriptions[focus] || 'Your personalized financial goal';
  };

  const getTimelineLabel = (timeline) => {
    const labels = {
      'short': '1-3 Years',
      'medium': '5 Years',
      'long': '10+ Years'
    };
    return labels[timeline] || 'Ongoing';
  };

  const isStepComplete = () => {
    if (currentStep === 1) return answers.focus !== null;
    if (currentStep === 2) return answers.targetAmount > 0;
    if (currentStep === 3) return answers.timeline !== null;
    return false;
  };

  const currentQuestion = questions[currentStep - 1];

  // Generating animation screen
  if (isGenerating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '4px solid var(--lpl-gray)',
          borderTopColor: 'var(--lpl-navy)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '2rem'
        }}></div>
        <h2 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 600,
          color: 'var(--lpl-navy)',
          marginBottom: '0.5rem'
        }}>
          Generating Your Heritage Hub
        </h2>
        <p style={{
          color: 'var(--lpl-text-light)',
          fontSize: 'var(--font-size-base)'
        }}>
          Creating your personalized financial roadmap...
        </p>
      </div>
    );
  }

  return (
    <div className="quiz-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Step Tracker */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '3rem',
        gap: '1rem'
      }}>
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step <= currentStep ? 'var(--lpl-navy)' : 'var(--lpl-gray)',
              color: step <= currentStep ? 'var(--lpl-white)' : 'var(--lpl-text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 'var(--font-size-base)',
              transition: 'all 0.3s ease'
            }}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 3 && (
              <div style={{
                width: '60px',
                height: '2px',
                background: step < currentStep ? 'var(--lpl-navy)' : 'var(--lpl-gray)',
                transition: 'all 0.3s ease'
              }}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Question Card */}
      <div className="card" style={{
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 className="card-title" style={{
            fontSize: 'var(--font-size-2xl)',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {currentQuestion.question}
          </h2>

          {/* Question 1: Focus Selection */}
          {currentStep === 1 && (
            <div className="quiz-options" style={{ marginTop: '2rem' }}>
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`quiz-option ${answers.focus === option.id ? 'selected' : ''}`}
                  onClick={() => handleAnswer(option.id)}
                  style={{
                    padding: '1.5rem',
                    fontSize: 'var(--font-size-lg)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{option.icon}</span>
                    <span style={{ fontWeight: 500 }}>{option.label}</span>
                    {answers.focus === option.id && (
                      <span style={{ marginLeft: 'auto', color: 'var(--lpl-green)', fontSize: '1.5rem' }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Question 2: Target Amount */}
          {currentStep === 2 && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <div style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 700,
                color: 'var(--lpl-navy)',
                marginBottom: '2rem'
              }}>
                ${answers.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              
              <input
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={answers.targetAmount}
                onChange={(e) => handleAnswer(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'var(--lpl-gray)',
                  outline: 'none',
                  marginBottom: '1rem'
                }}
              />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--lpl-text-light)',
                marginTop: '0.5rem'
              }}>
                <span>$10,000</span>
                <span>$1,000,000</span>
              </div>

              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'var(--lpl-gray)',
                borderRadius: 'var(--radius)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--lpl-text-light)'
              }}>
                💡 You can adjust this amount at any time in your settings
              </div>
            </div>
          )}

          {/* Question 3: Timeline */}
          {currentStep === 3 && (
            <div className="quiz-options" style={{ marginTop: '2rem' }}>
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`quiz-option ${answers.timeline === option.id ? 'selected' : ''}`}
                  onClick={() => handleAnswer(option.id)}
                  style={{
                    padding: '1.5rem',
                    fontSize: 'var(--font-size-lg)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{option.icon}</span>
                    <span style={{ fontWeight: 500 }}>{option.label}</span>
                    {answers.timeline === option.id && (
                      <span style={{ marginLeft: 'auto', color: 'var(--lpl-green)', fontSize: '1.5rem' }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '3rem',
          justifyContent: 'space-between'
        }}>
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{ flex: 1 }}
          >
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!isStepComplete()}
            style={{ flex: 2 }}
          >
            {currentStep === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;
