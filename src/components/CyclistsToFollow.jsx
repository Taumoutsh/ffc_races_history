import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { parseFrenchDate } from '../utils/dateUtils';

const CyclistsToFollow = forwardRef(({ onCyclistClick }, ref) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [followedCyclists, setFollowedCyclists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('lastRace');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch followed cyclists on mount
  useEffect(() => {
    fetchFollowedCyclists();
  }, [token]);

  // Expose fetchFollowedCyclists method to parent components
  useImperativeHandle(ref, () => ({
    fetchFollowedCyclists
  }));

  const fetchFollowedCyclists = async () => {
    try {
      // Only show loading state if there's no data yet
      if (followedCyclists.length === 0) {
        setLoading(true);
      }
      setError(null);

      const response = await axios.get('/followed-cyclists', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFollowedCyclists(response.data);
    } catch (err) {
      console.error('Error fetching followed cyclists:', err);
      setError(err.response?.data?.error || 'Failed to load followed cyclists');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{color: '#d1d5db'}}>⇅</span>;
    return sortDirection === 'asc' ? <span style={{color: '#2563eb'}}>↑</span> : <span style={{color: '#2563eb'}}>↓</span>;
  };

  const handleCyclistRowClick = async (cyclist) => {
    // Update last_check_date in the backend
    try {
      await axios.post(`/cyclists/${cyclist.uci_id}/mark-checked`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh the followed cyclists list to update red dot visibility
      await fetchFollowedCyclists();
    } catch (err) {
      console.error('Error updating last check date:', err);
      // Don't block the profile opening if this fails
    }

    // Open the cyclist profile
    if (onCyclistClick) {
      onCyclistClick(cyclist.uci_id, cyclist.name, cyclist.team, cyclist.region);
    }
  };


  // Sort cyclists
  const sortedCyclists = [...followedCyclists].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'team':
        aVal = (a.team || '').toLowerCase();
        bVal = (b.team || '').toLowerCase();
        break;
      case 'lastRace':
        // Sort by date of last race
        if (!a.last_race && !b.last_race) return 0;
        if (!a.last_race) return sortDirection === 'asc' ? 1 : -1;
        if (!b.last_race) return sortDirection === 'asc' ? -1 : 1;

        try {
          const aDate = parseFrenchDate(a.last_race.date);
          const bDate = parseFrenchDate(b.last_race.date);
          aVal = aDate.getTime();
          bVal = bDate.getTime();
        } catch {
          aVal = 0;
          bVal = 0;
        }
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div>
        <h4 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem'}}>
          ⭐ {t('ui.cyclistsToFollow') || 'Cyclists to Follow'}
        </h4>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRadius: '1rem',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          color: '#6b7280',
          fontSize: '1rem'
        }}>
          {t('ui.loading') || 'Loading'}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h4 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem'}}>
          ⭐ {t('ui.cyclistsToFollow') || 'Cyclists to Follow'}
        </h4>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRadius: '1rem',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          color: '#dc2626',
          fontSize: '1rem'
        }}>
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{marginBottom: window.innerWidth < 768 ? '0.75rem' : '1.5rem'}}>
        <h4 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', margin: 0}}>
          📋 {t('ui.cyclistsToFollow') || 'Cyclists to Follow'} ({followedCyclists.length})
        </h4>
      </div>

      {followedCyclists.length > 0 ? (
        <div style={{
          borderRadius: '1rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflow: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'}}>
                  <th
                    style={{
                      border: 'none',
                      borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                      borderRight: '1px solid rgba(59, 130, 246, 0.1)',
                      padding: window.innerWidth < 768 ? 'clamp(0.5rem, 2vw, 1rem) clamp(0.25rem, 1vw, 0.5rem)' : 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: '700',
                      color: '#1f2937',
                      transition: 'background-color 0.2s ease',
                      userSelect: 'none',
                      fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                      width: window.innerWidth < 768 ? '35%' : '15%'
                    }}
                    onClick={() => handleSort('name')}
                  >
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                      {window.innerWidth < 768 ? '👤' : `👤 ${t('table.name') || 'Name'}`}
                      <SortIcon field="name" />
                    </div>
                  </th>
                  {window.innerWidth >= 768 && (
                    <th
                      style={{
                        border: 'none',
                        borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                        borderRight: '1px solid rgba(59, 130, 246, 0.1)',
                        padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: '700',
                        color: '#1f2937',
                        transition: 'background-color 0.2s ease',
                        userSelect: 'none',
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                        width: '20%'
                      }}
                      onClick={() => handleSort('team')}
                    >
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                        🏃‍♂️ {t('table.team') || 'Team'}
                        <SortIcon field="team" />
                      </div>
                    </th>
                  )}
                  <th
                    style={{
                      border: 'none',
                      borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                      borderRight: window.innerWidth >= 768 ? '1px solid rgba(59, 130, 246, 0.1)' : 'none',
                      padding: window.innerWidth < 768 ? 'clamp(0.5rem, 2vw, 1rem) clamp(0.25rem, 1vw, 0.5rem)' : 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1rem)',
                      textAlign: 'left',
                      cursor: window.innerWidth >= 768 ? 'default' : 'pointer',
                      fontWeight: '700',
                      color: '#1f2937',
                      transition: 'background-color 0.2s ease',
                      userSelect: 'none',
                      fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                      width: window.innerWidth < 768 ? '65%' : '35%'
                    }}
                    onClick={window.innerWidth < 768 ? () => handleSort('lastRace') : undefined}
                  >
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                      {window.innerWidth < 768 ? '🏁' : `🏁 ${t('ui.lastRace') || 'Last Race'}`}
                      {window.innerWidth < 768 && <SortIcon field="lastRace" />}
                    </div>
                  </th>
                  {window.innerWidth >= 768 && (
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
                      onClick={() => handleSort('lastRace')}
                    >
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                        📅 {t('table.date') || 'Date'}
                        <SortIcon field="lastRace" />
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedCyclists.map((cyclist, index) => {
                  const hasNewRace = cyclist.has_new_race;

                  return (
                    <tr
                      key={cyclist.uci_id}
                      onClick={() => handleCyclistRowClick(cyclist)}
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
                        padding: window.innerWidth < 768 ? 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.15rem, 0.5vw, 0.25rem)' : 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                        fontWeight: '600',
                        color: '#1f2937',
                        fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                        wordBreak: 'break-word'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          {hasNewRace && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#ef4444',
                              borderRadius: '50%',
                              display: 'inline-block',
                              flexShrink: 0,
                              title: t('ui.newRaceIndicator') || 'New race since last check'
                            }}></span>
                          )}
                          {cyclist.first_name.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase())} {cyclist.last_name}
                        </div>
                      </td>

                      {window.innerWidth >= 768 && (
                        <td style={{
                          border: 'none',
                          padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                          fontWeight: '500',
                          color: '#374151',
                          fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                          wordBreak: 'break-word',
                          lineHeight: '1.3'
                        }}>
                          {cyclist.team || '-'}
                        </td>
                      )}

                      <td style={{
                        border: 'none',
                        padding: window.innerWidth < 768 ? 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.15rem, 0.5vw, 0.25rem)' : 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                        fontWeight: '500',
                        color: '#64748b',
                        fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                        wordBreak: 'break-word'
                      }}>
                        {cyclist.last_race ? (
                          <div>
                            <div style={{fontWeight: '600', marginBottom: window.innerWidth < 768 ? '0.25rem' : '0'}}>
                              {cyclist.last_race.race_name}
                              {window.innerWidth >= 768 && <span style={{color: '#64748b', marginLeft: '0.5rem'}}>• #{cyclist.last_race.rank}</span>}
                            </div>
                            {window.innerWidth < 768 && (
                              <div style={{fontSize: '0.8em', fontWeight: '600'}}>
                                {cyclist.last_race.date} • #{cyclist.last_race.rank}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{color: '#9ca3af', fontStyle: 'italic'}}>
                            {t('ui.noRaceData') || 'No races'}
                          </span>
                        )}
                      </td>

                      {window.innerWidth >= 768 && (
                        <td style={{
                          border: 'none',
                          padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)',
                          fontWeight: '600',
                          color: '#64748b',
                          fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                          wordBreak: 'break-word'
                        }}>
                          {cyclist.last_race ? cyclist.last_race.date : '-'}
                        </td>
                      )}
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
          padding: '1rem',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRadius: '1rem',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '700'
        }}>
{t('ui.noFollowedCyclists') || 'No followed cyclists yet. Use the ⭐ button in cyclist profiles to follow them.'}
        </div>
      )}
    </div>
  );
});

export default CyclistsToFollow;