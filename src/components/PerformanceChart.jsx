import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../contexts/LanguageContext';

const PerformanceChart = ({ data, onPointClick, cyclistName }) => {
  const { t } = useTranslation();
  // Use provided cyclist name or fallback
  const displayName = cyclistName || 'Cyclist';
  // Transform data for the chart
  const chartData = data.map(race => ({
    date: race.date,
    position: race.position,
    name: race.name,
    raceId: race.raceId
  }));

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
            stroke="url(#gradient)" 
            strokeWidth={4}
            dot={{ 
              fill: '#ffffff', 
              stroke: '#3b82f6', 
              strokeWidth: 4, 
              r: 10, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            activeDot={{ 
              r: 14, 
              stroke: '#8b5cf6', 
              strokeWidth: 4, 
              fill: '#ffffff',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
              animation: 'pulse 1.5s infinite'
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