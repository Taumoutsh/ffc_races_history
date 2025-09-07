import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const RacesList = ({ onRaceClick }) => {
  const { t } = useTranslation();
  const [allRaces, setAllRaces] = useState([]);
  const [displayedRaces, setDisplayedRaces] = useState([]);
  const [filteredRaces, setFilteredRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);

  const RACES_PER_PAGE = 20;

  // Load races data from API
  useEffect(() => {
    const loadRaces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/races`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const racesData = await response.json();
        setAllRaces(racesData);
        setFilteredRaces(racesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRaces();
  }, []);

  // Helper function to parse French date format
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

  // Normalize text for search (handle accents)
  const normalizeForSearch = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Filter races based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRaces(allRaces);
    } else {
      const normalizedQuery = normalizeForSearch(searchQuery);
      const filtered = allRaces.filter(race => 
        normalizeForSearch(race.name).includes(normalizedQuery)
      );
      setFilteredRaces(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, allRaces]);

  // Sort filtered races
  useEffect(() => {
    const sorted = [...filteredRaces].sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'date') {
        const dateA = parseFrenchDate(a.date);
        const dateB = parseFrenchDate(b.date);
        compareValue = dateA - dateB;
      } else if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'participants') {
        compareValue = a.participant_count - b.participant_count;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setDisplayedRaces(sorted);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [filteredRaces, sortBy, sortOrder]);

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Get races for current page
  const getRacesForPage = () => {
    const startIndex = 0;
    const endIndex = currentPage * RACES_PER_PAGE;
    return displayedRaces.slice(startIndex, endIndex);
  };

  // Load more races
  const loadMoreRaces = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Handle race click
  const handleRaceClick = (race) => {
    if (onRaceClick && race.id) {
      onRaceClick(race.id);
    }
  };

  const racesToShow = getRacesForPage();
  const hasMoreRaces = currentPage * RACES_PER_PAGE < displayedRaces.length;

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span style={{color: '#d1d5db'}}>↕</span>;
    return sortOrder === 'asc' ? <span style={{color: '#2563eb'}}>↑</span> : <span style={{color: '#2563eb'}}>↓</span>;
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        {t('ui.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px',
        margin: '20px'
      }}>
        {t('ui.error')}: {error}
      </div>
    );
  }

  return (
    <div style={{
      background: 'transparent',
      padding: '0',
      margin: '0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#1f2937',
          fontSize: 'clamp(1.125rem, 3vw, 1.5rem)'
        }}>
          🏁 {t('ui.races')} ({displayedRaces.length})
        </h2>
        
        {/* Search Input */}
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder={t('ui.searchRaces')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#1f2937',
              fontSize: '16px',
              minWidth: 'clamp(200px, 50vw, 300px)',
              width: '100%',
              maxWidth: '400px'
            }}
          />
        </div>
      </div>


      {/* Races Table */}
      {racesToShow.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          padding: '2rem 0'
        }}>
          {searchQuery ? 
            t('ui.noRacesFound') :
            t('ui.noRaces')
          }
        </div>
      ) : (
        <>
          <div style={{
            borderRadius: '1rem', 
            border: '1px solid rgba(59, 130, 246, 0.2)', 
            overflow: 'hidden'
          }}>
            <div style={{
              overflow: 'hidden'
            }}>
              <table style={{width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed'}}>
                <thead>
                  <tr style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'}}>
                    <th 
                      style={{
                        border: 'none', 
                        borderBottom: '2px solid rgba(59, 130, 246, 0.2)', 
                        padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.5rem)', 
                        textAlign: 'left', 
                        cursor: 'pointer', 
                        fontWeight: '700', 
                        color: '#1f2937',
                        transition: 'background-color 0.2s ease',
                        userSelect: 'none',
                        width: '25%',
                        fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)'
                      }}
                      onClick={() => handleSortChange('date')}
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
                        padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.5rem)', 
                        textAlign: 'left', 
                        cursor: 'pointer', 
                        fontWeight: '700', 
                        color: '#1f2937',
                        transition: 'background-color 0.2s ease',
                        userSelect: 'none',
                        width: '55%',
                        fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)'
                      }}
                      onClick={() => handleSortChange('name')}
                    >
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                        🏁 {t('ui.raceName')}
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th 
                      style={{
                        border: 'none', 
                        borderBottom: '2px solid rgba(59, 130, 246, 0.2)', 
                        padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.5rem)', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        fontWeight: '700', 
                        color: '#1f2937',
                        transition: 'background-color 0.2s ease',
                        userSelect: 'none',
                        width: '20%',
                        fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)'
                      }}
                      onClick={() => handleSortChange('participants')}
                    >
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none'}}>
                        👥 {t('ui.participants')}
                        <SortIcon field="participants" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {racesToShow.map((race, index) => (
                    <tr 
                      key={race.id}
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
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '600', color: '#64748b', fontSize: 'clamp(0.6rem, 2vw, 0.75rem)', wordBreak: 'break-word'}}>
                        {race.date}
                      </td>
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '500', color: '#374151', fontSize: 'clamp(0.6rem, 2vw, 0.75rem)', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {race.name}
                      </td>
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '800', color: '#3b82f6', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', textAlign: 'center'}}>
                        {race.participant_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More Button */}
          {hasMoreRaces && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={loadMoreRaces}
                style={{
                  padding: window.innerWidth < 768 ? '8px' : '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  minWidth: window.innerWidth < 768 ? '44px' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {window.innerWidth < 768 ? 
                  '⬇️' : 
                  `⬇️ ${t('ui.loadMore')} (${displayedRaces.length - racesToShow.length} ${t('ui.remaining')})`}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default RacesList;