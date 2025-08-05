"use client";
import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography, Card, List, Divider, Empty, Modal } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import HubSpotForm from '@/app/Components/HubSpotForm';

const { Title, Paragraph } = Typography;

const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
};

const SectionTitle = ({ children }) => (
  <Title level={5} style={{ color: '#a0a0a0', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {children}
  </Title>
);

const SummaryPage = () => {
  const [summary, setSummary] = useState({ core: [], audience: [], features: [] });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const [width] = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const storedSummary = localStorage.getItem('finalSummary');
    if (storedSummary) {
      try {
        const parsedSummary = JSON.parse(storedSummary);
        if (parsedSummary) {
          setSummary(parsedSummary);
        }
      } catch (error) {
        console.error("Failed to parse final summary:", error);
        setSummary({ core: [], audience: [], features: [] });
      }
    }
  }, []);

  const handleGoBack = () => {
    router.push('/');
  };

  const showHubSpotModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const hasContent = summary.core?.length > 0 || summary.audience?.length > 0 || summary.features?.length > 0;

  const summaryPageStyle = {
    height: '100vh',
    width: '100vw',
    padding: isMobile ? '1.5rem' : '3rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'radial-gradient(ellipse at top, rgba(10, 228, 166, 0.15), #141414 70%)',
    backgroundColor: '#141414',
    color: '#ffffff',
    overflowY: 'auto'
  };

  const contentWrapperStyle = {
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  };

  const cardStyle = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#171717',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  const cardBodyStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.5rem',
  };

  return (
    <div style={summaryPageStyle}>
      <div style={contentWrapperStyle}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
          style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '2rem', alignSelf: 'flex-start' }}
        >
          Back to Analyst
        </Button>
        <Title level={isMobile ? 2 : 1} style={{ color: '#ffffff' }}>Project Requirements Summary</Title>
        <Paragraph style={{ color: '#a0a0a0', fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '2rem' }}>
          Here is the final list of features you have selected for your application.
        </Paragraph>
        <Card style={cardStyle} bodyStyle={cardBodyStyle}>
          {hasContent ? (
            <>
              {summary.core && summary.core.length > 0 && (
                <>
                  <SectionTitle>Project Core</SectionTitle>
                  <List
                    dataSource={summary.core}
                    renderItem={(item) => <List.Item style={{ border: 'none', padding: '4px 0', color: '#e0e0e0' }}>• {item}</List.Item>}
                  />
                </>
              )}
              {summary.audience && summary.audience.length > 0 && (
                <>
                  <SectionTitle>Target Audience</SectionTitle>
                  <List
                    dataSource={summary.audience}
                    renderItem={(item) => <List.Item style={{ border: 'none', padding: '4px 0', color: '#e0e0e0' }}>• {item}</List.Item>}
                  />
                </>
              )}
              {summary.features && summary.features.length > 0 && (
                <>
                  <SectionTitle>Selected Features</SectionTitle>
                  <List
                    dataSource={summary.features}
                    renderItem={(item, index) => (
                      <List.Item style={{ borderBottom: '1px solid #303030', padding: '16px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <span style={{ color: '#a0a0a0', marginRight: '16px', fontSize: '0.9rem', width: '25px', textAlign: 'right' }}>
                            {`${index + 1}.`}
                          </span>
                          <span style={{ color: '#e0e0e0', fontSize: '1rem', flex: 1 }}>
                            {item}
                          </span>
                        </div>
                      </List.Item>
                    )}
                    bordered={false}
                  />
                </>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Empty description={<span style={{ color: '#a0a0a0' }}>No features were selected.</span>} />
            </div>
          )}
        </Card>
        <Divider style={{ borderColor: 'transparent', margin: '1rem 0' }} />
        <Button
          type="primary"
          size="large"
          onClick={showHubSpotModal}
          style={{ minHeight: '50px' }}
        >
          Proceed to Next Step
        </Button>
      </div>
      <Modal
        title="Contact Information"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <HubSpotForm />
      </Modal>
    </div>
  );
};

export default SummaryPage;