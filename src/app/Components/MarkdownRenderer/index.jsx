// File Location: src/app/Components/MarkdownRenderer/index.jsx
"use client";
import React from 'react';

const MarkdownRenderer = ({ text }) => {
  // Split the text into lines
  const lines = text.split('\n');
  
  const elements = [];
  let listItems = [];

  lines.forEach((line, index) => {
    // Check if a line starts with a hyphen, indicating a list item
    if (line.trim().startsWith('-')) {
      listItems.push(line.replace(/^- /, '').trim());
    } else {
      // If we have accumulated list items, push them as a <ul>
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} style={{ paddingLeft: '20px', margin: '10px 0' }}>
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} style={{ color: '#e0e0e0', marginBottom: '5px' }}>{item}</li>
            ))}
          </ul>
        );
        listItems = []; // Reset the list
      }
      // Push the current line as a paragraph
      if (line.trim() !== '') {
        elements.push(<p key={`p-${index}`} style={{ margin: 0, color: '#e0e0e0' }}>{line}</p>);
      }
    }
  });

  // After the loop, check if there are any remaining list items
  if (listItems.length > 0) {
    elements.push(
      <ul key="ul-last" style={{ paddingLeft: '20px', margin: '10px 0' }}>
        {listItems.map((item, itemIndex) => (
          <li key={itemIndex} style={{ color: '#e0e0e0', marginBottom: '5px' }}>{item}</li>
        ))}
      </ul>
    );
  }

  return <div>{elements}</div>;
};

export default MarkdownRenderer;