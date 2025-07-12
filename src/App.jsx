import { useState, useEffect, useCallback } from 'react';
import { useApiData } from './hooks/useApiData';
import PerformanceChart from './components/PerformanceChart';
import RaceLeaderboardModal from './components/RaceLeaderboardModal';
import CyclistProfile from './components/CyclistProfile';
import LanguageSwitcher from './components/LanguageSwitcher';
import RacesList from './components/RacesList';
import { appConfig } from './config/appConfig.js';
import { useTranslation } from './contexts/LanguageContext';
import { downloadResearchPDF } from './utils/pdfGenerator.js';

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
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 'clamp(1rem, 2.5vw, 2.5rem)',
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
    marginTop: '0.25rem',
    fontSize: 'clamp(0.625rem, 1.5vw, 1.125rem)',
    fontWeight: '500'
  },
  main: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1rem'
  },
  chartCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: 'clamp(1rem, 3vw, 2rem)'
  },
  searchCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: 'clamp(1rem, 3vw, 2rem)',
    marginBottom: '1rem'
  },
  instructions: {
    marginTop: 'clamp(1rem, 3vw, 1.5rem)',
    padding: 'clamp(0.75rem, 3vw, 1.5rem)',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
    borderRadius: '1rem',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  },
  instructionsTitle: {
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 'clamp(0.5rem, 2vw, 0.75rem)',
    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)'
  },
  instructionsList: {
    color: '#1e40af',
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
    margin: 0,
    paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)',
    lineHeight: '1.5'
  },
  overviewCard: {
    marginTop: 'clamp(0.5rem, 2vw, 1rem)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: 'clamp(0.75rem, 3vw, 2rem)'
  },
  overviewTitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
    fontWeight: '700',
    marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
    color: '#1f2937'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 'clamp(0.75rem, 3vw, 1.5rem)'
  },
  statCard: {
    padding: 'clamp(0.75rem, 3vw, 1.5rem)',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  statNumber: {
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: '800',
    lineHeight: '1'
  },
  statLabel: {
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
    fontWeight: '600',
    marginTop: 'clamp(0.25rem, 1vw, 0.5rem)',
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
  const { data, loading, error, getDefaultCyclistRaces, getDefaultCyclistInfo, getRaceById, getCyclistHistory, searchCyclist, formatName, researchRacers, scrapeRaceData, isDefaultCyclist, isDefaultCyclistById, api, apiBaseUrl } = useApiData(defaultCyclist);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  const [selectedRace, setSelectedRace] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedCyclist, setSelectedCyclist] = useState(null);
  const [showCyclistProfile, setShowCyclistProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [researchInput, setResearchInput] = useState('');
  const [researchResults, setResearchResults] = useState([]);
  const [showResearchSection, setShowResearchSection] = useState(false);
  const [organizerClub, setOrganizerClub] = useState('');
  const [showRacesPanel, setShowRacesPanel] = useState(false);
  const [raceParticipantCounts, setRaceParticipantCounts] = useState({});
  const [raceUrl, setRaceUrl] = useState('');
  const [scrapedRaceData, setScrapedRaceData] = useState(null);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get responsive grid columns for research results
  const getResearchGridColumns = () => {
    if (isLargeScreen) {
      return 'clamp(50px, 8%, 70px) clamp(50px, 8%, 70px) clamp(80px, 12%, 100px) 2fr clamp(80px, 15%, 120px) 2fr';
    } else {
      return 'clamp(50px, 10%, 70px) clamp(50px, 10%, 70px) 2fr clamp(80px, 15%, 120px) 2fr';
    }
  };

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

  const handleUrlScrape = async (e) => {
    e.preventDefault();
    if (!raceUrl.trim()) return;
    
    setIsScrapingInProgress(true);
    try {
      const scraped = await scrapeRaceData(raceUrl.trim());
      setScrapedRaceData(scraped);
      
      // Auto-populate the form fields with scraped data and automatically process results
      setResearchInput(scraped.entryList);
      setOrganizerClub(scraped.organizerClub);
      
      // Automatically process the research results
      const results = await researchRacers(scraped.entryList, scraped.organizerClub);
      setResearchResults(results);
      
      // Show success message
      console.log('Scraped race data:', scraped);
      console.log('Research results:', results);
    } catch (error) {
      console.error('Scraping failed:', error);
      alert(`Scraping failed: ${error.message}`);
    } finally {
      setIsScrapingInProgress(false);
    }
  };


  const handleResearchRacerClick = (racer) => {
    const history = getCyclistHistory(racer.id);
    setSelectedCyclist({ id: racer.id, name: racer.formattedName, history });
    setShowCyclistProfile(true);
  };

  const handleExportPDF = async () => {
    if (researchResults.length === 0) return;
    
    const result = await downloadResearchPDF(researchResults, getCyclistHistory, organizerClub, t, scrapedRaceData);
    if (result.success) {
      // Show success message (optional)
      console.log(`PDF exported successfully: ${result.fileName}`);
    } else {
      // Handle error with user-friendly message
      console.error('PDF export failed:', result.error);
      alert(t('pdf.exportError') || `PDF export failed: ${result.error}`);
    }
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

  // Fetch participant counts for default cyclist races
  useEffect(() => {
    const defaultCyclistRaces = getDefaultCyclistRaces();
    if (defaultCyclistRaces.length > 0 && api) {
      defaultCyclistRaces.forEach(race => {
        if (race.raceId && !raceParticipantCounts[race.raceId]) {
          fetchRaceParticipantCount(race.raceId);
        }
      });
    }
  }, [getDefaultCyclistRaces, api, fetchRaceParticipantCount, raceParticipantCounts]);

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
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '500px',
          margin: '0 auto',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>⚠️</div>
          <h2 style={{
            color: '#dc2626',
            fontSize: '1.5rem',
            marginBottom: '1rem'
          }}>Connection Failed</h2>
          <p style={{
            color: '#374151',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>{error}</p>
          
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <h3 style={{
              color: '#1e40af',
              fontSize: '1rem',
              marginBottom: '0.5rem'
            }}>📱 Troubleshooting:</h3>
            <ul style={{
              color: '#374151',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              paddingLeft: '1.5rem'
            }}>
              <li>Check WiFi connection</li>
              <li>Make sure you're on the same network as the server</li>
              <li>Try refreshing the page</li>
              <li>Check if the server is running</li>
            </ul>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔄 Retry
          </button>
          
          <p style={{
            color: '#6b7280',
            fontSize: '0.75rem',
            marginTop: '1rem'
          }}>API: {apiBaseUrl}</p>
        </div>
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
          <h3 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#1f2937'}}>🔍 {t('ui.searchPlaceholder')}</h3>
          <form onSubmit={handleSearch} style={{display: 'flex', gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem', alignItems: 'stretch', flexWrap: window.innerWidth < 768 ? 'nowrap' : 'wrap'}}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={t('ui.searchPlaceholder')}
              style={{
                flex: window.innerWidth < 768 ? '1 1 auto' : '1 1 250px',
                minWidth: window.innerWidth < 480 ? '120px' : window.innerWidth < 768 ? '150px' : '250px',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.75rem',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
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
                padding: window.innerWidth < 768 ? 
                  'clamp(0.5rem, 2vw, 0.75rem)' : 
                  'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                minWidth: window.innerWidth < 768 ? '44px' : 'auto'
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
              {window.innerWidth < 768 ? '🔍' : `🔍 ${t('ui.searchPlaceholder').replace('...', '')}`}
            </button>
            <button
              onClick={() => setShowRacesPanel(true)}
              style={{
                padding: window.innerWidth < 768 ? 
                  'clamp(0.5rem, 2vw, 0.75rem)' : 
                  'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                minWidth: window.innerWidth < 768 ? '44px' : 'auto'
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
              {window.innerWidth < 768 ? '🏁' : `🏁 ${t('ui.viewRaces') || 'View All Races'}`}
            </button>
          </form>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{marginTop: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '1rem', backgroundColor: 'rgba(249, 250, 251, 0.8)', backdropFilter: 'blur(10px)'}}>
              <h4 style={{padding: window.innerWidth < 768 ? '0.5rem' : '1rem', margin: 0, fontWeight: '700', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', color: '#1f2937', fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem'}}>
                🎯 {t('ui.searchPlaceholder').replace('...', '')} ({searchResults.length} found)
              </h4>
              <div style={{maxHeight: window.innerWidth < 768 ? '200px' : '250px', overflowY: 'auto'}}>
                {searchResults.map((cyclist, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultClick(cyclist)}
                    style={{
                      padding: window.innerWidth < 768 ? '0.5rem' : '1rem',
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
                    <div style={{fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem', fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem'}}>{cyclist.name}</div>
                    <div style={{fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#6b7280', fontWeight: '500'}}>
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
            <h3 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', margin: 0}}>🔬 {t('ui.researchRacers')}</h3>
            <button
              onClick={() => setShowResearchSection(!showResearchSection)}
              style={{
                padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem 1.5rem',
                background: showResearchSection ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                minWidth: window.innerWidth < 768 ? '44px' : 'auto'
              }}
            >
              {window.innerWidth < 768 ? 
                (showResearchSection ? '🔼' : '🔽') : 
                (showResearchSection ? `🔼 ${t('ui.researchToggleHide')}` : `🔽 ${t('ui.researchToggleShow')}`)}
            </button>
          </div>
          
          {showResearchSection && (
            <>
              {/* URL Scraping Section */}
              <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                borderRadius: '1rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <h4 style={{
                  margin: '0 0 1rem 0',
                  color: '#1e40af',
                  fontWeight: '700',
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)'
                }}>
                  🌐 {t('ui.urlScraping')}
                </h4>
                <p style={{
                  color: '#64748b',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {t('ui.urlScrapingHint')}
                </p>
                <form onSubmit={handleUrlScrape} style={{display: 'flex', gap: '0.75rem', alignItems: 'stretch', flexWrap: 'wrap'}}>
                  <input
                    type="url"
                    value={raceUrl}
                    onChange={(e) => setRaceUrl(e.target.value)}
                    placeholder={t('ui.urlPlaceholder')}
                    style={{
                      flex: '1 1 250px',
                      minWidth: '250px',
                      padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                      border: '2px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '0.75rem',
                      fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
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
                    disabled={isScrapingInProgress}
                    style={{
                      padding: window.innerWidth < 768 ? 
                        'clamp(0.5rem, 1.5vw, 0.75rem)' : 
                        'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1.5rem)',
                      background: isScrapingInProgress ? 
                        'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      cursor: isScrapingInProgress ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      minWidth: window.innerWidth < 768 ? '44px' : 'auto'
                    }}
                  >
                    {window.innerWidth < 768 ? 
                      (isScrapingInProgress ? '🔄' : '🔍') : 
                      (isScrapingInProgress ? `🔄 ${t('ui.extracting')}` : `🔍 ${t('ui.extractData')}`)}
                  </button>
                </form>
                
                {/* Display scraped race info */}
                {scrapedRaceData && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <h5 style={{
                      margin: '0 0 0.5rem 0',
                      color: '#059669',
                      fontWeight: '600'
                    }}>
                      ✅ {t('ui.raceDataExtracted')}
                    </h5>
                    <div style={{fontSize: '0.875rem', color: '#064e3b'}}>
                      <div><strong>📅 {t('ui.raceFound')}:</strong> {scrapedRaceData.raceName}</div>
                      <div><strong>🗓️ {t('ui.dateFound')}:</strong> {scrapedRaceData.raceDate}</div>
                      <div><strong>🏆 {t('ui.organizerFound')}:</strong> {scrapedRaceData.organizerClub}</div>
                      <div><strong>👥 {t('ui.cyclistsFound')}:</strong> {scrapedRaceData.entryList.split('\n').filter(line => line.trim()).length} {t('ui.found')}</div>
                    </div>
                  </div>
                )}
              </div>


              {/* Research Results */}
              {researchResults.length > 0 && (
                <div style={{border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '1rem', backgroundColor: 'rgba(240, 253, 244, 0.8)', backdropFilter: 'blur(10px)', overflowX: 'hidden'}}>
                  <div style={{
                    padding: '1rem', 
                    margin: 0, 
                    fontWeight: '700', 
                    borderBottom: '1px solid rgba(34, 197, 94, 0.2)', 
                    color: '#059669',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>✅ {t('ui.foundRacers')} ({researchResults.length})</span>
                    <button
                      onClick={handleExportPDF}
                      style={{
                        padding: window.innerWidth < 768 ? '0.5rem' : '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: window.innerWidth < 768 ? '0' : '0.5rem',
                        minWidth: window.innerWidth < 768 ? '44px' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      {window.innerWidth < 768 ? '📄' : `📄 ${t('pdf.exportPDF') || 'Export PDF'}`}
                    </button>
                  </div>
                  
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: getResearchGridColumns(),
                    gap: 'clamp(0.1rem, 0.5vw, 0.25rem)',
                    alignItems: 'center',
                    padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    borderBottom: '2px solid rgba(34, 197, 94, 0.2)',
                    fontWeight: '700',
                    fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
                    color: '#059669'
                  }}>
                    <div>🔢 #</div>
                    <div>🥇 Pos</div>
                    {isLargeScreen && <div>🆔 ID</div>}
                    <div>👤 {t('table.name')}</div>
                    <div>📍 Region</div>
                    <div>🏃‍♂️ {t('table.team')}</div>
                  </div>
                  
                  <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {researchResults.map((racer, index) => {
                      const isDefault = isDefaultCyclistById(racer.id, racer.formattedName);
                      const isOrganizer = organizerClub.trim() && racer.team.toLowerCase().includes(organizerClub.toLowerCase().trim());
                      
                      return (
                      <div
                        key={index}
                        onClick={() => handleResearchRacerClick(racer)}
                        style={{
                          padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                          borderBottom: index < researchResults.length - 1 ? '1px solid rgba(229, 231, 235, 0.5)' : 'none',
                          cursor: 'pointer',
                          backgroundColor: isDefault ? 'rgba(34, 197, 94, 0.15)' : 
                                          isOrganizer ? 'rgba(255, 193, 7, 0.1)' : 
                                          'rgba(255, 255, 255, 0.7)',
                          transition: 'all 0.2s ease',
                          display: 'grid',
                          gridTemplateColumns: getResearchGridColumns(),
                          gap: 'clamp(0.1rem, 0.5vw, 0.25rem)',
                          alignItems: 'center',
                          borderLeft: isDefault ? '4px solid #10b981' : 
                                     isOrganizer ? '4px solid #fbbf24' : 
                                     'none',
                          boxShadow: isDefault ? '0 2px 8px rgba(34, 197, 94, 0.2)' : 
                                    isOrganizer ? '0 2px 8px rgba(255, 193, 7, 0.2)' : 
                                    'none'
                        }}
                        onMouseEnter={(e) => {
                          const item = e.currentTarget;
                          item.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                          item.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          const item = e.currentTarget;
                          item.style.backgroundColor = isDefault ? 'rgba(34, 197, 94, 0.15)' : 
                                                      isOrganizer ? 'rgba(255, 193, 7, 0.1)' : 
                                                      'rgba(255, 255, 255, 0.7)';
                          item.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{fontWeight: '800', color: isOrganizer ? '#fbbf24' : '#3b82f6', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', textAlign: 'center'}}>
                          #{racer.estimatedNumber}
                        </div>
                        <div style={{fontWeight: '800', color: '#059669', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', textAlign: 'center'}}>
                          #{racer.bestPosition}
                        </div>
                        {isLargeScreen && (
                          <div style={{fontWeight: '600', color: '#64748b', fontFamily: 'monospace', fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', wordBreak: 'break-all'}}>
                            {racer.id}
                          </div>
                        )}
                        <div style={{fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {racer.formattedName}
                        </div>
                        <div style={{fontWeight: '500', color: '#64748b', fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {racer.region}
                        </div>
                        <div style={{fontWeight: '500', color: '#64748b', fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {racer.team}
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
              cyclistInfo={getDefaultCyclistInfo()}
              raceParticipantCounts={raceParticipantCounts}
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
          padding: 'clamp(0.5rem, 2vw, 1rem)'
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRacesPanel(false);
          }
        }}>
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
                  fontSize: 'clamp(1.25rem, 3.5vw, 2rem)', 
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