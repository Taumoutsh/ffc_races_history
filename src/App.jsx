import { useState, useEffect } from 'react';
import { useApiData } from './hooks/useApiData';
import PerformanceChart from './components/PerformanceChart';
import RaceLeaderboardModal from './components/RaceLeaderboardModal';
import CyclistProfile from './components/CyclistProfile';
import LanguageSwitcher from './components/LanguageSwitcher';
import RacesList from './components/RacesList';
import { appConfig } from './config/appConfig.js';
import { useTranslation } from './contexts/LanguageContext';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerContent: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    letterSpacing: '-0.025em'
  },
  subtitle: {
    color: '#64748b',
    marginTop: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '500'
  },
  main: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  chartCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '2rem'
  },
  searchCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '2rem',
    marginBottom: '2rem'
  },
  instructions: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
    borderRadius: '1rem',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  },
  instructionsTitle: {
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: '0.75rem',
    fontSize: '1.125rem'
  },
  instructionsList: {
    color: '#1e40af',
    fontSize: '0.875rem',
    margin: 0,
    paddingLeft: '1rem',
    lineHeight: '1.6'
  },
  overviewCard: {
    marginTop: '2rem',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '2rem'
  },
  overviewTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#1f2937'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem'
  },
  statCard: {
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    lineHeight: '1'
  },
  statLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginTop: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  loading: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif"
  },
  error: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif"
  },
  errorText: {
    fontSize: '1.25rem',
    color: '#dc2626',
    fontWeight: '600'
  }
};

function App() {
  const { t, defaultCyclist, updateDefaultCyclist } = useTranslation();
  const { data, loading, error, getDefaultCyclistRaces, getDefaultCyclistInfo, getRaceById, getCyclistHistory, searchCyclist, formatName, researchRacers, isDefaultCyclist, isDefaultCyclistById, api } = useApiData(defaultCyclist);
  const [selectedRace, setSelectedRace] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedCyclist, setSelectedCyclist] = useState(null);
  const [showCyclistProfile, setShowCyclistProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [researchInput, setResearchInput] = useState('');
  const [researchResults, setResearchResults] = useState([]);
  const [showResearchSection, setShowResearchSection] = useState(false);
  const [showRacesPanel, setShowRacesPanel] = useState(false);


  const handleChartPointClick = (raceData) => {
    const race = getRaceById(raceData.raceId);
    if (race) {
      setSelectedRace(race);
      setShowLeaderboard(true);
    } else {
      // Show a message for missing race data
      alert(`Race data not available for ${raceData.name}`);
    }
  };

  const handleCyclistClick = (cyclistId, cyclistName) => {
    const history = getCyclistHistory(cyclistId);
    setSelectedCyclist({ id: cyclistId, name: cyclistName, history });
    setShowLeaderboard(false);
    setShowCyclistProfile(true);
  };

  const handleRaceClick = (raceId) => {
    const race = getRaceById(raceId);
    if (race) {
      setSelectedRace(race);
      setShowLeaderboard(true);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const results = await searchCyclist(searchQuery.trim());
      setSearchResults(results);
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      const results = await searchCyclist(value.trim());
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };


  const handleSearchResultClick = (cyclist) => {
    const history = getCyclistHistory(cyclist.id);
    setSelectedCyclist({ id: cyclist.id, name: cyclist.name, history });
    setShowCyclistProfile(true);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleDefaultCyclistChange = (newDefaultCyclist) => {
    updateDefaultCyclist(newDefaultCyclist);
  };

  const handleResearchSubmit = async (e) => {
    e.preventDefault();
    if (researchInput.trim()) {
      const results = await researchRacers(researchInput.trim());
      setResearchResults(results);
    }
  };

  const handleResearchRacerClick = (racer) => {
    const history = getCyclistHistory(racer.id);
    setSelectedCyclist({ id: racer.id, name: racer.formattedName, history });
    setShowCyclistProfile(true);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={{fontSize: '1.25rem'}}>{t('ui.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div style={styles.errorText}>{t('ui.loadingError')}: {error}</div>
      </div>
    );
  }

  const defaultCyclistRaces = getDefaultCyclistRaces();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerText}>
            <h1 style={styles.title}>{t('ui.headerTitle')}</h1>
            <p style={styles.subtitle}>{t('ui.headerSubtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main style={styles.main}>
        {/* Search Section */}
        <div style={styles.searchCard}>
          <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1f2937'}}>🔍 {t('ui.searchPlaceholder')}</h3>
          <form onSubmit={handleSearch} style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={t('ui.searchPlaceholder')}
              style={{
                flex: 1,
                padding: '1rem',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 10px 16px -4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {t('ui.searchPlaceholder').replace('...', '')}
            </button>
            <button
              onClick={() => setShowRacesPanel(true)}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 10px 16px -4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              🏁 {t('ui.viewRaces') || 'View All Races'}
            </button>
          </form>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{marginTop: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '1rem', backgroundColor: 'rgba(249, 250, 251, 0.8)', backdropFilter: 'blur(10px)'}}>
              <h4 style={{padding: '1rem', margin: 0, fontWeight: '700', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', color: '#1f2937'}}>
                🎯 {t('ui.searchPlaceholder').replace('...', '')} ({searchResults.length} found)
              </h4>
              <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                {searchResults.map((cyclist, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultClick(cyclist)}
                    style={{
                      padding: '1rem',
                      borderBottom: index < searchResults.length - 1 ? '1px solid rgba(229, 231, 235, 0.5)' : 'none',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const item = e.currentTarget;
                      item.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      item.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      const item = e.currentTarget;
                      item.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                      item.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem'}}>{cyclist.name}</div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280', fontWeight: '500'}}>
                      ID: {cyclist.id} • {cyclist.totalRaces} {t('table.totalRaces').toLowerCase()} 🏆
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <div style={{
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '1rem', 
              color: '#dc2626',
              fontWeight: '600'
            }}>
              ❌ {t('ui.noResults')} "{searchQuery}"
            </div>
          )}
        </div>

        {/* Research Section */}
        <div style={styles.searchCard}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0}}>🔬 {t('ui.researchRacers')}</h3>
            <button
              onClick={() => setShowResearchSection(!showResearchSection)}
              style={{
                padding: '0.75rem 1.5rem',
                background: showResearchSection ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              {showResearchSection ? `🔼 ${t('ui.researchToggleHide')}` : `🔽 ${t('ui.researchToggleShow')}`}
            </button>
          </div>
          
          {showResearchSection && (
            <>
              <p style={{color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem'}}>
                📋 {t('ui.researchInstructions')}
              </p>
              <form onSubmit={handleResearchSubmit} style={{marginBottom: '1.5rem'}}>
                <textarea
                  value={researchInput}
                  onChange={(e) => setResearchInput(e.target.value)}
                  placeholder="10001234567    MARTIN    Pierre    Access 2    CENTRE VAL DE LOIRE    VELO CLUB EXAMPLE&#10;10002345678    DURAND    Sophie    Access 1    NOUVELLE AQUITAINE    CYCLISTE CLUB SAMPLE&#10;10003456789    BERNARD    Julien    Access 3    BRETAGNE    TEAM CYCLING DEMO"
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="submit"
                  style={{
                    marginTop: '1rem',
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 10px 16px -4px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  🔍 {t('ui.researchButton')}
                </button>
              </form>

              {/* Research Results */}
              {researchResults.length > 0 && (
                <div style={{border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '1rem', backgroundColor: 'rgba(240, 253, 244, 0.8)', backdropFilter: 'blur(10px)'}}>
                  <h4 style={{padding: '1rem', margin: 0, fontWeight: '700', borderBottom: '1px solid rgba(34, 197, 94, 0.2)', color: '#059669'}}>
                    ✅ {t('ui.foundRacers')} ({researchResults.length})
                  </h4>
                  
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 120px 1fr 150px 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    borderBottom: '2px solid rgba(34, 197, 94, 0.2)',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    color: '#059669'
                  }}>
                    <div>🥇 {t('ui.bestPosition')}</div>
                    <div>🆔 ID</div>
                    <div>👤 {t('table.name')}</div>
                    <div>📍 {t('table.region')}</div>
                    <div>🏃‍♂️ {t('table.team')}</div>
                  </div>
                  
                  <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {researchResults.map((racer, index) => {
                      const isDefault = isDefaultCyclistById(racer.id, racer.formattedName);
                      return (
                      <div
                        key={index}
                        onClick={() => handleResearchRacerClick(racer)}
                        style={{
                          padding: '1rem',
                          borderBottom: index < researchResults.length - 1 ? '1px solid rgba(229, 231, 235, 0.5)' : 'none',
                          cursor: 'pointer',
                          backgroundColor: isDefault ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.7)',
                          transition: 'all 0.2s ease',
                          display: 'grid',
                          gridTemplateColumns: '100px 120px 1fr 150px 1fr',
                          gap: '1rem',
                          alignItems: 'center',
                          borderLeft: isDefault ? '4px solid #10b981' : 'none',
                          boxShadow: isDefault ? '0 2px 8px rgba(34, 197, 94, 0.2)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          const item = e.currentTarget;
                          item.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                          item.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          const item = e.currentTarget;
                          item.style.backgroundColor = isDefault ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.7)';
                          item.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{fontWeight: '800', color: '#059669', fontSize: '1.125rem'}}>
                          🥇 #{racer.bestPosition}
                        </div>
                        <div style={{fontWeight: '600', color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem'}}>
                          🆔 {racer.id}
                        </div>
                        <div style={{fontWeight: '700', color: '#1f2937'}}>
                          👤 {racer.formattedName}
                        </div>
                        <div style={{fontWeight: '500', color: '#64748b', fontSize: '0.875rem'}}>
                          📍 {racer.region}
                        </div>
                        <div style={{fontWeight: '500', color: '#64748b', fontSize: '0.875rem'}}>
                          🏃‍♂️ {racer.team}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {researchInput && researchResults.length === 0 && (
                <div style={{
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '1rem', 
                  color: '#dc2626',
                  fontWeight: '600'
                }}>
                  ❌ {t('ui.noRacersFound')}
                </div>
              )}
            </>
          )}
        </div>

        {defaultCyclistRaces.length > 0 ? (
          <div key={`chart-container-${getDefaultCyclistInfo().firstName}-${getDefaultCyclistInfo().lastName}-${defaultCyclistRaces.length}`} style={styles.chartCard}>
            <PerformanceChart 
              key={`chart-${getDefaultCyclistInfo().firstName}-${getDefaultCyclistInfo().lastName}-${Date.now()}`}
              data={defaultCyclistRaces} 
              onPointClick={handleChartPointClick}
              cyclistName={getDefaultCyclistInfo().fullName}
            />
            <div style={styles.instructions}>
              <h3 style={styles.instructionsTitle}>{t('ui.howToUse')}</h3>
              <ul style={styles.instructionsList}>
                <li>📊 <strong>{t('chart.title')}:</strong> {t('ui.instructionPoint')}</li>
                <li>⏮️⏭️ <strong>{t('ui.instructionChart')}</strong></li>
                <li>👥 <strong>{t('ui.leaderboard')}:</strong> {t('ui.instructionLeaderboard')}</li>
                <li>🔍 <strong>{t('ui.searchPlaceholder').replace('...', '')}:</strong> {t('ui.instructionSearch')}</li>
                <li>🏁 <strong>{t('ui.instructionRaceList')}</strong></li>
                <li>⭐ <strong>{t('ui.instructionDefaultCyclist')}</strong></li>
                <li>📋 <strong>{t('ui.instructionSort')}</strong></li>
                <li>🔬 <strong>{t('ui.instructionResearch')}</strong></li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={styles.chartCard}>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#374151', textAlign: 'center'}}>
              {t('ui.noRaceData')} {getDefaultCyclistInfo().fullName}
            </h2>
            <p style={{color: '#6b7280', marginTop: '0.5rem', textAlign: 'center'}}>
              Please check the YAML data file
            </p>
          </div>
        )}

        <div style={styles.overviewCard}>
          <h2 style={styles.overviewTitle}>{t('ui.datasetOverview')}</h2>
          <div style={styles.statsGrid}>
            <div style={{...styles.statCard, backgroundColor: '#eff6ff'}}>
              <div style={{...styles.statNumber, color: '#2563eb'}}>
                {data?.scraping_info?.total_races || 0}
              </div>
              <div style={{...styles.statLabel, color: '#1e40af'}}>{t('ui.totalRaces')}</div>
            </div>
            <div style={{...styles.statCard, backgroundColor: '#f0fdf4'}}>
              <div style={{...styles.statNumber, color: '#16a34a'}}>
                {data?.scraping_info?.total_racers || 0}
              </div>
              <div style={{...styles.statLabel, color: '#15803d'}}>{t('ui.totalRacers')}</div>
            </div>
            <div style={{...styles.statCard, backgroundColor: '#faf5ff'}}>
              <div style={{...styles.statNumber, color: '#9333ea'}}>
                {defaultCyclistRaces.length}
              </div>
              <div style={{...styles.statLabel, color: '#7c3aed'}}>{getDefaultCyclistInfo().fullName} {t('ui.races')}</div>
            </div>
          </div>
        </div>
      </main>

      {/* Races Panel Modal */}
      {showRacesPanel && (
        <div style={{
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
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRacesPanel(false);
          }
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '1.5rem', 
            maxWidth: '80rem', 
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
                  fontSize: '2rem', 
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em',
                  margin: 0
                }}>🏁 {t('ui.viewRaces') || 'All Races'}</h2>
                <button
                  onClick={() => setShowRacesPanel(false)}
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

              {/* Panel Content */}
              <RacesList onRaceClick={handleRaceClick} />
            </div>
          </div>
        </div>
      )}

      <RaceLeaderboardModal
        race={selectedRace}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        onCyclistClick={handleCyclistClick}
        formatName={formatName}
        isDefaultCyclist={isDefaultCyclist}
      />

      <CyclistProfile
        cyclistId={selectedCyclist?.id}
        cyclistName={selectedCyclist?.name}
        history={selectedCyclist?.history}
        isOpen={showCyclistProfile}
        onClose={() => setShowCyclistProfile(false)}
        onPointClick={handleChartPointClick}
        onRaceClick={handleRaceClick}
        isDefaultCyclistById={isDefaultCyclistById}
        onDefaultChange={handleDefaultCyclistChange}
        getDefaultCyclistRaces={getDefaultCyclistRaces}
        getDefaultCyclistInfo={getDefaultCyclistInfo}
        api={api}
      />
    </div>
  );
}

export default App;