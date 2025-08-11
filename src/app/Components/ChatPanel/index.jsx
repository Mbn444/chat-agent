'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar } from 'antd';
import { UserOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import { TypeAnimation } from 'react-type-animation';
import './styles.css';

const ChatPanel = ({ messages, onSendMessage, loading }) => {
  const [inputValue, setInputValue] = useState('');
  const listContainerRef = useRef(null);

  useEffect(() => {
    const container = listContainerRef.current;
    if (container) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages]);


  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const getConversationalPart = (text) => {
    if (!text) return '';
    const dataBlockIndex = text.search(/PROJECT CORE|TARGET AUDIENCE|FEATURES|Requirements:/i);
    if (dataBlockIndex !== -1) {
      return text.substring(0, dataBlockIndex).trim();
    }
    return text.trim();
  };

  // --- FIX #1: Get the ID of the last message in a stable way ---
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  return (
    <div className="chatPanel">
      <div ref={listContainerRef} className="messageList">
        <List
          dataSource={messages}
          renderItem={(item) => {
            // --- FIX #2: Make the check for the last message robust by comparing stable IDs ---
            const isLastMessage = item.id === lastMessageId;
            const isAI = item.role === 'assistant';
            
            let displayContent = item.content; // Default for user messages
            if (isAI) {
                let conversationalPart = getConversationalPart(item.content);
                // Clean the AI's text from any unwanted markdown characters
                displayContent = conversationalPart.replace(/^"|"$|[*_`]/g, '').trim();
            }

            return (
              <List.Item key={item.id} className="messageItem">
                <List.Item.Meta
                  avatar={
                    isAI ? (
                      <Avatar
                        style={{ backgroundColor: '#171717', border: '1px solid #00C26C' }}
                        icon={<RobotOutlined style={{ color: '#00C26C' }} />}
                      />
                    ) : (
                      <Avatar style={{ backgroundColor: '#333' }} icon={<UserOutlined />} />
                    )
                  }
                  title={<span className="messageTitle">{isAI ? 'AI Business Analyst' : 'You'}</span>}
                  description={
                    // --- FIX #3: The final, most important fix ---
                    // Render the animation component ONLY if it's the last AI message AND the content is ready.
                    // This prevents it from rendering in an intermediate state and getting interrupted.
                    isAI && isLastMessage && displayContent.length > 0 ? (
                      <TypeAnimation
                        key={item.id}
                        sequence={[displayContent]}
                        wrapper="p"
                        speed={70}
                        cursor={true}
                        style={{ margin: 0, color: '#e0e0e0', whiteSpace: 'pre-wrap' }}
                      />
                    ) : (
                      <p className="messageContent">{displayContent}</p>
                    )
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>

      <div className="inputContainer">
        <Input
          className="chatInput"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={!loading ? handleSend : undefined}
          placeholder="Tell me about your app idea..."
          disabled={loading}
          autoFocus
        />
        <Button
          className="chatSendButton"
          type="primary"
          onClick={handleSend}
          loading={loading}
          icon={<SendOutlined />}
        />
      </div>
    </div>
  );
};

export default ChatPanel;