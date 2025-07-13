import { useState, useEffect, useCallback } from 'react';
import PerformanceChart from './PerformanceChart';
import SelectAsDefaultButton from './SelectAsDefaultButton';
import ComparisonView from './ComparisonView';
import { useTranslation } from '../contexts/LanguageContext';
import { parseFrenchDate, getPercentageColor, calculatePercentagePosition } from '../utils/dateUtils';

const CyclistProfile = ({ cyclistId, cyclistName, history, isOpen, onClose, onPointClick, onRaceClick, isDefaultCyclistById, onDefaultChange, getDefaultCyclistRaces, getDefaultCyclistInfo, api }) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showChart, setShowChart] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [raceParticipantCounts, setRaceParticipantCounts] = useState({});

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [isOpen]);


  // Function to calculate average top percentage
  const calculateAverageTopPercentage = () => {
    const validPercentages = [];
    safeHistory.forEach(race => {
      const participantCount = raceParticipantCounts[race.race_id];
      const percentage = calculatePercentagePosition(race.rank, participantCount);
      if (percentage !== null) {
        validPercentages.push(percentage);
      }
    });
    
    if (validPercentages.length === 0) return null;
    const average = validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length;
    return Math.round(average);
  };


  // Function to fetch participant count for a race
  const fetchRaceParticipantCount = useCallback(async (raceId) => {
    if (!api || !raceId || raceParticipantCounts[raceId]) return;
    
    try {
      const raceData = await api.getRace(raceId);
      if (raceData && raceData.participant_count) {
        setRaceParticipantCounts(prev => ({
          ...prev,
          [raceId]: raceData.participant_count
        }));
      }
    } catch (error) {
      console.error('Error fetching race participant count:', error);
    }
  }, [api, raceParticipantCounts]);

  const safeHistory = history || [];
  const isDefaultProfile = isDefaultCyclistById ? isDefaultCyclistById(cyclistId, cyclistName) : false;

  // Fetch participant counts for all races when component loads
  useEffect(() => {
    if (isOpen && safeHistory.length > 0 && api) {
      safeHistory.forEach(race => {
        if (race.race_id && !raceParticipantCounts[race.race_id]) {
          fetchRaceParticipantCount(race.race_id);
        }
      });
    }
  }, [isOpen, safeHistory, api, fetchRaceParticipantCount, raceParticipantCounts]);

  if (!isOpen) return null;


  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRaceClick = (race) => {
    if (onRaceClick && race.race_id) {
      onRaceClick(race.race_id);
    }
  };

  // Helper function to find common races between cyclist and default cyclist
  const findCommonRaces = () => {
    if (!getDefaultCyclistRaces || !getDefaultCyclistInfo) return [];
    
    const defaultRaces = getDefaultCyclistRaces();
    
    if (!defaultRaces || defaultRaces.length === 0 || !history || history.length === 0) {
      return [];
    }

    const commonRaces = [];
    
    // Compare races by race_id or race_name + date for matching
    history.forEach(cyclistRace => {
      const matchingDefaultRace = defaultRaces.find(defaultRace => {
        // Try to match by race_id first, then by name and date
        return (cyclistRace.race_id && defaultRace.raceId && cyclistRace.race_id === defaultRace.raceId) ||
               (cyclistRace.race_name === defaultRace.name && cyclistRace.date === defaultRace.date);
      });
      
      if (matchingDefaultRace) {
        commonRaces.push({
          date: cyclistRace.date,
          raceName: cyclistRace.race_name,
          raceId: cyclistRace.race_id,
          cyclistPosition: cyclistRace.rank,
          defaultPosition: matchingDefaultRace.rank || matchingDefaultRace.position
        });
      }
    });
    
    return commonRaces;
  };

  const canShowComparison = () => {
    if (!getDefaultCyclistInfo || !isDefaultCyclistById) return false;
    
    const isCurrentDefault = isDefaultCyclistById(cyclistId, cyclistName);
    
    // Don't show comparison button if this cyclist is the default cyclist
    return !isCurrentDefault && getDefaultCyclistInfo() && findCommonRaces().length > 0;
  };

  const sortedHistory = [...safeHistory].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortField) {
      case 'date':
        aVal = parseFrenchDate(a.date);
        bVal = parseFrenchDate(b.date);
        break;
      case 'location':
        aVal = a.race_name.toLowerCase();
        bVal = b.race_name.toLowerCase();
        break;
      case 'position':
        aVal = a.rank;
        bVal = b.rank;
        break;
      case 'percentage': {
        const aCount = raceParticipantCounts[a.race_id];
        const bCount = raceParticipantCounts[b.race_id];
        aVal = calculatePercentagePosition(a.rank, aCount) || 0;
        bVal = calculatePercentagePosition(b.rank, bCount) || 0;
        break;
      }
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{color: '#d1d5db'}}>↕</span>;
    return sortDirection === 'asc' ? <span style={{color: '#2563eb'}}>↑</span> : <span style={{color: '#2563eb'}}>↓</span>;
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
        padding: 'clamp(0.5rem, 2vw, 1rem)'
      }}
      onClick={handleBackdropClick}
    >
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'clamp(0.75rem, 3vw, 1.5rem)', 
        maxWidth: '80rem', 
        width: '100%', 
        maxHeight: '95vh', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: 'clamp(1rem, 3vw, 2rem)',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent'
        }}>
          {/* Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{
              fontSize: 'clamp(1.125rem, 3.5vw, 2rem)', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em'
            }}>👤 {t('profile.raceHistory')}</h2>
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
          
          {/* Cyclist Info Card */}
          <div style={{marginBottom: '2rem'}}>
            <div style={{
              background: isDefaultProfile 
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
              borderRadius: '1rem',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              border: isDefaultProfile ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: isDefaultProfile ? '0 4px 6px -1px rgba(34, 197, 94, 0.1)' : 'none'
            }}>
              <div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'}}>
                  <div style={{flex: '1', minWidth: '200px'}}>
                    <h3 style={{fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem'}}>
                      🚴‍♂️ {cyclistName || 'Unknown Cyclist'}
                    </h3>
                    <p style={{color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem'}}>
                      📋 ID: {cyclistId || 'No ID'}
                    </p>
                    <p style={{fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem'}}>
                      🏆 {t('table.totalRaces')}: {safeHistory.length}
                    </p>
                    {(() => {
                      const averagePercentage = calculateAverageTopPercentage();
                      if (averagePercentage !== null) {
                        return (
                          <p style={{fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', color: '#64748b', fontWeight: '600'}}>
                            📊 {t('table.averageTopPercentage')}: 
                            <span style={{
                              marginLeft: '0.5rem',
                              background: getPercentageColor(averagePercentage),
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              width: '3rem',
                              display: 'inline-block',
                              textAlign: 'center'
                            }}>
                              {averagePercentage}%
                            </span>
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {onDefaultChange && cyclistName && (
                    <div style={{flexShrink: 0}}>
                      <SelectAsDefaultButton 
                        cyclist={{ 
                          firstName: cyclistName.split(' ')[0] || '', 
                          lastName: cyclistName.split(' ').slice(1).join(' ') || '', 
                          id: cyclistId 
                        }}
                        onDefaultChange={onDefaultChange}
                        isAlreadyDefault={isDefaultProfile}
                        translations={{ 
                          selectAsDefault: t('ui.selectAsDefault'),
                          alreadySelectedCyclist: t('ui.alreadySelectedCyclist')
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* View Toggle */}
            <div style={{marginTop: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', justifyContent: 'center', flexWrap: 'wrap'}}>
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
              {canShowComparison() && (
                <button
                  onClick={() => setShowComparison(true)}
                  style={{
                    padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    color: 'white',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    minWidth: window.innerWidth < 768 ? '44px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px -8px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {window.innerWidth < 768 ? '⚔️' : `⚔️ ${t('ui.compareWithDefault')}`}
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          {showChart ? (
            // Chart View
            <div>
              <div style={{marginBottom: '1rem'}}>
                <h4 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem'}}>{t('profile.performanceChart')}</h4>
                <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem'}}>{t('ui.clickPointsToViewDetails')}</p>
              </div>
              <div style={{height: 'clamp(300px, 40vh, 400px)'}}>
                <PerformanceChart 
                  data={sortedHistory.map(race => ({
                    date: race.date,
                    position: race.rank,
                    name: race.race_name,
                    raceId: race.race_id
                  }))}
                  onPointClick={onPointClick}
                  cyclistName={cyclistName}
                  raceParticipantCounts={raceParticipantCounts}
                />
              </div>
            </div>
          ) : (
            // Table View
            <div>
              <div style={{marginBottom: '1.5rem'}}>
                <h4 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', marginBottom: '0.75rem', color: '#1f2937'}}>📊 {t('ui.raceHistory')}</h4>
                <p style={{fontSize: window.innerWidth < 768 ? '0.75rem' : '1rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: '600'}}>
                  👆 {t('ui.clickHeadersToSort')} • 🖱️ {t('ui.clickRacesToViewLeaderboard')}
                </p>
              </div>

              {safeHistory.length > 0 ? (
                <div style={{
                  borderRadius: '1rem', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  overflow: 'hidden'
                }}>
                  <div style={{
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
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
                              width: '30%'
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
                              width: window.innerWidth < 768 ? '43%' : '40%'
                            }}
                            onClick={() => handleSort('location')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              📍 {t('table.race')}
                              <SortIcon field="location" />
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
                              width: window.innerWidth < 768 ? '12%' : '15%'
                            }}
                            onClick={() => handleSort('position')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              🏆 {t('table.position')}
                              <SortIcon field="position" />
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
                              width: '15%'
                            }}
                            onClick={() => handleSort('percentage')}
                          >
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                              📊 {t('table.topPercentage')}
                              <SortIcon field="percentage" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedHistory.map((race, index) => (
                          <tr 
                            key={index}
                            onClick={() => handleRaceClick(race)}
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
                              {race.race_name}
                            </td>
                            <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '800', color: '#3b82f6', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', textAlign: 'center'}}>
                              #{race.rank}
                            </td>
                            <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '700', color: '#059669', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', textAlign: 'center'}}>
                              {(() => {
                                const participantCount = raceParticipantCounts[race.race_id];
                                const percentage = calculatePercentagePosition(race.rank, participantCount);
                                if (percentage !== null) {
                                  return (
                                    <span style={{
                                      background: getPercentageColor(percentage),
                                      color: 'white',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      width: '3rem',
                                      display: 'inline-block',
                                      textAlign: 'center'
                                    }}>
                                      {percentage}%
                                    </span>
                                  );
                                }
                                return (
                                  <span style={{
                                    color: '#9ca3af',
                                    fontSize: '0.875rem',
                                    fontStyle: 'italic'
                                  }}>
                                    {t('ui.loading')}
                                  </span>
                                );
                              })()} 
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '2rem 0', color: '#6b7280'}}>
                  No race history available for this cyclist.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Comparison View Modal */}
      {showComparison && getDefaultCyclistInfo && (
        <ComparisonView
          data={findCommonRaces()}
          onPointClick={onPointClick}
          cyclistName={cyclistName}
          defaultCyclistName={getDefaultCyclistInfo().fullName}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

export default CyclistProfile;