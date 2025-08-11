"use client";
import { useState, useEffect } from 'react';
import React from 'react';

const Typewriter = ({ text, animate = true, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!animate || !text) {
      setDisplayedText(text || '');
      setIsFinished(true);
      return;
    }

    setDisplayedText('');
    setIsFinished(false);

    let i = 0;
    let currentText = '';
    const intervalId = setInterval(() => {
      currentText += text[i];
      setDisplayedText(currentText);
      i++;

      if (i >= text.length) {
        clearInterval(intervalId);
        setIsFinished(true);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [text, animate]);

  useEffect(() => {
    if (onUpdate) {
      onUpdate();
    }
  }, [displayedText, onUpdate]);

  const renderTextWithFormatting = () => {
    const sourceText = animate ? displayedText : text;
    const lines = sourceText?.split('\n') || [];
    const elements = [];
    let listItems = [];

    const pushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ paddingLeft: '20px', margin: '10px 0' }}>
            {listItems.map((item, index) => (
              <li key={index} style={{ color: '#e0e0e0', marginBottom: '5px' }}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      if (line.trim().startsWith('-')) {
        listItems.push(line.replace(/^- /, '').trim());
      } else {
        pushList();
        if (line.trim() !== '') {
          elements.push(<p key={index} style={{ margin: 0, color: '#e0e0e0' }}>{line}</p>);
        }
      }
    });

    pushList();
    return elements;
  };

  return (
    <div>
      {renderTextWithFormatting()}
      {animate && !isFinished && <span className="cursor">_</span>}
      <style jsx global>{`
        @keyframes blink { 50% { opacity: 0; } }
        .cursor {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
};

export default Typewriter;
