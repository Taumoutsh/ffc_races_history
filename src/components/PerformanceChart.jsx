import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';

const PerformanceChart = ({ data, onPointClick, cyclistName }) => {
  const { t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Use provided cyclist name or fallback
  const displayName = cyclistName || 'Cyclist';
  
  // Force re-render when data or cyclist changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [data, cyclistName]);
  
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
    .map(race => ({
      date: race.date,
      position: Number(race.position), // Ensure position is a number
      name: race.name,
      raceId: race.raceId
    }))
    .filter(race => race.position && !isNaN(race.position)) // Filter out invalid positions
    .sort((a, b) => parseFrenchDate(a.date) - parseFrenchDate(b.date));

  const handleClick = (data, index) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      onPointClick(clickedData);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '1rem', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '1rem', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '250px'
        }}>
          <p style={{fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '0.875rem'}}>{`📅 ${label}`}</p>
          <p style={{
            color: '#3b82f6', 
            fontWeight: '700', 
            fontSize: '1.125rem',
            margin: '0 0 0.5rem 0'
          }}>{`🏆 Position: ${payload[0].value}`}</p>
          <p style={{fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.75rem 0', fontWeight: '600'}}>{payload[0].payload.name}</p>
          <p style={{fontSize: '0.75rem', color: '#8b5cf6', margin: 0, fontWeight: '600'}}>👆 {t('ui.viewProfile')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{width: '100%', height: '28rem', padding: '1.5rem'}}>
      <h2 style={{
        fontSize: '1.75rem', 
        fontWeight: '800', 
        marginBottom: '1.5rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.025em'
      }}>
        📊 {displayName} - {t('chart.title')}
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          key={`chart-${forceUpdate}`}
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
          <Line 
            type="monotone" 
            dataKey="position" 
            stroke="#3b82f6" 
            strokeWidth={4}
            strokeOpacity={1}
            fill="none"
            connectNulls={true}
            isAnimationActive={false}
            dot={{ 
              fill: '#ffffff', 
              stroke: '#3b82f6', 
              strokeWidth: 4, 
              r: 10, 
              cursor: 'pointer'
            }}
            activeDot={{ 
              r: 14, 
              stroke: '#8b5cf6', 
              strokeWidth: 4, 
              fill: '#ffffff'
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;