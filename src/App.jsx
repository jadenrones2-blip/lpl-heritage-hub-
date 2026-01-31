import React, { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import EchoAgent from './pages/EchoAgent';
import BridgeAgent from './pages/BridgeAgent';
import QuizPage from './pages/QuizPage';
import CaseDetail from './pages/CaseDetail';

function App() {
  const [activeTab, setActiveTab] = useState('quiz');

  return (
    <div className="app">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className={`main-content ${activeTab === 'bridge' ? 'bridge-view' : ''}`}>
        {activeTab === 'quiz' && <QuizPage setActiveTab={setActiveTab} />}
        {activeTab === 'echo' && <EchoAgent />}
        {activeTab === 'bridge' && <BridgeAgent />}
      </main>
    </div>
  );
}

export default App;
