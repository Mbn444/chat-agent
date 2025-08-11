'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar } from 'antd';
import { UserOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import { TypeAnimation } from 'react-type-animation';
import './styles.css';

const ChatPanel = ({ messages, onSendMessage, loading }) => {
  const [inputValue, setInputValue] = useState('');
  const listContainerRef = useRef(null);

  // --- START OF THE FIX ---
  // We will wrap the scroll logic in a setTimeout to ensure it runs
  // AFTER React has rendered the new message to the screen.
  useEffect(() => {
    const container = listContainerRef.current;
    if (container) {
      // A small delay (even 1 millisecond is enough) pushes this to the end of the event queue.
      // This gives React time to update the DOM.
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth' // Use smooth scrolling for a better user experience
        });
      }, 100); // 100ms is a safe delay to ensure rendering is complete
    }
  }, [messages]);
  // --- END OF THE FIX ---


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

  return (
    <div className="chatPanel">
      <div ref={listContainerRef} className="messageList">
        <List
          dataSource={messages}
          renderItem={(item) => {
            const isLastMessage = messages.indexOf(item) === messages.length - 1;
            const isAI = item.role === 'assistant';
            const displayContent = isAI ? getConversationalPart(item.content) : item.content;

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