import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Login from './components/Login';
import EchoAgent from './pages/EchoAgent';
import BridgeAgent from './pages/BridgeAgent';
import SuccessMetrics from './components/SuccessMetrics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('echo');

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className={`main-content ${activeTab === 'bridge' ? 'bridge-view' : ''}`}>
        {activeTab === 'echo' && <SuccessMetrics />}
        <AnimatePresence mode="wait">
          {activeTab === 'echo' && (
            <motion.div
              key="echo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <EchoAgent />
            </motion.div>
          )}
          {activeTab === 'bridge' && (
            <motion.div
              key="bridge"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <BridgeAgent />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
