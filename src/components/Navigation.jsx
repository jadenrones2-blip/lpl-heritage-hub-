import React from 'react';

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'echo', label: 'NIGO Tool', description: 'Document Intelligence' },
    { id: 'bridge', label: 'Portfolio Summarizer', description: 'Goals & Summary' },
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
