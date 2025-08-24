"use client";
import { useRef, useEffect } from 'react';
import { Card, Checkbox, Space, Button, Divider, Typography, Tooltip } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import Typewriter from '@/app/Components/Typewriter';
import './styles.css';

const { Title, Text } = Typography;

// Utility: Convert numbers to Roman numerals
const toRoman = (num) => {
  if (num < 1 || num > 3999) return num; // Basic validation
  const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let str = '';
  for (let i in roman) {
    let q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str;
};

// Reusable Section Title
const SectionTitle = ({ children }) => (
  <Title level={5} style={{
    color: '#a0a0a0',
    marginTop: '20px',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }}>
    {children}
  </Title>
);

const RequirementsPanel = ({
  requirements,
  onRequirementToggle,
  onFinalize,
  onToggleAllFeatures
}) => {
  const requirementsEndRef = useRef(null);

  // Auto-scroll to bottom when requirements update
  useEffect(() => {
    if (requirementsEndRef.current) {
      requirementsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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

  const hasProjectCore = requirements?.projectCore?.length > 0;
  const hasTargetAudience = requirements?.targetAudience?.length > 0;
  const hasFeatures = requirements?.features?.length > 0;

  const hasAnyData = hasProjectCore || hasTargetAudience || hasFeatures;

  const hasSelectedFeatures = hasFeatures && requirements.features.some(f => f.checked);
  const allFeaturesChecked = hasFeatures && requirements.features.every(f => f.checked);
  const someFeaturesChecked = hasFeatures && !allFeaturesChecked;

  return (
    <Card
      title="User Requirements"
      style={cardStyle}
      styles={cardStyles}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '1rem' }}>
        {hasAnyData ? (
          <>
            {/* PROJECT CORE */}
            {hasProjectCore && (
              <>
                <SectionTitle>Project Core</SectionTitle>
                {/* This filter ensures Name and Email are not displayed in the UI */}
                {requirements.projectCore.filter(item => item.key !== 'Name' && item.key !== 'Email').map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      color: '#e0e0e0',
                      paddingLeft: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ marginRight: '8px', marginTop: '4px' }}>•</span>
                    <div>
                      <Text strong style={{ color: '#e0e0e0' }}>{item.key}: </Text>
                      <Typewriter text={item.value} animate={false} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* TARGET AUDIENCE */}
            {hasTargetAudience && (
              <>
                <SectionTitle>Target Audience</SectionTitle>
                {requirements.targetAudience.map((audience, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      color: '#e0e0e0',
                      paddingLeft: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ marginRight: '8px', marginTop: '4px' }}>•</span>
                    <Typewriter text={audience} animate={false} />
                  </div>
                ))}
              </>
            )}

            {/* FEATURES */}
            {hasFeatures && (
              <>
                <SectionTitle>
                  <Checkbox
                    checked={allFeaturesChecked}
                    indeterminate={someFeaturesChecked}
                    onChange={onToggleAllFeatures}
                    style={{ color: '#a0a0a0' }}
                  >
                    Suggested Features for your App
                  </Checkbox>
                </SectionTitle>

                <Space direction="vertical" style={{ width: '100%', paddingLeft: '20px' }}>
                  {requirements.features.map((req, index) => {
                    const featureText = req.text.replace(/^\d+\.\s*\**|\**$/g, '').trim();
                    return (
                      <Checkbox
                        key={req.id}
                        checked={req.checked}
                        onChange={() => onRequirementToggle(req.id)}
                        style={{
                          color: '#e0e0e0',
                          fontSize: '0.95rem',
                          lineHeight: '1.5'
                        }}
                      >
                        {`• ${featureText}`}
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

      {/* FINALIZE BUTTON */}
      <div style={{ flexShrink: 0, paddingTop: '1rem' }}>
        <Divider style={{ margin: '0 0 1rem 0', backgroundColor: '#303030' }} />
        <Tooltip
          title={!hasSelectedFeatures ? "Please select at least one feature to proceed." : ""}
          placement="top"
        >
          <div style={{ width: '100%' }}>
            <Button
              type="primary"
              block
              onClick={onFinalize}
              size="large"
              disabled={!hasSelectedFeatures}
              style={{
                minHeight: '50px',
                fontWeight: '500',
              }}
              className={hasSelectedFeatures ? "animated-finalize-button" : ""}
            >
              Finalize & Launch Project
              <RocketOutlined style={{ marginLeft: '10px', fontSize: '1.1rem' }} />
            </Button>
          </div>
        </Tooltip>
      </div>
    </Card>
  );
};

export default RequirementsPanel;