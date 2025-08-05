// File Location: src/app/page.js
import React from 'react';
import AgentPage from './agent/page';

const Home = () => {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <AgentPage />
    </div>
  );
};

export default Home;