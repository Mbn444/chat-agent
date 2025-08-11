"use client";

import { useState, useEffect, useLayoutEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Row, Col, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ChatPanel from '@/app/Components/ChatPanel';
import RequirementsPanel from '@/app/Components/RequirementsPanel';
import InitialPrompt from '@/app/Components/InitialPrompt';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// --- FIX: Import the UUID library ---
import { v4 as uuidv4 } from 'uuid';

const { Title } = Typography;

const AgentPageWrapper = () => (
    <Suspense fallback={<div style={{height: '100vh', width: '100%', backgroundColor: '#141414'}} />}>
        <AgentPage />
    </Suspense>
);

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
  height: '100vh',
  width: '100%',
  padding: '3rem 2rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  background: 'radial-gradient(ellipse at top, rgba(10, 228, 166, 0.15), #141414 70%)',
  backgroundColor: '#141414',
};

// --- FIX: Create a helper function to ensure all messages have a unique ID ---
const ensureMessageIds = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];
    return messages.map(msg => ({ ...msg, id: msg.id || uuidv4() }));
};

const AgentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [width] = useWindowSize();
  const isMobile = width < 768;
  const [isClient, setIsClient] = useState(false);
  const [isChatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [requirements, setRequirements] = useState({ projectCore: [], targetAudience: [], features: [] });
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const clearChatState = () => {
    setChatStarted(false);
    setMessages([]);
    setRequirements({ projectCore: [], targetAudience: [], features: [] });
    setLoading(false);
    localStorage.removeItem('sessionId');
    setSessionId(null);
  };

  useEffect(() => {
    setIsClient(true);
    const reset = searchParams.get('reset');
    if (reset === 'true') {
        clearChatState();
        router.replace('/agent');
        return;
    }
    const currentSessionId = localStorage.getItem('sessionId');
    if (currentSessionId) {
      setSessionId(currentSessionId);
      setChatStarted(true);
      const fetchData = async () => {
        setLoading(true);
        const docRef = doc(db, "sessions", currentSessionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // --- FIX: Ensure all messages from DB have IDs when they are loaded ---
          setMessages(ensureMessageIds(data.messages || []));
          setRequirements(data.requirements || { projectCore: [], targetAudience: [], features: [] });
        } else {
          clearChatState();
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [router, searchParams]);

  const handleSendMessage = async (userInput) => {
    // --- FIX: Add a unique ID to the user's message immediately ---
    const userMessage = { id: uuidv4(), role: 'user', content: userInput };
    
    // The current messages state already has IDs, so we can just add the new one.
    const currentMessages = [...messages, userMessage];
    
    setMessages(currentMessages);
    setLoading(true);

    try {
        const response = await fetch('/api/chat', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            // Send the messages with their IDs to the backend
            body: JSON.stringify({ messages: currentMessages, sessionId }) 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.newSessionId) { 
            setSessionId(data.newSessionId); 
            localStorage.setItem('sessionId', data.newSessionId); 
        }
        
        // --- FIX: Ensure the final list from the API has IDs ---
        // This makes sure the new AI message gets a stable ID.
        setMessages(ensureMessageIds(data.updatedMessages));
        setRequirements(data.updatedRequirements);

    } catch (error) {
        console.error('Failed to send message:', error);
        // Add an ID to the error message as well for consistency
        const errorMessage = { id: uuidv4(), role: 'assistant', content: `Sorry, there was an error. Please try again. \n(${error.message})` };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  };

  const handleStartChat = (initialIdea) => {
    clearChatState();
    setChatStarted(true);
    handleSendMessage(initialIdea);
  };

  const handleBackButtonClick = () => { clearChatState(); };

  const handleFinalize = () => {
    const finalSummary = {
      core: requirements.projectCore,
      audience: requirements.targetAudience,
      features: requirements.features.filter(req => req.checked).map(req => req.text)
    };
    localStorage.setItem('finalSummary', JSON.stringify(finalSummary));
    router.push('/summary');
  };

  const handleRequirementToggle = async (idToToggle) => {
    const updatedFeatures = requirements.features.map(req =>
      req.id === idToToggle ? { ...req, checked: !req.checked } : req
    );
    const newRequirements = { ...requirements, features: updatedFeatures };
    setRequirements(newRequirements);
    if (sessionId) {
      await setDoc(doc(db, "sessions", sessionId), { requirements: newRequirements }, { merge: true });
    }
  };

  const handleToggleAllFeatures = async () => {
    const shouldCheckAll = !requirements.features.every(req => req.checked);
    const updatedFeatures = requirements.features.map(req => ({ ...req, checked: shouldCheckAll }));
    const newRequirements = { ...requirements, features: updatedFeatures };
    setRequirements(newRequirements);
    if (sessionId) {
      await setDoc(doc(db, "sessions", sessionId), { requirements: newRequirements }, { merge: true });
    }
  };

  if (!isClient) return null;

  return (
    <div style={agentPageStyle}>
      {isChatStarted ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', position: 'relative', width: '100%', flexShrink: 0, height: '40px' }}>
            <Button type="text" icon={<ArrowLeftOutlined style={{ color: '#ffffff' }} />} onClick={handleBackButtonClick} style={{ position: 'absolute', left: '0', color: '#ffffff', fontSize: '1.2rem', zIndex: 10 }} />
            <Title level={2} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>AI Business Analyst</Title>
          </div>
          <Row gutter={32} style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', flex: 1, minHeight: 0 }}>
            <Col span={isMobile ? 24 : 12} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ChatPanel 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                loading={loading}
              />
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
};

export default AgentPageWrapper;