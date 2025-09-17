import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import DateFilter from './DateFilter';
import { filterDataByYears, getAvailableYears } from '../utils/dateUtils';

const ComparisonView = ({ data, onPointClick, cyclistName, defaultCyclistName, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showChart, setShowChart] = useState(true);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedYears, setSelectedYears] = useState([]);

  // Initialize selectedYears when component opens with data
  useEffect(() => {
    if (isOpen && data && data.length > 0) {
      const availableYears = getAvailableYears(data);
      // If no years are selected but we have data, select all available years
      if (selectedYears.length === 0 && availableYears.length > 0) {
        setSelectedYears(availableYears);
      }
    }
  }, [isOpen, data, selectedYears.length]);

  // Force re-render when data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [data, cyclistName, defaultCyclistName, selectedYears]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    } else {
      // Reset selectedYears when modal closes for fresh initialization next time
      setSelectedYears([]);
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

  // Filter data by selected years, then transform and sort chronologically for the chart
  // If no years are selected, show all data (not empty data)
  const filteredData = selectedYears.length > 0 ? filterDataByYears(data || [], selectedYears) : (data || []);
  const chartData = filteredData
    .filter(race => race.cyclistPosition && race.defaultPosition &&
             !isNaN(race.cyclistPosition) && !isNaN(race.defaultPosition))
    .sort((a, b) => parseFrenchDate(a.date) - parseFrenchDate(b.date));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };


  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{color: '#d1d5db'}}>↕</span>;
    return sortDirection === 'asc' ? <span style={{color: '#2563eb'}}>↑</span> : <span style={{color: '#2563eb'}}>↓</span>;
  };

  const handleClick = (data) => {
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
        padding: window.innerWidth < 768 ? '0.5rem' : '1rem'
      }}
      onClick={handleBackdropClick}
    >
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1.5rem', 
        maxWidth: '95rem', 
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
          padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
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
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: window.innerWidth < 768 ? '1rem' : '2rem'
          }}>
            <h3 style={{fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)', fontWeight: '700', color: '#1f2937', marginBottom: window.innerWidth < 768 ? '0.5rem' : '1rem'}}>
              📊 {window.innerWidth < 768 ? t('comparison.title') : t('comparison.subtitle')}
            </h3>
            <div style={{display: 'flex', gap: window.innerWidth < 768 ? '1rem' : '2rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <div style={{width: '1rem', height: '0.25rem', background: '#3b82f6', borderRadius: '0.125rem'}}></div>
                <span style={{fontWeight: '600', color: '#374151', fontSize: window.innerWidth < 768 ? '0.75rem' : '1rem'}}>{window.innerWidth < 768 ? cyclistName.split(' ')[0] : cyclistName}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <div style={{width: '1rem', height: '0.25rem', background: '#10b981', borderRadius: '0.125rem'}}></div>
                <span style={{fontWeight: '600', color: '#374151', fontSize: window.innerWidth < 768 ? '0.75rem' : '1rem'}}>{window.innerWidth < 768 ? defaultCyclistName.split(' ')[0] + ' ⭐' : defaultCyclistName + ' ⭐'}</span>
              </div>
              <div style={{color: '#64748b', fontWeight: '600', fontSize: window.innerWidth < 768 ? '0.75rem' : '1rem'}}>
                {window.innerWidth < 768 ? t('ui.races') : t('comparison.commonRaces')}: {chartData.length}
              </div>
            </div>
          </div>

          {/* View Toggle with Date Filter for Tables only */}
          <div style={{marginBottom: '1.5rem', display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'}}>
            <button
              onClick={() => setShowChart(true)}
              style={{
                padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem 1.5rem',
                background: showChart ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(248, 250, 252, 0.8)',
                color: showChart ? 'white' : '#64748b',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '700',
                boxShadow: showChart ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s ease',
                minWidth: window.innerWidth < 768 ? '44px' : 'auto'
              }}
            >
              {window.innerWidth < 768 ? '📈' : `📈 ${t('profile.performanceChart')}`}
            </button>
            <button
              onClick={() => setShowChart(false)}
              style={{
                padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem 1.5rem',
                background: !showChart ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(248, 250, 252, 0.8)',
                color: !showChart ? 'white' : '#64748b',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '700',
                boxShadow: !showChart ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s ease',
                minWidth: window.innerWidth < 768 ? '44px' : 'auto'
              }}
            >
              {window.innerWidth < 768 ? '📊' : `📊 ${t('profile.raceTable')}`}
            </button>
            
            {/* Date Filter - Only show when table view is active */}
            {!showChart && (
              <DateFilter
                data={data || []}
                selectedYears={selectedYears}
                onYearsChange={setSelectedYears}
                style={{
                  minWidth: window.innerWidth < 768 ? '120px' : '180px'
                }}
              />
            )}
          </div>

          {/* Content Area */}
          {filteredData.length > 0 ? (
            showChart ? (
              // Chart View
              <div style={{height: window.innerWidth < 768 ? 'clamp(320px, 42vh, 450px)' : 'clamp(500px, 60vh, 700px)'}}>
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
                      label={window.innerWidth < 768 ? undefined : { value: t('chart.yAxisLabel'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: '700', fill: '#64748b', fontSize: '12px' } }}
                      reversed={true}
                      domain={[1, 'dataMax']}
                      tick={{ fontSize: window.innerWidth < 768 ? 9 : 12, fontWeight: '600', fill: '#64748b' }}
                      axisLine={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
                      width={window.innerWidth < 768 ? 30 : 60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={window.innerWidth < 768 ? 60 : 36}
                      iconType="line"
                      wrapperStyle={{ 
                        paddingBottom: '20px', 
                        fontWeight: '600',
                        fontSize: window.innerWidth < 768 ? '12px' : '14px',
                        lineHeight: window.innerWidth < 768 ? '16px' : '20px'
                      }}
                    />
                    
                    {/* Cyclist line */}
                    <Line 
                      type="monotone" 
                      dataKey="cyclistPosition" 
                      name={window.innerWidth < 768 ? cyclistName.length > 15 ? cyclistName.substring(0, 12) + '...' : cyclistName : cyclistName}
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
                      name={window.innerWidth < 768 ? 
                        (defaultCyclistName.length > 12 ? defaultCyclistName.substring(0, 9) + '... ⭐' : `${defaultCyclistName} ⭐`) :
                        `${defaultCyclistName} ⭐`
                      }
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
              // Table View
              <div>
                <div style={{marginBottom: '1.5rem'}}>
                  <h4 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', marginBottom: '0.75rem', color: '#1f2937'}}>⚔️ {t('comparison.title')}</h4>
                  <p style={{fontSize: window.innerWidth < 768 ? '0.75rem' : '1rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: '600'}}>
                    👆 {t('ui.clickHeadersToSort')} • 🖱️ {t('ui.clickRacesToViewLeaderboard')}
                  </p>
                </div>

                <div style={{
                  borderRadius: '1rem', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  overflow: 'hidden'
                }}>
                  <div style={{
                    overflow: 'hidden',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    <table key={`comparison-table-${forceUpdate}`} style={{width: '100%', borderCollapse: 'collapse'}}>
                      <thead>
                        <tr style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'}}>
                          <th 
                            style={{
                              border: 'none', 
                              borderBottom: '2px solid rgba(59, 130, 246, 0.2)', 
                              padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              cursor: 'pointer', 
                              fontWeight: '700', 
                              color: '#1f2937',
                              transition: 'background-color 0.2s ease',
                              userSelect: 'none',
                              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                              width: window.innerWidth < 768 ? '20%' : '25%'
                            }}
                            onClick={() => handleSort('date')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              📅 {t('table.date')}
                              <SortIcon field="date" />
                            </div>
                          </th>
                          <th 
                            style={{
                              border: 'none', 
                              borderBottom: '2px solid rgba(59, 130, 246, 0.2)', 
                              padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              cursor: 'pointer', 
                              fontWeight: '700', 
                              color: '#1f2937',
                              transition: 'background-color 0.2s ease',
                              userSelect: 'none',
                              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                              width: window.innerWidth < 768 ? '40%' : '45%'
                            }}
                            onClick={() => handleSort('race')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              📍 {t('table.race')}
                              <SortIcon field="race" />
                            </div>
                          </th>
                          <th 
                            style={{
                              border: 'none', 
                              borderBottom: '2px solid rgba(59, 130, 246, 0.2)', 
                              padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'center', 
                              cursor: 'pointer', 
                              fontWeight: '700', 
                              color: '#1f2937',
                              transition: 'background-color 0.2s ease',
                              userSelect: 'none',
                              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                              width: window.innerWidth < 768 ? '20%' : '15%'
                            }}
                            onClick={() => handleSort('cyclistPosition')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              🚴‍♂️ {window.innerWidth < 768 ? cyclistName.split(' ')[0] : cyclistName}
                              <SortIcon field="cyclistPosition" />
                            </div>
                          </th>
                          <th 
                            style={{
                              border: 'none', 
                              borderBottom: '2px solid rgba(59, 130, 246, 0.2)', 
                              padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'center', 
                              cursor: 'pointer', 
                              fontWeight: '700', 
                              color: '#1f2937',
                              transition: 'background-color 0.2s ease',
                              userSelect: 'none',
                              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                              width: window.innerWidth < 768 ? '20%' : '15%'
                            }}
                            onClick={() => handleSort('defaultPosition')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              ⭐ {window.innerWidth < 768 ? defaultCyclistName.split(' ')[0] : defaultCyclistName}
                              <SortIcon field="defaultPosition" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'date':
        aVal = parseFrenchDate(a.date);
        bVal = parseFrenchDate(b.date);
        break;
      case 'race':
        aVal = a.raceName.toLowerCase();
        bVal = b.raceName.toLowerCase();
        break;
      case 'cyclistPosition':
        aVal = a.cyclistPosition;
        bVal = b.cyclistPosition;
        break;
      case 'defaultPosition':
        aVal = a.defaultPosition;
        bVal = b.defaultPosition;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }).map((race, index) => (
                          <tr 
                            key={index}
                            onClick={() => onPointClick && onPointClick(race)}
                            style={{
                              backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              const row = e.currentTarget;
                              row.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                              row.style.transform = 'translateX(4px)';
                              row.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              const row = e.currentTarget;
                              row.style.backgroundColor = index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.8)';
                              row.style.transform = 'translateX(0)';
                              row.style.boxShadow = 'none';
                            }}
                          >
                            <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '600', color: '#64748b', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', wordBreak: 'break-word'}}>
                              {race.date}
                            </td>
                            <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '500', color: '#374151', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                              {race.raceName}
                            </td>
                            <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '800', color: '#3b82f6', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', textAlign: 'center'}}>
                              #{race.cyclistPosition}
                            </td>
                            <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '800', color: '#10b981', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', textAlign: 'center'}}>
                              #{race.defaultPosition}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
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

export default ComparisonView;