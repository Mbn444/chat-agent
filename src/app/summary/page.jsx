"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography, Modal, Empty, List, Row, Col } from 'antd';
import { ArrowLeftOutlined, BulbOutlined, ToolOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import HubSpotForm from '@/app/Components/HubSpotForm';

const { Title, Paragraph, Text } = Typography;

const SectionCard = ({ title, children }) => (
  <div style={{ backgroundColor: '#1C1C1C', padding: '24px', borderRadius: '12px', border: '1px solid #2a2a2a', height: '100%' }}>
    <Title level={4} style={{ color: '#E0E0E0', marginTop: 0, marginBottom: '16px' }}>{title}</Title>
    {children}
  </div>
);

const RatingSection = ({ title, rating, description }) => (
  <div style={{ marginBottom: '16px' }}>
    <Text style={{ color: '#E0E0E0', fontSize: '1.1rem', fontWeight: 500 }}>{title}</Text>
    <Paragraph style={{ color: '#00C26C', margin: '4px 0', fontSize: '1rem' }}>Rating: {rating} out of 5</Paragraph>
    <Paragraph style={{ color: '#a0a0a0' }}>{description}</Paragraph>
  </div>
);

const GeneratingLoader = ({ loadingText }) => (
  <div style={{ textAlign: 'center', color: '#a0a0a0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <style jsx>{`
      .blinking-bulb {
        font-size: 120px; 
        animation: pulseAnimation 2s infinite ease-in-out;
      }
      @keyframes pulseAnimation {
        0%, 100% { color: #444; text-shadow: none; }
        50% { color: #FFD700; text-shadow: 0 0 10px #FFD700, 0 0 25px #FFD700, 0 0 50px rgba(255, 215, 0, 0.8); }
      }
    `}</style>
    <BulbOutlined className="blinking-bulb" />
    <Title level={2} style={{ color: '#E0E0E0', marginTop: '40px' }}>{loadingText}</Title>
  </div>
);

const CodeHighlighter = ({ codeString }) => {
  if (!codeString) return null;
  const highlighted = codeString.replace(
    /\b(import|class|extends|final|const|Widget|build|return|@override|List|String|int|bool|void|from|export|default|function|useState|useEffect)\b|(\/\/.*)|('.*?')|([A-Z][a-zA-Z0-9_]*)/g,
    (match, keyword, comment, string, type) => {
      if (keyword) return `<span class="token-keyword">${match}</span>`;
      if (comment) return `<span class="token-comment">${match}</span>`;
      if (string) return `<span class="token-string">${match}</span>`;
      if (type) return `<span class="token-type">${match}</span>`;
      return match;
    }
  );
  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      <style jsx>{`
        pre { background: #111; padding: 1.5rem; border-radius: 8px; font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; text-align: left; height: 100%; margin: 0; box-sizing: border-box; }
        :global(.token-keyword) { color: #c586c0; }
        :global(.token-type) { color: #4ec9b0; }
        :global(.token-string) { color: #ce9178; }
        :global(.token-comment) { color: #6a9955; font-style: italic; }
      `}</style>
    </pre>
  );
};

const CodeCTASection = ({ projectBlueprint, codeSnippet, onActionClick }) => (
  <div id="cta-section" style={{ backgroundColor: '#1C1C1C', padding: '32px', borderRadius: '12px', border: '1px solid #2a2a2a', marginTop: '48px', textAlign: 'center' }}>
    <Title level={2} style={{ color: '#E0E0E0', marginTop: 0, marginBottom: '24px' }}>Project Blueprint Initialized</Title>
    <Row gutter={24} style={{ textAlign: 'left' }}>
      <Col xs={24} md={12} style={{ marginBottom: '24px' }}>
        <pre style={{ 
          background: '#111', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          fontSize: '0.9rem', 
          lineHeight: '1.6', 
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word', 
          height: '100%', 
          margin: 0 
        }}>
          <code>{JSON.stringify(projectBlueprint, null, 2)}</code>
        </pre>
      </Col>
      <Col xs={24} md={12}>
        <CodeHighlighter codeString={codeSnippet} />
      </Col>
    </Row>
    <Paragraph style={{ color: '#a0a0a0', margin: '24px auto', fontSize: '1.1rem', maxWidth: '700px' }}>
      This is just the beginning. Our team is ready to turn this blueprint into a fully functional product. Let's talk about the next steps.
    </Paragraph>
    <Button
      type="primary"
      size="large"
      onClick={onActionClick}
      style={{ background: '#00C26C', borderColor: '#00C26C', minHeight: '50px', fontWeight: '500', padding: '0 32px' }}
      icon={<ToolOutlined />}
      className="animated-finalize-button"
    >
      Request a Project Proposal
    </Button>
  </div>
);

const SummaryPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Generating Persona & Blueprint...');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const isVisible = window.scrollY > 200;
      setShowScrollButton(isVisible);
      const bottomThreshold = 50;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - bottomThreshold;
      setIsAtBottom(atBottom);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollClick = () => {
    if (isAtBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const ctaSection = document.getElementById('cta-section');
      if (ctaSection) {
        ctaSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  };

  useEffect(() => {
    const storedSummary = localStorage.getItem('finalSummary');
    if (storedSummary) {
      try {
        const parsedSummary = JSON.parse(storedSummary);
        generateAnalysis(parsedSummary);
      } catch (error) {
        console.error("Failed to parse summary.", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    const textAnimation = [
        'Generating Persona & Blueprint...',
        'Analyzing User Persona...',
        'Mapping Pain Points & Delights...',
        'Initializing Project Code...',
        'Finalizing Analysis...'
    ];
    let textIndex = 0;
    const intervalId = setInterval(() => {
      textIndex = (textIndex + 1) % textAnimation.length;
      setLoadingText(textAnimation[textIndex]);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const generateAnalysis = async (summary) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error("Failed to generate analysis:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoBack = () => {
    router.push('/agent?reset=true');
  };

  const showHubSpotModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  const hasContent = !!analysis;

  return (
    <>
      <style jsx global>{`
        .scroll-to-button {
          position: fixed;
          bottom: 40px;
          right: 40px;
          z-index: 1000;
          height: 56px;
          width: 56px;
          border-radius: 50%;
          background-color: #00C26C;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.3s ease;
          opacity: ${showScrollButton ? 1 : 0};
          transform: ${showScrollButton ? 'scale(1)' : 'scale(0.8)'};
          pointer-events: ${showScrollButton ? 'auto' : 'none'};
        }
        .scroll-to-button:hover {
          background-color: #00b361;
          transform: scale(1.1);
        }
        .scroll-icon {
          font-size: 24px;
          color: white;
        }
        .breathing-circle {
          position: absolute;
          height: 100%;
          width: 100%;
          border-radius: 50%;
          border: 2px solid rgba(0, 194, 108, 0.7);
          animation: breath 2.5s infinite ease-in-out;
        }
        @keyframes breath {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
      <div style={{ width: '100%', minHeight: '100vh', padding: '3rem', boxSizing: 'border-box', background: 'radial-gradient(ellipse at top, rgba(10, 228, 166, 0.15), #141414 70%)', backgroundColor: '#141414', color: '#ffffff' }}>
        <div id="page-top" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '2rem' }}
          >
            Back to Analyst
          </Button>
          
          <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {isLoading && <GeneratingLoader loadingText={loadingText} />}

            {!isLoading && hasContent && (
              <>
                <Title level={1} style={{ color: '#ffffff' }}>Here is your App Analysis</Title>
                <Paragraph style={{ color: '#a0a0a0', fontSize: '1.1rem', marginBottom: '2rem' }}>
                  Based on your project requirements, we've generated a detailed analysis of your ideal user.
                </Paragraph>
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}><SectionCard title="Brief Description"><Paragraph style={{ color: '#e0e0e0', lineHeight: 1.7 }}>{analysis.briefDescription}</Paragraph></SectionCard></Col>
                  <Col xs={24} lg={12}><SectionCard title="Pain Points & Delights"><Title level={5} style={{ color: '#e0e0e0' }}>Pain Points:</Title><List dataSource={analysis.painPoints} renderItem={(item) => <List.Item style={{ border: 'none', padding: '4px 0', color: '#e0e0e0' }}>• {item}</List.Item>} /><Title level={5} style={{ color: '#e0e0e0', marginTop: '16px' }}>Delights:</Title><List dataSource={analysis.delights} renderItem={(item) => <List.Item style={{ border: 'none', padding: '4px 0', color: '#e0e0e0' }}>• {item}</List.Item>} /></SectionCard></Col>
                  <Col xs={24} lg={12}><SectionCard title="Triggers & Barriers"><Title level={5} style={{ color: '#e0e0e0' }}>Triggers:</Title><List dataSource={analysis.triggers} renderItem={(item) => <List.Item style={{ border: 'none', padding: '4px 0', color: '#e0e0e0' }}>• {item}</List.Item>} /><Title level={5} style={{ color: '#e0e0e0', marginTop: '16px' }}>Barriers:</Title><List dataSource={analysis.barriers} renderItem={(item) => <List.Item style={{ border: 'none', padding: '4px 0', color: '#e0e0e0' }}>• {item}</List.Item>} /></SectionCard></Col>
                  <Col xs={24} lg={12}><SectionCard title="Ratings"><RatingSection title="Segment Size" {...analysis.ratings.segmentSize} /><RatingSection title="Willingness to Buy" {...analysis.ratings.willingnessToBuy} /><RatingSection title="Accessibility" {...analysis.ratings.accessibility} /></SectionCard></Col>
                </Row>
                
                <CodeCTASection projectBlueprint={analysis.projectBlueprint} codeSnippet={analysis.codeSnippet} onActionClick={showHubSpotModal} />
              </>
            )}

            {!isLoading && !hasContent && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <Empty description={<><Title level={4} style={{color: '#a0a0a0'}}>Could not generate analysis.</Title><Paragraph style={{color: '#707070'}}>Please go back and ensure you have defined your project requirements.</Paragraph></>} />
              </div>
            )}
          </div>
        </div>
        <Modal title="Request a Project Proposal" open={isModalVisible} onCancel={handleCancel} footer={null} width={600} centered>
          <HubSpotForm />
        </Modal>
      </div>
      {showScrollButton && (
        <button onClick={handleScrollClick} className="scroll-to-button">
          <div className="breathing-circle" />
          {isAtBottom ? <ArrowUpOutlined className="scroll-icon" /> : <ArrowDownOutlined className="scroll-icon" />}
        </button>
      )}
    </>
  );
};

export default SummaryPage;