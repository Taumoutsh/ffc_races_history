import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { calculatePercentagePosition, getPercentageColor, filterDataByYears } from '../utils/dateUtils';
import DateFilter from './DateFilter';

const PerformanceChart = ({ data, onPointClick, cyclistName, cyclistInfo, raceParticipantCounts, selectedYears, onYearsChange }) => {
  const { t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  
  // Use provided cyclist name or fallback
  const displayName = cyclistName || 'Cyclist';
  
  // Force re-render when data or cyclist changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
    setCurrentPage(0); // Reset to first page when data changes
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

  // Function to format dates for mobile display
  const formatDateForDisplay = (dateStr) => {
    if (window.innerWidth < 768) {
      // On mobile, show shorter format: "15 Jan" instead of "15 janvier 2024"
      const parts = dateStr.split(' ');
      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        // Convert French month to short English format for space
        const monthMap = {
          'janvier': 'Jan', 'février': 'Fév', 'mars': 'Mar', 'avril': 'Avr',
          'mai': 'Mai', 'juin': 'Jun', 'juillet': 'Jul', 'août': 'Aoû',
          'septembre': 'Sep', 'octobre': 'Oct', 'novembre': 'Nov', 'décembre': 'Déc'
        };
        return `${day} ${monthMap[month] || month}`;
      }
    }
    return dateStr;
  };

  // Filter and transform data chronologically for the chart
  const filteredData = selectedYears && onYearsChange ? filterDataByYears(data || [], selectedYears) : (data || []);
  const allChartData = filteredData
    .map(race => ({
      date: formatDateForDisplay(race.date),
      originalDate: race.date, // Keep original for sorting
      position: Number(race.position), // Ensure position is a number
      name: race.name,
      raceId: race.raceId
    }))
    .filter(race => race.position && !isNaN(race.position)) // Filter out invalid positions
    .sort((a, b) => parseFrenchDate(a.originalDate) - parseFrenchDate(b.originalDate));

  // Pagination logic - show 10 races max, starting from the end by default
  const RACES_PER_PAGE = 10;
  const STEP_SIZE = 5;
  const totalRaces = allChartData.length;
  const totalPages = Math.max(0, Math.ceil((totalRaces - RACES_PER_PAGE) / STEP_SIZE) + 1);
  
  // Calculate start index for current page (start from end for page 0)
  const getStartIndex = (page) => {
    if (page === 0) {
      return Math.max(0, totalRaces - RACES_PER_PAGE);
    }
    return Math.max(0, totalRaces - RACES_PER_PAGE - (page * STEP_SIZE));
  };
  
  const startIndex = getStartIndex(currentPage);
  const chartData = allChartData.slice(startIndex, startIndex + RACES_PER_PAGE);
  
  // Navigation functions
  const canGoLeft = currentPage < totalPages - 1 && totalRaces > RACES_PER_PAGE;
  const canGoRight = currentPage > 0;
  
  const goLeft = () => {
    if (canGoLeft) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goRight = () => {
    if (canGoRight) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleClick = (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      onPointClick(clickedData);
    }
  };

  // Calculate average top percentage for filtered data
  const calculateAverageTopPercentage = () => {
    if (!filteredData || !raceParticipantCounts) return null;
    
    const validPercentages = filteredData
      .map(race => {
        const participantCount = raceParticipantCounts[race.raceId];
        return calculatePercentagePosition(race.position, participantCount);
      })
      .filter(percentage => percentage !== null);
    
    if (validPercentages.length === 0) return null;
    
    const sum = validPercentages.reduce((acc, percentage) => acc + percentage, 0);
    return Math.round(sum / validPercentages.length);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const raceData = payload[0].payload;
      const participantCount = raceParticipantCounts?.[raceData.raceId];
      const percentage = calculatePercentagePosition(raceData.position, participantCount);
      
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '1rem', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '1rem', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '280px'
        }}>
          <p style={{fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '0.875rem'}}>{`📅 ${raceData.originalDate || label}`}</p>
          <p style={{
            color: '#3b82f6', 
            fontWeight: '700', 
            fontSize: '1.125rem',
            margin: '0 0 0.5rem 0'
          }}>{`🏆 Position: ${payload[0].value}`}</p>
          {percentage !== null && (
            <p style={{
              fontSize: '0.875rem', 
              fontWeight: '600',
              margin: '0 0 0.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📊 Top %: 
              <span style={{
                background: getPercentageColor(percentage),
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {percentage}%
              </span>
            </p>
          )}
          <p style={{fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.75rem 0', fontWeight: '600'}}>{raceData.name}</p>
          
          {/* Cyclist ID Section */}
          {cyclistInfo && cyclistInfo.id && (
            <div style={{
              borderTop: '1px solid rgba(59, 130, 246, 0.2)',
              paddingTop: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4'}}>
                <p style={{margin: '0'}}>
                  🆔 <strong>ID:</strong> {cyclistInfo.id}
                </p>
              </div>
            </div>
          )}
          
          <p style={{fontSize: '0.75rem', color: '#8b5cf6', margin: 0, fontWeight: '600'}}>👆 {t('ui.viewProfile')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{width: '100%', ...(window.innerWidth < 768 ? {minHeight: 'clamp(20rem, 40vh, 28rem)', maxHeight: 'clamp(30rem, 65vh, 38rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden'} : {height: 'clamp(28rem, 60vh, 40rem)'}), padding: 'clamp(0.75rem, 3vw, 1.5rem)'}}>
      {/* Header with title and optional date filter */}
      <div style={{
        display: 'flex',
        justifyContent: selectedYears && onYearsChange ? 'space-between' : 'center',
        alignItems: 'center',
        marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
        flexWrap: 'wrap',
        gap: '10px',
        // Center align items when wrapping on mobile
        ...(window.innerWidth < 768 && {
          justifyContent: 'center',
          textAlign: 'center'
        })
      }}>
        <h2 style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
          fontWeight: '800', 
          margin: 0,
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.025em'
        }}>
          📊 {displayName} - {t('chart.title')}
        </h2>
        
        {/* Only show date filter if props are provided (from App.jsx) */}
        {selectedYears && onYearsChange && (
          <DateFilter
            data={data}
            selectedYears={selectedYears}
            onYearsChange={onYearsChange}
            style={{
              minWidth: window.innerWidth < 768 ? '120px' : '160px',
              flexShrink: 0
            }}
          />
        )}
      </div>

      {/* Cyclist Statistics */}
      {cyclistInfo && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '1rem',
          padding: 'clamp(0.75rem, 2vw, 1rem)',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'clamp(1rem, 4vw, 3rem)',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            🏁 <span style={{color: '#6b7280'}}>Total Races:</span>
            <span style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '700'
            }}>
              {filteredData ? filteredData.length : 0}
            </span>
          </div>

          {(() => {
            const avgPercentage = calculateAverageTopPercentage();
            return avgPercentage !== null ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                📈 <span style={{color: '#6b7280'}}>Avg Top %:</span>
                <span style={{
                  background: getPercentageColor(avgPercentage),
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}>
                  {avgPercentage}%
                </span>
              </div>
            ) : null;
          })()}
        </div>
      )}
      
      {/* Chart pagination info */}
      {totalRaces > RACES_PER_PAGE && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#64748b',
          fontWeight: '600'
        }}>
{t('chart.showingRaces', { 
            start: startIndex + 1, 
            end: Math.min(startIndex + RACES_PER_PAGE, totalRaces), 
            total: totalRaces 
          })}
        </div>
      )}
      
      <div style={{ position: 'relative', width: '100%', height: window.innerWidth < 768 ? 'clamp(19rem, 44vh, 27rem)' : '100%', flex: window.innerWidth < 768 ? '1 1 auto' : 'initial' }}
           onMouseEnter={() => {
             setShowLeftButton(canGoLeft);
             setShowRightButton(canGoRight);
           }}
           onMouseLeave={() => {
             setShowLeftButton(false);
             setShowRightButton(false);
           }}>

        {/* Left navigation button */}
        {canGoLeft && (
          <button
            onClick={goLeft}
            onMouseEnter={() => setShowLeftButton(true)}
            style={{
              position: 'absolute',
              left: 'clamp(5px, 2vw, 10px)',
              top: '50%',
              zIndex: 10,
              background: 'rgba(59, 130, 246, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(30px, 6vw, 42px)',
              height: 'clamp(30px, 6vw, 42px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: 'white',
              fontWeight: '700',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
              opacity: showLeftButton ? 1 : 0,
              visibility: showLeftButton ? 'visible' : 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: showLeftButton ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-20px)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 1)';
              e.target.style.transform = showLeftButton ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) translateX(-20px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.9)';
              e.target.style.transform = showLeftButton ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-20px)';
            }}
          >
            ←
          </button>
        )}
        
        {/* Right navigation button */}
        {canGoRight && (
          <button
            onClick={goRight}
            onMouseEnter={() => setShowRightButton(true)}
            style={{
              position: 'absolute',
              right: 'clamp(-20px, -5vw, -30px)',
              top: '50%',
              zIndex: 10,
              background: 'rgba(59, 130, 246, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(30px, 6vw, 42px)',
              height: 'clamp(30px, 6vw, 42px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: 'white',
              fontWeight: '700',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
              opacity: showRightButton ? 1 : 0,
              visibility: showRightButton ? 'visible' : 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: showRightButton ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(20px)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 1)';
              e.target.style.transform = showRightButton ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) translateX(20px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.9)';
              e.target.style.transform = showRightButton ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(20px)';
            }}
          >
            →
          </button>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            key={`chart-${forceUpdate}-${currentPage}`}
            data={chartData}
            margin={{ 
              top: 20, 
              right: window.innerWidth < 768 ? 15 : 30, 
              left: window.innerWidth < 768 ? 15 : 20, 
              bottom: window.innerWidth < 768 ? 95 : 115 
            }}
            onClick={handleClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={window.innerWidth < 768 ? 90 : 110}
              interval={0}
              tick={{ 
                fontSize: window.innerWidth < 768 ? 8 : 11, 
                fontWeight: '600', 
                fill: '#64748b',
                dy: window.innerWidth < 768 ? 2 : 0
              }}
              axisLine={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
            />
            <YAxis 
              label={window.innerWidth < 768 ? undefined : { value: t('chart.yAxisLabel'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: '700', fill: '#64748b', fontSize: '12px' } }}
              reversed={true}
              domain={[1, 'dataMax']}
              tick={{ fontSize: window.innerWidth < 768 ? 9 : 12, fontWeight: '600', fill: '#64748b' }}
              axisLine={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
              width={window.innerWidth < 768 ? 30 : 60}
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
                strokeWidth: window.innerWidth < 768 ? 3 : 4, 
                r: window.innerWidth < 768 ? 8 : 10, 
                cursor: 'pointer'
              }}
              activeDot={{ 
                r: window.innerWidth < 768 ? 12 : 14, 
                stroke: '#8b5cf6', 
                strokeWidth: window.innerWidth < 768 ? 3 : 4, 
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
    </div>
  );
};

export default PerformanceChart;