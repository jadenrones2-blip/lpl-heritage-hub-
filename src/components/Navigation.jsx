import React from 'react';

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'quiz', label: 'Dashboard', description: 'Personalization Quiz' },
    { id: 'echo', label: 'Echo', description: 'Document Upload' },
    { id: 'bridge', label: 'Portfolio', description: 'Goals & Summary' },
  ];

  return (
    <nav className="nav">
      {tabs.map(tab => (
        <a
          key={tab.id}
          href="#"
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab(tab.id);
          }}
        >
          {tab.label}
          <span style={{ display: 'block', fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>
            {tab.description}
          </span>
        </a>
      ))}
    </nav>
  );
}

export default Navigation;
