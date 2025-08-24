'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar } from 'antd';
import { UserOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import { TypeAnimation } from 'react-type-animation';
import './styles.css';

const ChatPanel = ({ messages, onSendMessage, loading }) => {
  const [inputValue, setInputValue] = useState('');
  const listContainerRef = useRef(null);
  
  // --- MODIFICATION START ---
  // Create a ref for the input field
  const inputRef = useRef(null);
  // --- MODIFICATION END ---

  const getConversationalPart = (text) => {
    if (!text) return '';
    const dataBlockIndex = text.search(/PROJECT CORE|TARGET AUDIENCE|FEATURES|CURRENT REQUIREMENTS|Requirements:/i);
    const featureListIndex = text.search(/\n\s*(\d+\.|-|\*)\s+/);
    let endIndex = -1;
    if (dataBlockIndex !== -1 && featureListIndex !== -1) {
      endIndex = Math.min(dataBlockIndex, featureListIndex);
    } else if (dataBlockIndex !== -1) {
      endIndex = dataBlockIndex;
    } else if (featureListIndex !== -1) {
      endIndex = featureListIndex;
    }
    if (endIndex !== -1) {
      return text.substring(0, endIndex).trim();
    }
    return text.trim();
  };
  
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
        });
    };
    
    if (loading) {
        const intervalId = setInterval(scrollToBottom, 100);
        return () => clearInterval(intervalId);
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
        let scrollInterval;
        let timeoutId;

        scrollInterval = setInterval(scrollToBottom, 100);
        const conversationalPart = getConversationalPart(lastMessage.content);
        const animationSpeed = 70;
        const estimatedDuration = conversationalPart.length * animationSpeed + 1000;

        timeoutId = setTimeout(() => {
            clearInterval(scrollInterval);
            scrollToBottom(); 
        }, estimatedDuration);

        return () => {
            clearInterval(scrollInterval);
            clearTimeout(timeoutId);
        };
    } else {
        scrollToBottom();
    }
  }, [messages, loading]);
  
  // --- MODIFICATION START ---
  // This new useEffect hook will handle auto-focusing the input.
  useEffect(() => {
    // If the AI has just finished responding (loading is false)
    // and the input ref is available, focus it.
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]); // This effect runs every time the 'loading' state changes.
  // --- MODIFICATION END ---


  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  return (
    <div className="chatPanel">
        <style jsx global>{`
            .typing-indicator {
                display: flex;
                align-items: center;
                padding: 10px 0;
            }
            .typing-indicator span {
                height: 8px;
                width: 8px;
                background-color: #a0a0a0;
                border-radius: 50%;
                display: inline-block;
                margin: 0 2px;
                animation: bounce 1.2s infinite ease-in-out;
            }
            .typing-indicator span:nth-child(2) {
                animation-delay: -0.2s;
            }
            .typing-indicator span:nth-child(3) {
                animation-delay: -0.4s;
            }
            @keyframes bounce {
                0%, 80%, 100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1.0);
                }
            }
        `}</style>

      <div ref={listContainerRef} className="messageList">
        <List
          dataSource={messages}
          renderItem={(item) => {
            const isLastMessage = item.id === lastMessageId;
            const isAI = item.role === 'assistant';
            
            let displayContent = item.content;
            if (isAI) {
                let conversationalPart = getConversationalPart(item.content);
                displayContent = conversationalPart.replace(/^"|"$|[*_`#]/g, '').trim();
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

        {loading && (
          <List.Item className="messageItem">
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: '#171717', border: '1px solid #00C26C' }}
                  icon={<RobotOutlined style={{ color: '#00C26C' }} />}
                />
              }
              title={<span className="messageTitle">AI Business Analyst</span>}
              description={
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              }
            />
          </List.Item>
        )}
      </div>

      <div className="inputContainer">
        <Input
          // --- MODIFICATION START ---
          // Assign the ref to the Ant Design Input component
          ref={inputRef}
          // --- MODIFICATION END ---
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