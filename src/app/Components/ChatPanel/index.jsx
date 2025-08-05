"use client";
import { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Spin, Avatar, Space } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import Typewriter from '@/app/Components/Typewriter';

const ChatPanel = ({ messages, onSendMessage, loading }) => {
  const [inputValue, setInputValue] = useState('');
  const handleSend = () => { if (inputValue.trim()) { onSendMessage(inputValue); setInputValue(''); } };

  // --- NEW: A more robust auto-scrolling logic ---
  const listContainerRef = useRef(null); // We now put the ref on the scrollable container itself

  const scrollToBottom = () => {
    if (listContainerRef.current) {
      // This is the most reliable way to scroll to the absolute bottom
      listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
    }
  };

  // This useEffect serves as a fallback for initial loads and non-animated messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Triggers when a new message is added
  // --- END of new scroll logic ---

  const panelStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#171717',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div style={panelStyle}>
      {/* The ref is now attached to this scrollable div */}
      <div ref={listContainerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '1rem' }}>
        <List
          dataSource={messages}
          renderItem={(item, index) => {
            const isLastMessage = index === messages.length - 1;
            const isAIMessage = item.role === 'assistant';

            return (
              <List.Item style={{ border: 'none' }}>
                <List.Item.Meta
                  avatar={isAIMessage ? <Avatar style={{ backgroundColor: '#1890ff' }} icon={<RobotOutlined />} /> : <Avatar icon={<UserOutlined />} />}
                  title={<span style={{ fontWeight: 600 }}>{isAIMessage ? 'AI Analyst' : 'You'}</span>}
                  description={
                    isAIMessage ? (
                      <Typewriter 
                        text={item.content} 
                        animate={isLastMessage}
                        // We pass the scroll function as a callback, but only for the last message
                        onUpdate={isLastMessage ? scrollToBottom : null} 
                      />
                    ) : (
                      <p style={{ margin: 0, color: '#e0e0e0' }}>{item.content}</p>
                    )
                  }
                />
              </List.Item>
            );
          }}
        />
        {/* The old target div is no longer needed */}
      </div>
      <div style={{ paddingTop: '1.5rem', marginTop: '1rem', borderTop: '1px solid #303030' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            style={{ border: 'none' }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSend}
            placeholder="Tell me about your app idea..."
            disabled={loading}
          />
          <Button type="primary" onClick={handleSend} loading={loading}>Send</Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default ChatPanel;