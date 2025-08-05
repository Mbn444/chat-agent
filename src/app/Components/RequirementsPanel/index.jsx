"use client";
import { useRef, useEffect } from 'react';
import { Card, Checkbox, Space, Button, Divider, Typography } from 'antd';
import Typewriter from '@/app/Components/Typewriter';

const { Title, Text } = Typography;

const toRoman = (num) => {
  const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let str = '';
  for (let i of Object.keys(roman)) {
    let q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str;
};

const SectionTitle = ({ children }) => (
  <Title level={5} style={{ color: '#a0a0a0', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {children}
  </Title>
);

const RequirementsPanel = ({ requirements, onRequirementToggle, onFinalize, onToggleAllFeatures }) => {
  const requirementsEndRef = useRef(null);
  const scrollToBottom = () => {
    requirementsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [requirements]);

  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#171717',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  const cardStyles = {
    header: {
      borderBottom: '1px solid #303030',
      padding: '0 1.5rem',
      flexShrink: 0,
    },
    body: {
      flex: 1,
      minHeight: 0,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
    },
  };

  const allFeaturesChecked = requirements.features && requirements.features.length > 0 && requirements.features.every(req => req.checked);
  const someFeaturesChecked = requirements.features && requirements.features.some(req => req.checked);
  const hasSelectedFeatures = someFeaturesChecked;
  const hasContent = requirements.projectCore?.length > 0 || requirements.targetAudience?.length > 0 || requirements.features?.length > 0;

  return (
    <Card
      title="User Requirements"
      style={cardStyle}
      styles={cardStyles}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '1rem' }}>
        {hasContent ? (
          <>
            {requirements.projectCore && requirements.projectCore.length > 0 && (
              <>
                <SectionTitle>Project Core</SectionTitle>
                {/* --- THIS IS THE UPDATED AND FIXED PART --- */}
                {requirements.projectCore.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', color: '#e0e0e0', paddingLeft: '8px', marginBottom: '8px' }}>
                    <span style={{ marginRight: '8px', marginTop: '4px' }}>•</span>
                    <Typewriter text={item} />
                  </div>
                ))}
              </>
            )}
            {requirements.targetAudience && requirements.targetAudience.length > 0 && (
              <>
                <SectionTitle>Target Audience</SectionTitle>
                {/* --- THIS IS THE UPDATED AND FIXED PART --- */}
                {requirements.targetAudience.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', color: '#e0e0e0', paddingLeft: '8px', marginBottom: '8px' }}>
                    <span style={{ marginRight: '8px', marginTop: '4px' }}>•</span>
                    <Typewriter text={item} />
                  </div>
                ))}
              </>
            )}
            {/* --- END OF UPDATE --- */}
            {requirements.features && requirements.features.length > 0 && (
              <>
                <SectionTitle>
                  <Checkbox
                    checked={allFeaturesChecked}
                    indeterminate={someFeaturesChecked && !allFeaturesChecked}
                    onChange={onToggleAllFeatures}
                    style={{ color: '#a0a0a0' }}
                  >
                    Features
                  </Checkbox>
                </SectionTitle>
                <Space direction="vertical" style={{ width: '100%', paddingLeft: '20px' }}>
                  {requirements.features.map((req, index) => {
                    const featureText = req.text.replace(/^\d+\.\s*/, '');
                    return (
                      <Checkbox
                        key={req.id}
                        checked={req.checked}
                        onChange={() => onRequirementToggle(req.id)}
                        style={{ color: '#e0e0e0', fontSize: '0.95rem', lineHeight: '1.5' }}
                      >
                        {`${toRoman(index + 1)}. ${featureText}`}
                      </Checkbox>
                    );
                  })}
                </Space>
              </>
            )}
          </>
        ) : (
          <p style={{ color: '#a0a0a0' }}>
            The user requirements will appear here as you chat with the AI analyst.
          </p>
        )}
        <div ref={requirementsEndRef} />
      </div>
      
      {hasSelectedFeatures && (
        <div style={{ flexShrink: 0, paddingTop: '1rem' }}>
          <Divider style={{ margin: '0 0 1rem 0', backgroundColor: '#303030' }} />
          <Button type="primary" block onClick={onFinalize}>
            Finalize Features
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RequirementsPanel;