import { useState, useEffect, useRef } from 'react';
import PerformanceChart from './PerformanceChart';
import SelectAsDefaultButton from './SelectAsDefaultButton';
import FollowButton from './FollowButton';
import ComparisonView from './ComparisonView';
import DateFilter from './DateFilter';
import CyclistRaceHistoryTable from './CyclistRaceHistoryTable';
import { useTranslation } from '../contexts/LanguageContext';
import { filterDataByYears, calculatePercentagePosition, getPercentageColor } from '../utils/dateUtils';

const CyclistProfile = ({ cyclistId, cyclistName, history, team = null, region = null, isOpen, onClose, onPointClick, onRaceClick, isDefaultCyclistById, onDefaultChange, getDefaultCyclistRaces, getDefaultCyclistInfo, isLeaderboardOpen, onFollowChange }) => {
  const { t } = useTranslation();
  const [showChart, setShowChart] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);
  const modalContentRef = useRef(null);

  // Set scroll position to top when cyclist changes (new cyclist selected)
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        modalContentRef.current.scrollTop = 0;
      }, 50);
    }
  }, [cyclistId, isOpen]);

  const safeHistory = history || [];
  const isDefaultProfile = isDefaultCyclistById ? isDefaultCyclistById(cyclistId, cyclistName) : false;

  // Extract team name from history if not provided as prop
  const getTeamName = () => {
    // Use team prop if available
    if (team) {
      return team.replace(/^\d+\s+/, ''); // Clean club name (remove leading numbers)
    }

    // Fallback: extract from history
    if (!safeHistory || safeHistory.length === 0) return null;

    // Find the most recent race with team/club data
    for (let i = safeHistory.length - 1; i >= 0; i--) {
      const race = safeHistory[i];
      if (race.club || race.team) {
        // Clean club name (remove leading numbers)
        const clubName = race.club || race.team;
        return clubName.replace(/^\d+\s+/, '');
      }
    }
    return null;
  };

  // Extract region from history if not provided as prop
  const getRegion = () => {
    // Use region prop if available
    if (region) {
      return region;
    }

    // Fallback: extract from history
    if (!safeHistory || safeHistory.length === 0) return null;

    // Find the most recent race with region data
    for (let i = safeHistory.length - 1; i >= 0; i--) {
      const race = safeHistory[i];
      if (race.region) {
        return race.region;
      }
    }
    return null;
  };

  const teamName = getTeamName();
  const regionName = getRegion();

  // Filter history by selected years
  const filteredHistory = filterDataByYears(safeHistory, selectedYears);
  
  // Function to calculate average top percentage (using filtered data)
  const calculateAverageTopPercentage = () => {
    const validPercentages = [];
    filteredHistory.forEach(race => {
      const percentage = calculatePercentagePosition(race.rank, race.participant_count);
      if (percentage !== null) {
        validPercentages.push(percentage);
      }
    });
    
    if (validPercentages.length === 0) return null;
    const average = validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length;
    return Math.round(average);
  };

  if (!isOpen) return null;



  const handleRaceClick = (race) => {
    if (onRaceClick && race.race_id) {
      onRaceClick(race.race_id);
    }
  };

  const handleTableRaceClick = (raceData) => {
    const race = {
      race_id: raceData.raceId || raceData.race_id
    };
    handleRaceClick(race);
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
        padding: window.innerWidth < 768 ? '0' : 'clamp(0.5rem, 2vw, 1rem)',
        touchAction: 'pan-x pan-y'
      }}
      onClick={handleBackdropClick}
      onTouchMove={(e) => {
        // Only prevent touch move if it's on the backdrop itself, not on modal content
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      onWheel={(e) => {
        // Only prevent wheel events on the backdrop itself
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: window.innerWidth < 768 ? '0' : 'clamp(0.75rem, 3vw, 1.5rem)',
        maxWidth: window.innerWidth < 768 ? '100vw' : '80rem',
        width: '100%',
        height: window.innerWidth < 768 ? '100vh' : 'auto',
        maxHeight: window.innerWidth < 768 ? '100vh' : '95vh', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'auto'
      }}>
        <div
          ref={modalContentRef}
          style={{
            padding: window.innerWidth < 768 ? 'clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 2rem)' : 'clamp(1rem, 3vw, 2rem)',
            overflowY: isLeaderboardOpen ? 'hidden' : 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent',
            flex: 1,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
          onTouchStart={(e) => {
            // Prevent any potential focus issues on touch start
            e.stopPropagation();
          }}
>
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.9rem'}}>
                  <div style={{flex: '1', minWidth: '200px'}}>
                    <h3 style={{fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem'}}>
                      🚴‍♂️ {cyclistName || 'Unknown Cyclist'}
                    </h3>
                    <p style={{color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', fontSize: window.innerWidth < 768 ? '0.725rem' : '0.9rem'}}>
                      📋 ID: {cyclistId || 'No ID'}
                    </p>
                    {regionName && (
                      <p style={{color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', fontSize: window.innerWidth < 768 ? '0.725rem' : '0.9rem'}}>
                        📍 {t('table.region') || 'Region'}: {regionName}
                      </p>
                    )}
                    {teamName && (
                      <p style={{color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', fontSize: window.innerWidth < 768 ? '0.725rem' : '0.9rem'}}>
                        🧑‍🤝‍🧑 {t('table.team') || 'Team'}: {teamName}
                      </p>
                    )}
                    <p style={{fontSize: window.innerWidth < 768 ? '0.725rem' : '0.9rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem'}}>
                      🏆 {window.innerWidth < 768 ? t('ui.races') : t('table.totalRaces')}: {filteredHistory.length}{selectedYears.length > 0 && safeHistory.length !== filteredHistory.length ? ` (${safeHistory.length} total)` : ''}
                    </p>
                    {(() => {
                      const averagePercentage = calculateAverageTopPercentage();
                      if (averagePercentage !== null) {
                        return (
                          <p style={{fontSize: window.innerWidth < 768 ? '0.725rem' : '0.9rem', color: '#64748b', fontWeight: '600'}}>
                            📊 {window.innerWidth < 768 ? t('table.topPercentage') : t('table.averageTopPercentage')}:
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
                    <div style={{flexShrink: 0, display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
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
                          alreadySelectedCyclist: t('ui.alreadySelectedCyclist'),
                          unselectDefault: t('ui.unselectDefault')
                        }}
                      />
                      <FollowButton
                        cyclistUciId={cyclistId}
                        cyclistName={cyclistName}
                        onFollowChange={onFollowChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* View Toggle with Date Filter for Tables only */}
            <div style={{marginTop: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'}}>
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
              
              {/* Date Filter - Only show when table view is active */}
              {!showChart && (
                <DateFilter
                  data={safeHistory}
                  selectedYears={selectedYears}
                  onYearsChange={setSelectedYears}
                  style={{
                    minWidth: window.innerWidth < 768 ? '120px' : '180px'
                  }}
                />
              )}
            </div>
          </div>

          {/* Content Area */}
          {showChart ? (
            // Chart View
            <div>
              <div style={{height: window.innerWidth < 768 ? 'clamp(300px, 42vh, 420px)' : 'clamp(450px, 55vh, 600px)'}}>
                <PerformanceChart
                  data={filteredHistory.map(race => ({
                    date: race.date,
                    position: race.rank,
                    name: race.race_name,
                    raceId: race.race_id,
                    participantCount: race.participant_count
                  }))}
                  onPointClick={onPointClick}
                  cyclistName={cyclistName}
                />
              </div>
            </div>
          ) : (
            // Table View
            <div>
              <CyclistRaceHistoryTable
                races={safeHistory}
                selectedYears={selectedYears}
                onRaceClick={handleTableRaceClick}
                getRaceById={null}
                showDateFilter={false}
                title={`📊 ${t('ui.raceHistory')}`}
                cyclistName={cyclistName}
              />
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