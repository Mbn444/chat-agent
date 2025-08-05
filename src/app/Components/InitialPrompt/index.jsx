// File Location: src/app/Components/InitialPrompt/index.jsx
"use client";
import { useState, useEffect } from 'react';
import { Typography, Input, Button } from 'antd';
import './styles.css'; // Import the stylesheet

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const headingPhrases = [
  'What do you want to build?',
  'Describe your vision...',
  "Let's create something amazing."
];

const suggestions = [
  'Create a financial app',
  'Design a directory website',
  'Build a project management app',
  'Make a landing page',
  'Generate a CRM',
  'Build a mobile app'
];

const InitialPrompt = ({ onStartChat }) => {
  const [idea, setIdea] = useState('');
  const [isAnimated, setIsAnimated] = useState(false);
  const [headingIndex, setHeadingIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const bubbleTimer = setTimeout(() => { setIsAnimated(true); }, 100);
    return () => clearTimeout(bubbleTimer);
  }, []);

  useEffect(() => {
    const displayTimer = setTimeout(() => { setIsFading(true); }, 4000);
    const changeTextTimer = setTimeout(() => {
      setHeadingIndex((prevIndex) => (prevIndex + 1) % headingPhrases.length);
      setIsFading(false);
    }, 4500);
    return () => { clearTimeout(displayTimer); clearTimeout(changeTextTimer); };
  }, [headingIndex]);

  const handleStart = () => { if (idea.trim()) { onStartChat(idea); } };
  const handleBubbleClick = (suggestionText) => { setIdea(suggestionText); };

  const renderBubble = (text, index) => {
    const baseStyle = {
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: '#e0e0e0',
      transition: 'transform 0.6s ease-out, opacity 0.6s ease-out, background-color 0.2s ease, border-color 0.2s ease',
      cursor: 'pointer',
    };
    const animationStyle = {
      transform: isAnimated ? 'translateX(0)' : 'translateX(-500px)',
      opacity: isAnimated ? 1 : 0,
      transitionDelay: isAnimated ? `${index * 80}ms` : '0ms',
    };
    return (
      <Button
        key={text}
        onClick={() => handleBubbleClick(text)}
        style={{ ...baseStyle, ...animationStyle }}
        className="suggestion-bubble"
      >
        {text}
      </Button>
    );
  };

  return (
    <div className="initial-prompt-container">
      <style jsx global>{`
        .suggestion-bubble:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
        }
        .suggestion-bubble:active {
          transform: ${isAnimated ? 'translateX(0) scale(0.95)' : 'translateX(-500px) scale(0.95)'} !important;
        }
      `}</style>
      <Title
        level={1}
        className="initial-prompt-title"
        style={{
          color: '#ffffff', marginBottom: '1rem', height: '80px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.5s ease-in-out', opacity: isFading ? 0 : 1,
        }}
      >
        {headingPhrases[headingIndex]}
      </Title>
      {/* --- THIS IS THE UPDATED PART --- */}
      <Paragraph className="initial-prompt-paragraph" style={{ color: '#a0a0a0', fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center' }}>
        Create stunning apps & websites by chatting with AI.
      </Paragraph>
      {/* --- END OF UPDATE --- */}
      <TextArea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Type your idea and we'll bring it to life (e.g., 'a fitness tracking app for hikers')"
        autoSize={{ minRows: 4, maxRows: 8 }}
        style={{ fontSize: '1rem', marginBottom: '2rem' }}
      />
      <div className="suggestion-bubbles-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {renderBubble(suggestions[0], 0)}
          {renderBubble(suggestions[1], 1)}
          {renderBubble(suggestions[2], 2)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {renderBubble(suggestions[3], 3)}
          {renderBubble(suggestions[4], 4)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {renderBubble(suggestions[5], 5)}
        </div>
      </div>
      {/* --- THIS IS THE UPDATED PART --- */}
      <div style={{ textAlign: 'center' }}>
        <Button type="primary" size="large" onClick={handleStart} disabled={!idea.trim()}>
          Start Building
        </Button>
      </div>
      {/* --- END OF UPDATE --- */}
    </div>
  );
};

export default InitialPrompt;