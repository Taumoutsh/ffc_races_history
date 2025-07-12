import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';

const ComparisonChart = ({ data, onPointClick, cyclistName, defaultCyclistName, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Force re-render when data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [data, cyclistName, defaultCyclistName]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper function to parse French date format for sorting
  const parseFrenchDate = (dateStr) => {
    const monthMap = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = monthMap[parts[1]] || '01';
      const year = parts[2];
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateStr);
  };

  // Transform and sort data chronologically for the chart
  const chartData = (data || [])
    .filter(race => race.cyclistPosition && race.defaultPosition && 
             !isNaN(race.cyclistPosition) && !isNaN(race.defaultPosition))
    .sort((a, b) => parseFrenchDate(a.date) - parseFrenchDate(b.date));

  const handleClick = (data, index) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      onPointClick(clickedData);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const cyclistData = payload.find(p => p.dataKey === 'cyclistPosition');
      const defaultData = payload.find(p => p.dataKey === 'defaultPosition');
      
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '1rem', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '1rem', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '300px'
        }}>
          <p style={{fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '0.875rem'}}>{`📅 ${label}`}</p>
          <p style={{fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.75rem 0', fontWeight: '600'}}>{payload[0].payload.raceName}</p>
          
          {cyclistData && (
            <p style={{
              color: '#3b82f6', 
              fontWeight: '700', 
              fontSize: '1rem',
              margin: '0 0 0.5rem 0'
            }}>{`🚴‍♂️ ${cyclistName}: #${cyclistData.value}`}</p>
          )}
          
          {defaultData && (
            <p style={{
              color: '#10b981', 
              fontWeight: '700', 
              fontSize: '1rem',
              margin: '0 0 0.75rem 0'
            }}>{`⭐ ${defaultCyclistName}: #${defaultData.value}`}</p>
          )}
          
          <p style={{fontSize: '0.75rem', color: '#8b5cf6', margin: 0, fontWeight: '600'}}>👆 {t('ui.viewProfile')}</p>
        </div>
      );
    }
    return null;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 50,
        padding: '1rem'
      }}
      onClick={handleBackdropClick}
    >
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1.5rem', 
        maxWidth: '90rem', 
        width: '100%', 
        maxHeight: '90vh', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent'
        }}>
          {/* Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{
              fontSize: 'clamp(1.25rem, 3.5vw, 2rem)', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em'
            }}>⚔️ {t('comparison.title')}</h2>
            <button
              onClick={onClose}
              style={{
                color: '#64748b', 
                fontSize: '1.5rem', 
                background: 'rgba(248, 250, 252, 0.8)', 
                border: '1px solid rgba(226, 232, 240, 0.5)', 
                borderRadius: '0.75rem',
                cursor: 'pointer',
                width: '3rem',
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(248, 250, 252, 1)';
                e.target.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(248, 250, 252, 0.8)';
                e.target.style.color = '#64748b';
              }}
            >
              ×
            </button>
          </div>

          {/* Comparison Info */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '2rem'
          }}>
            <h3 style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: '700', color: '#1f2937', marginBottom: '1rem'}}>
              📊 {t('comparison.subtitle')}
            </h3>
            <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <div style={{width: '1rem', height: '0.25rem', background: '#3b82f6', borderRadius: '0.125rem'}}></div>
                <span style={{fontWeight: '600', color: '#374151'}}>{cyclistName}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <div style={{width: '1rem', height: '0.25rem', background: '#10b981', borderRadius: '0.125rem'}}></div>
                <span style={{fontWeight: '600', color: '#374151'}}>{defaultCyclistName} ⭐</span>
              </div>
              <div style={{color: '#64748b', fontWeight: '600'}}>
                {t('comparison.commonRaces')}: {chartData.length}
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div style={{height: 'clamp(350px, 45vh, 500px)'}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  key={`comparison-chart-${forceUpdate}`}
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  onClick={handleClick}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12, fontWeight: '600', fill: '#64748b' }}
                    axisLine={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
                  />
                  <YAxis 
                    label={{ value: t('chart.yAxisLabel'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: '700', fill: '#64748b' } }}
                    reversed={true}
                    domain={[1, 'dataMax']}
                    tick={{ fontSize: 12, fontWeight: '600', fill: '#64748b' }}
                    axisLine={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="line"
                    wrapperStyle={{ paddingBottom: '20px', fontWeight: '600' }}
                  />
                  
                  {/* Cyclist line */}
                  <Line 
                    type="monotone" 
                    dataKey="cyclistPosition" 
                    name={cyclistName}
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    strokeOpacity={1}
                    fill="none"
                    connectNulls={true}
                    isAnimationActive={false}
                    dot={{ 
                      fill: '#ffffff', 
                      stroke: '#3b82f6', 
                      strokeWidth: 3, 
                      r: 8, 
                      cursor: 'pointer'
                    }}
                    activeDot={{ 
                      r: 12, 
                      stroke: '#3b82f6', 
                      strokeWidth: 3, 
                      fill: '#ffffff'
                    }}
                  />
                  
                  {/* Default cyclist line */}
                  <Line 
                    type="monotone" 
                    dataKey="defaultPosition" 
                    name={`${defaultCyclistName} ⭐`}
                    stroke="#10b981" 
                    strokeWidth={3}
                    strokeOpacity={1}
                    fill="none"
                    connectNulls={true}
                    isAnimationActive={false}
                    dot={{ 
                      fill: '#ffffff', 
                      stroke: '#10b981', 
                      strokeWidth: 3, 
                      r: 8, 
                      cursor: 'pointer'
                    }}
                    activeDot={{ 
                      r: 12, 
                      stroke: '#10b981', 
                      strokeWidth: 3, 
                      fill: '#ffffff'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', 
              padding: '4rem 2rem', 
              color: '#6b7280',
              background: 'rgba(248, 250, 252, 0.5)',
              borderRadius: '1rem',
              border: '1px solid rgba(226, 232, 240, 0.5)'
            }}>
              <h3 style={{fontSize: 'clamp(1.125rem, 2.75vw, 1.5rem)', fontWeight: '700', marginBottom: '1rem', color: '#374151'}}>
                😔 {t('comparison.noCommonRaces')}
              </h3>
              <p style={{fontSize: '1rem', fontWeight: '600'}}>
                {cyclistName} and {defaultCyclistName} have not participated in any races together.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;