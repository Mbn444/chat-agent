// File Location: src/app/agent/page.jsx
"use client";
import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ChatPanel from '@/app/Components/ChatPanel';
import RequirementsPanel from '@/app/Components/RequirementsPanel';
import InitialPrompt from '@/app/Components/InitialPrompt';

const { Title } = Typography;

const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() { setSize([window.innerWidth, window.innerHeight]); }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
};

const agentPageStyle = {
  height: '100%',
  width: '100%',
  padding: '3rem 2rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  background: 'radial-gradient(ellipse at top, rgba(10, 228, 166, 0.15), #141414 70%)',
  backgroundColor: '#141414',
};

const headingPhrases = ['AI Business Analyst', 'Enter Your Requirements'];

const parseRequirements = (text) => {
  const sections = {
    projectCore: [],
    targetAudience: [],
    features: [],
  };
  if (!text) return sections;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let currentSection = null;
  lines.forEach(line => {
    if (line.toLowerCase().includes('1. project core')) {
      currentSection = 'projectCore';
    } else if (line.toLowerCase().includes('2. target audience')) {
      currentSection = 'targetAudience';
    } else if (line.toLowerCase().includes('3. features')) {
      currentSection = 'features';
    } else if (currentSection) {
      const formattedLine = line.trim();
      if (currentSection === 'features') {
        sections.features.push({
          id: Date.now() + Math.random(),
          text: formattedLine,
          checked: false,
        });
      } else {
        sections[currentSection].push(formattedLine);
      }
    }
  });
  return sections;
};

const AgentPage = () => {
  const router = useRouter();
  const [width] = useWindowSize();
  const isMobile = width < 768;
  const [isClient, setIsClient] = useState(false);
  const [isChatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [requirements, setRequirements] = useState({
    projectCore: [],
    targetAudience: [],
    features: [],
  });
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const storedChatStarted = localStorage.getItem('chatStarted');
    if (storedChatStarted === 'true') {
      setChatStarted(true);
      const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
      let storedRequirements = { projectCore: [], targetAudience: [], features: [] };
      try {
        const rawReqs = localStorage.getItem('chatRequirements');
        if (rawReqs) storedRequirements = JSON.parse(rawReqs);
      } catch (e) {
        console.error("Could not parse requirements from localStorage", e);
      }
      setMessages(storedMessages);
      setRequirements(storedRequirements);
    }
  }, []);

  const clearChatState = () => {
    setChatStarted(false);
    setMessages([]);
    setRequirements({ projectCore: [], targetAudience: [], features: [] });
    setLoading(false);
    setText('');
    setIsDeleting(false);
    setLoopNum(0);
    localStorage.clear();
  };
  
  useEffect(() => {
    if (!isChatStarted) return;
    const currentPhrase = headingPhrases[loopNum % headingPhrases.length];
    const typingSpeed = isDeleting ? 75 : 150;
    const timeout = setTimeout(() => {
      const newText = isDeleting ? currentPhrase.substring(0, text.length - 1) : currentPhrase.substring(0, text.length + 1);
      setText(newText);
      if (!isDeleting && newText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && newText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    }, typingSpeed);
    return () => clearTimeout(timeout);
  }, [text, isDeleting, isChatStarted, loopNum]);

  const updateAndStoreMessages = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem('chatMessages', JSON.stringify(newMessages));
  };

  const updateAndStoreRequirements = (newRequirements) => {
    setRequirements(newRequirements);
    localStorage.setItem('chatRequirements', JSON.stringify(newRequirements));
  };
  
  const handleRequirementToggle = (idToToggle) => {
    const updatedFeatures = requirements.features.map(req =>
      req.id === idToToggle ? { ...req, checked: !req.checked } : req
    );
    updateAndStoreRequirements({ ...requirements, features: updatedFeatures });
  };

  const handleToggleAllFeatures = () => {
    const isIndeterminate = requirements.features.some(req => req.checked) && !requirements.features.every(req => req.checked);
    const shouldCheckAll = isIndeterminate || !requirements.features.every(req => req.checked);
    const updatedFeatures = requirements.features.map(req => ({
      ...req,
      checked: shouldCheckAll,
    }));
    updateAndStoreRequirements({ ...requirements, features: updatedFeatures });
  };

  const handleSendMessage = async (userInput) => {
    const selectedFeatures = requirements.features.filter(r => r.checked).map(r => r.text).join(', ');
    const contextMessage = selectedFeatures ? `(Context: The user has currently selected these features: ${selectedFeatures}). ${userInput}` : userInput;
    const newMessagesWithUser = [...messages, { role: 'user', content: contextMessage }];
    updateAndStoreMessages(newMessagesWithUser);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessagesWithUser }),
      });
      if (!response.ok) { throw new Error('API request failed'); }
      const data = await response.json();
      const aiMessage = data.reply;
      updateAndStoreMessages([...newMessagesWithUser, aiMessage]);

      if (aiMessage.content.toLowerCase().includes("requirements:")) {
        const requirementsText = aiMessage.content.split(/Requirements:/i)[1].trim();
        const parsedData = parseRequirements(requirementsText);
        const existingFeatureTexts = new Set(requirements.features.map(f => f.text));
        const uniqueNewFeatures = parsedData.features.filter(f => !existingFeatureTexts.has(f.text));
        updateAndStoreRequirements({
          projectCore: parsedData.projectCore.length > 0 ? parsedData.projectCore : requirements.projectCore,
          targetAudience: parsedData.targetAudience.length > 0 ? parsedData.targetAudience : requirements.targetAudience,
          features: [...requirements.features, ...uniqueNewFeatures]
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I couldn\'t connect to the AI.' };
      updateAndStoreMessages([...newMessagesWithUser, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (initialIdea) => {
    localStorage.setItem('chatStarted', 'true');
    setChatStarted(true);
    handleSendMessage(initialIdea);
  };
  
  const handleBackButtonClick = () => {
    clearChatState();
    router.push('/');
  };

  const handleFinalize = () => {
    const finalSummary = {
        core: requirements.projectCore,
        audience: requirements.targetAudience,
        features: requirements.features.filter(req => req.checked).map(req => req.text),
    };
    localStorage.setItem('finalSummary', JSON.stringify(finalSummary));
    router.push('/summary');
  };
  
  if (!isClient) {
    return null;
  }

  return (
    <div style={agentPageStyle}>
      {isChatStarted ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', position: 'relative', width: '100%', flexShrink: 0, height: '40px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ color: '#ffffff' }} />}
              onClick={handleBackButtonClick}
              style={{ position: 'absolute', left: '0', color: '#ffffff', fontSize: '1.2rem', zIndex: 10 }}
            />
            {/* --- THIS IS THE UPDATED PART --- */}
            <Title level={2} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
              {/* The blinking cursor is now removed from the main heading */}
              {text}
            </Title>
            {/* --- END OF UPDATE --- */}
          </div>
          <Row gutter={32} style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', flex: 1, minHeight: 0 }}>
            <Col
              span={isMobile ? 24 : 12}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <ChatPanel messages={messages} onSendMessage={handleSendMessage} loading={loading} />
            </Col>
            {!isMobile && (
              <Col span={12} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <RequirementsPanel 
                  requirements={requirements} 
                  onRequirementToggle={handleRequirementToggle}
                  onFinalize={handleFinalize}
                  onToggleAllFeatures={handleToggleAllFeatures}
                />
              </Col>
            )}
          </Row>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <InitialPrompt onStartChat={handleStartChat} />
        </div>
      )}
    </div>
  );
}

export default AgentPage;