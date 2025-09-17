import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { parseFrenchDate, getPercentageColor, calculatePercentagePosition, filterDataByYears } from '../utils/dateUtils';

const CyclistRaceHistoryTable = ({
  races,
  raceParticipantCounts,
  selectedYears,
  onRaceClick,
  getRaceById,
  showDateFilter = false,
  DateFilterComponent = null,
  onYearsChange = null,
  title,
  cyclistName
}) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when raceParticipantCounts changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [raceParticipantCounts]);

  // Also force re-render when races or selectedYears change
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [races, selectedYears]);

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

  const handleRaceClickInternal = (race) => {
    if (onRaceClick) {
      // Handle different race data structures
      const raceData = {
        raceId: race.raceId || race.race_id,
        name: race.name || race.race_name,
        date: race.date,
        position: race.position || race.rank
      };
      onRaceClick(raceData);
    }
  };

  // Filter races by selected years
  const filteredRaces = filterDataByYears(races, selectedYears);

  // Apply sorting based on current sort field and direction
  const sortedRaces = [...filteredRaces].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'date':
        aVal = parseFrenchDate(a.date);
        bVal = parseFrenchDate(b.date);
        break;
      case 'race':
      case 'location':
        if (getRaceById) {
          // App.jsx style - use getRaceById
          const aRaceData = getRaceById(a.raceId);
          const bRaceData = getRaceById(b.raceId);
          aVal = (aRaceData?.name || 'Unknown Race').toLowerCase();
          bVal = (bRaceData?.name || 'Unknown Race').toLowerCase();
        } else {
          // CyclistProfile.jsx style - use race_name directly
          aVal = (a.race_name || a.name || 'Unknown Race').toLowerCase();
          bVal = (b.race_name || b.name || 'Unknown Race').toLowerCase();
        }
        break;
      case 'position':
        aVal = a.position || a.rank;
        bVal = b.position || b.rank;
        break;
      case 'percentage': {
        const aRaceId = a.raceId || a.race_id;
        const bRaceId = b.raceId || b.race_id;
        const aPosition = a.position || a.rank;
        const bPosition = b.position || b.rank;

        if (getRaceById) {
          // App.jsx style
          const aRaceData = getRaceById(aRaceId);
          const bRaceData = getRaceById(bRaceId);
          const aTotalParticipants = raceParticipantCounts[aRaceId] || aRaceData?.participant_count || 0;
          const bTotalParticipants = raceParticipantCounts[bRaceId] || bRaceData?.participant_count || 0;
          aVal = aTotalParticipants > 0 ? Math.round((aPosition / aTotalParticipants) * 100) : 0;
          bVal = bTotalParticipants > 0 ? Math.round((bPosition / bTotalParticipants) * 100) : 0;
        } else {
          // CyclistProfile.jsx style
          const aCount = raceParticipantCounts[aRaceId];
          const bCount = raceParticipantCounts[bRaceId];
          aVal = calculatePercentagePosition(aPosition, aCount) || 0;
          bVal = calculatePercentagePosition(bPosition, bCount) || 0;
        }
        break;
      }
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div style={{marginBottom: '1.5rem'}}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h4 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', margin: 0}}>
            {title || `📊 ${t('ui.raceHistory')}${cyclistName ? ` - ${cyclistName}` : ''}`}
          </h4>
          {showDateFilter && DateFilterComponent && onYearsChange && (
            <DateFilterComponent
              data={races}
              selectedYears={selectedYears}
              onYearsChange={onYearsChange}
            />
          )}
        </div>
      </div>

      {filteredRaces.length > 0 ? (
        <div style={{
          borderRadius: '1rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflow: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table key={`cyclist-table-${forceUpdate}`} style={{width: '100%', borderCollapse: 'collapse'}}>
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
                    onClick={() => handleSort(getRaceById ? 'race' : 'location')}
                  >
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                      📍 {t('table.race')}
                      <SortIcon field={getRaceById ? 'race' : 'location'} />
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
                {sortedRaces.map((race, index) => {
                  const raceId = race.raceId || race.race_id;
                  const raceName = getRaceById ? (getRaceById(raceId)?.name || 'Unknown Race') : (race.race_name || race.name || 'Unknown Race');
                  const position = race.position || race.rank;

                  let topPercentage = '-';
                  if (getRaceById) {
                    // App.jsx style
                    const raceData = getRaceById(raceId);
                    const totalParticipants = raceParticipantCounts[raceId] || raceData?.participant_count || 0;
                    topPercentage = totalParticipants > 0 ? Math.round((position / totalParticipants) * 100) : '-';
                  } else {
                    // CyclistProfile.jsx style
                    const participantCount = raceParticipantCounts[raceId];
                    const percentage = calculatePercentagePosition(position, participantCount);
                    topPercentage = percentage !== null ? percentage : '-';
                  }

                  return (
                    <tr
                      key={`${raceId}-${index}`}
                      onClick={() => handleRaceClickInternal(race)}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(240, 245, 251, 0.9)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(226, 232, 240, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        const row = e.currentTarget;
                        row.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        row.style.transform = 'translateX(4px)';
                        row.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        const row = e.currentTarget;
                        row.style.backgroundColor = index % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(240, 245, 251, 0.9)';
                        row.style.transform = 'translateX(0)';
                        row.style.boxShadow = 'none';
                      }}
                    >
                      <td style={{
                        border: 'none',
                        padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                        fontWeight: '600',
                        color: '#64748b',
                        fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                        wordBreak: 'break-word'
                      }}>
                        {race.date}
                      </td>

                      <td style={{
                        border: 'none',
                        padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                        fontWeight: '500',
                        color: '#374151',
                        fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                        wordBreak: 'break-word',
                        lineHeight: '1.3'
                      }}>
                        {raceName}
                      </td>

                      <td style={{
                        border: 'none',
                        padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                        fontWeight: '800',
                        color: '#3b82f6',
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                        textAlign: 'center'
                      }}>
                        #{position}
                      </td>

                      <td style={{
                        border: 'none',
                        padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                        fontWeight: '700',
                        color: '#059669',
                        fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                        textAlign: 'center'
                      }}>
                        {(() => {
                          if (topPercentage !== '-') {
                            return (
                              <span style={{
                                background: getPercentageColor(topPercentage),
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                width: '3rem',
                                display: 'inline-block',
                                textAlign: 'center'
                              }}>
                                {topPercentage}%
                              </span>
                            );
                          }
                          return (
                            <span style={{
                              color: '#9ca3af',
                              fontSize: '0.875rem',
                              fontStyle: 'italic'
                            }}>
                              {getRaceById ? '-' : t('ui.loading')}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRadius: '1rem',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          color: '#6b7280',
          fontSize: '1rem'
        }}>
          {selectedYears.length > 0 ? t('ui.noRacesInSelectedYears') || 'No races found for the selected years.' : t('ui.noRaceData') || 'No race history available.'}
        </div>
      )}
    </div>
  );
};

export default CyclistRaceHistoryTable;