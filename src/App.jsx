import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiData } from './hooks/useApiData';
import PerformanceChart from './components/PerformanceChart';
import RaceLeaderboardModal from './components/RaceLeaderboardModal';
import CyclistProfile from './components/CyclistProfile';
import BurgerMenu from './components/BurgerMenu';
import RacesList from './components/RacesList';
import UserManagement from './components/admin/UserManagement';
import MessagePanel from './components/MessagePanel';
import DateFilter from './components/DateFilter';
import CyclistRaceHistoryTable from './components/CyclistRaceHistoryTable';
import CyclistsToFollow from './components/CyclistsToFollow';
import { appConfig } from './config/appConfig.js';
import { useTranslation } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import axios from 'axios';

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
    padding: window.innerWidth < 768 ? '0.5rem' : '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: window.innerWidth < 768 ? '0.5rem' : '1rem'
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
    padding: window.innerWidth < 768 ? '0.5rem' : '1rem'
  },
  chartCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: window.innerWidth < 768 ? 'clamp(0.5rem, 2vw, 0.75rem)' : 'clamp(1rem, 3vw, 2rem)',
    overflow: 'visible'
  },
  searchCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: window.innerWidth < 768 ? 'clamp(0.5rem, 2vw, 0.75rem)' : 'clamp(0.75rem, 2.5vw, 1.5rem)',
    marginBottom: window.innerWidth < 768 ? '0.5rem' : '1rem'
  },
  overviewCard: {
    marginTop: window.innerWidth < 768 ? 'clamp(0.5rem, 1vw, 0.5rem)' : 'clamp(0.5rem, 2vw, 1rem)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: window.innerWidth < 768 ? 'clamp(0.5rem, 2vw, 0.75rem)' : 'clamp(0.75rem, 3vw, 2rem)'
  },
  overviewTitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
    fontWeight: '700',
    marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
    color: '#1f2937'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: 'clamp(0.5rem, 2vw, 1.5rem)',
    justifyContent: 'center'
  },
  statCard: {
    padding: window.innerWidth < 768 ? 'clamp(0.5rem, 2vw, 0.75rem)' : 'clamp(0.75rem, 3vw, 1.5rem)',
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
  const { isAdmin } = useAuth();
  const { data, stats, scrapingInfo, loading, error, getDefaultCyclistRaces, getDefaultCyclistInfo, getRaceById, getCyclistHistory, searchCyclist, formatName, researchRacers, scrapeRaceData, isDefaultCyclist, isDefaultCyclistById, api } = useApiData(defaultCyclist);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  const [selectedRace, setSelectedRace] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedCyclist, setSelectedCyclist] = useState(null);
  const [showCyclistProfile, setShowCyclistProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [researchInput, setResearchInput] = useState('');
  const [researchResults, setResearchResults] = useState([]);
  const [filteredResearchResults, setFilteredResearchResults] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [organizerClub, setOrganizerClub] = useState('');
  const [showRacesPanel, setShowRacesPanel] = useState(false);
  const [raceUrl, setRaceUrl] = useState('');
  const [scrapedRaceData, setScrapedRaceData] = useState(null);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [racesSelectedYears, setRacesSelectedYears] = useState([]);
  const [chartSelectedYears, setChartSelectedYears] = useState([]);
  const [historySelectedYears, setHistorySelectedYears] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [researchSortField, setResearchSortField] = useState('bestPosition');
  const [researchSortDirection, setResearchSortDirection] = useState('asc');
  const cyclistsToFollowRef = useRef();

  // Prevent background scrolling when any modal is open (centralized solution)
  useEffect(() => {
    const openModals = [showAdminPanel, showRacesPanel, showCyclistProfile, showLeaderboard];
    const anyModalOpen = openModals.some(modal => modal);

    if (anyModalOpen) {
      // Store original overflow if not already stored
      if (!document.body.dataset.originalOverflow) {
        document.body.dataset.originalOverflow = document.body.style.overflow || 'auto';
      }
      document.body.style.overflow = 'hidden';
    } else {
      // Restore original overflow only when no modals are open
      if (document.body.dataset.originalOverflow) {
        document.body.style.overflow = document.body.dataset.originalOverflow;
        delete document.body.dataset.originalOverflow;
      }
    }
  }, [showAdminPanel, showRacesPanel, showCyclistProfile, showLeaderboard]);

  const [analysisErrorMessage, setAnalysisErrorMessage] = useState(null);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Helper function to format datetime in French timezone
  const formatDateTimeInFrenchTimezone = (isoString) => {
    if (!isoString) return '';

    try {
      const date = new Date(isoString);
      // Format to French timezone (Europe/Paris) - date only
      return date.toLocaleDateString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  // Update available categories and filter results when research results change
  useEffect(() => {
    if (researchResults.length > 0) {
      // Extract unique categories from research results
      const categories = [...new Set(researchResults.map(racer => racer.category).filter(Boolean))].sort();
      setAvailableCategories(categories);

      // If no categories are selected, select all by default
      if (selectedCategories.length === 0) {
        setSelectedCategories(categories);
      }
    } else {
      setAvailableCategories([]);
      setSelectedCategories([]);
    }
  }, [researchResults]);

  // Filter research results based on selected categories
  useEffect(() => {
    if (selectedCategories.length === 0) {
      // When no categories are selected, show empty list
      setFilteredResearchResults([]);
    } else {
      const filtered = researchResults.filter(racer => selectedCategories.includes(racer.category));
      setFilteredResearchResults(filtered);
    }
  }, [researchResults, selectedCategories]);

  // Get responsive grid columns for research results
  const getResearchGridColumns = () => {
    if (isLargeScreen) {
      // Desktop: Pos, ID, Name, Region, Team
      return 'clamp(50px, 8%, 70px) clamp(80px, 12%, 100px) 2fr clamp(80px, 15%, 120px) 2fr';
    } else {
      // Mobile: Pos, Name, Team (hiding ID and Region)
      return 'clamp(50px, 10%, 70px) 2fr 2fr';
    }
  };

  const handleChartPointClick = (raceData) => {
    const race = getRaceById(raceData.raceId);
    if (race) {
      setSelectedRace(race);
      setShowLeaderboard(true);
    } else {
      // Show inline error message for missing race data
      setAnalysisErrorMessage({
        type: 'error',
        message: `Race data not available for ${raceData.name}`,
        timestamp: Date.now()
      });
    }
  };

  const handleTableRaceClick = (raceData) => {
    handleChartPointClick(raceData);
  };

  const handleCyclistClick = (cyclistId, cyclistName, team = null, region = null) => {
    const history = getCyclistHistory(cyclistId);
    setSelectedCyclist({ id: cyclistId, name: cyclistName, history, team, region });
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
    if (value.trim().length >= 4) {
      const results = await searchCyclist(value.trim());
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };


  const handleSearchResultClick = (cyclist) => {
    const history = getCyclistHistory(cyclist.id);
    setSelectedCyclist({ id: cyclist.id, name: cyclist.name, history, team: cyclist.team, region: cyclist.region });
    setShowCyclistProfile(true);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleDefaultCyclistChange = (newDefaultCyclist) => {
    updateDefaultCyclist(newDefaultCyclist);
  };

  const handleFollowChange = () => {
    // Refresh the followed cyclists list when a cyclist is followed/unfollowed
    if (cyclistsToFollowRef.current && cyclistsToFollowRef.current.fetchFollowedCyclists) {
      cyclistsToFollowRef.current.fetchFollowedCyclists();
    }
  };

  // Handle category filter toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Handle select all categories
  const handleSelectAllCategories = () => {
    setSelectedCategories(availableCategories);
  };

  // Handle deselect all categories
  const handleDeselectAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleUrlScrape = async (e) => {
    e.preventDefault();
    if (!raceUrl.trim()) return;

    // Clear any existing error messages when starting new research
    setAnalysisErrorMessage(null);
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

      console.log('Scraped race data:', scraped);
      console.log('Research results:', results);
    } catch (error) {
      console.error('Scraping failed:', error);
      setAnalysisErrorMessage({
        type: 'error',
        message: `${t('ui.scrapingFailed') || 'Scraping failed'}: ${error.response?.data?.error || error.message}`,
        timestamp: Date.now()
      });
    } finally {
      setIsScrapingInProgress(false);
    }
  };


  const handleResearchRacerClick = (racer) => {
    // Only allow clicking on cyclists found in database
    if (!racer.foundInDb) return;

    const history = getCyclistHistory(racer.id);
    setSelectedCyclist({ id: racer.id, name: racer.formattedName, history, team: racer.team, region: racer.region });
    setShowCyclistProfile(true);
  };

  // Research table sorting functions
  const handleResearchSort = (field) => {
    if (researchSortField === field) {
      setResearchSortDirection(researchSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setResearchSortField(field);
      setResearchSortDirection('asc');
    }
  };

  const ResearchSortIcon = ({ field }) => {
    if (researchSortField !== field) return <span style={{color: '#d1d5db'}}>↕</span>;
    return researchSortDirection === 'asc' ? <span style={{color: '#059669'}}>↑</span> : <span style={{color: '#059669'}}>↓</span>;
  };


  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* App Logo and Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: '800',
            margin: '0 0 0.5rem 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '-0.025em'
          }}>
            {t('ui.headerTitle')}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
            margin: '0 auto',
            maxWidth: '400px',
            padding: '0 1rem'
          }}>
            {t('ui.headerSubtitle')}
          </p>
        </div>

        {/* Loading Animation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {/* Spinning Dots */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.8)',
                  animation: `bounce 1.4s ease-in-out infinite both`,
                  animationDelay: `${i * 0.16}s`
                }}
              />
            ))}
          </div>

          {/* Loading Text */}
          <div style={{
            color: 'white',
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            fontWeight: '500',
            textAlign: 'center',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            {t('ui.loading')}...
          </div>
        </div>

        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.05);
                opacity: 0.8;
              }
            }

            @keyframes bounce {
              0%, 80%, 100% {
                transform: scale(0);
              }
              40% {
                transform: scale(1);
              }
            }

            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }

            @media (max-width: 768px) {
              .cycling-emoji {
                font-size: 3rem !important;
              }
            }
          `
        }} />
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
          }}>API: {axios.defaults.baseURL}</p>
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
          <BurgerMenu
            showAdminPanel={showAdminPanel}
            setShowAdminPanel={setShowAdminPanel}
          />
        </div>
      </header>

      {/* Message Panel - Admin messages displayed as banner at top of page */}
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: window.innerWidth < 768 ? '0 0.5rem' : '0 1rem'
      }}>
        <MessagePanel />
      </div>

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
                fontSize: window.innerWidth < 768 ? '16px' : 'clamp(0.875rem, 2vw, 1rem)',
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
          <h3 style={{fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: '700', marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#1f2937'}}>🔬 {t('ui.researchRacers')}</h3>

          <>
              {/* Error Message in Analysis Tool */}
              {analysisErrorMessage && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    flexShrink: 0,
                    color: '#dc2626'
                  }}>
                    ⚠️
                  </div>
                  <div style={{
                    flex: 1,
                    color: '#dc2626',
                    fontWeight: '600',
                    fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                    wordBreak: 'break-word',
                    lineHeight: '1.5'
                  }}>
                    {analysisErrorMessage.message}
                  </div>
                  <button
                    onClick={() => setAnalysisErrorMessage(null)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      width: '2rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
                <form onSubmit={handleUrlScrape} style={{display: 'flex', gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem', alignItems: 'stretch', flexWrap: window.innerWidth < 768 ? 'nowrap' : 'wrap'}}>
                  <input
                    type="url"
                    value={raceUrl}
                    onChange={(e) => setRaceUrl(e.target.value)}
                    placeholder={t('ui.urlPlaceholder')}
                    style={{
                      flex: window.innerWidth < 768 ? '1 1 auto' : '1 1 250px',
                      minWidth: window.innerWidth < 480 ? '120px' : window.innerWidth < 768 ? '150px' : '250px',
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      border: '2px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '0.75rem',
                      fontSize: window.innerWidth < 768 ? '16px' : 'clamp(0.875rem, 2vw, 1rem)',
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
                        'clamp(0.5rem, 2vw, 0.75rem)' :
                        'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)',
                      background: isScrapingInProgress ?
                        'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' :
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      cursor: isScrapingInProgress ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
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
                  <button
                    type="button"
                    onClick={() => setRaceUrl('')}
                    disabled={!raceUrl.trim()}
                    style={{
                      padding: window.innerWidth < 768 ?
                        'clamp(0.5rem, 2vw, 0.75rem)' :
                        'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)',
                      background: raceUrl.trim() ?
                        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                        'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      cursor: raceUrl.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: '600',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      minWidth: '44px',
                      maxWidth: window.innerWidth < 768 ? '60px' : 'auto',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: raceUrl.trim() ? 1 : 0.8
                    }}
                    onMouseEnter={(e) => {
                      if (raceUrl.trim()) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {window.innerWidth < 768 ? '🗑️' : `🗑️ ${t('ui.clear') || 'Clear'}`}
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


              {/* Research Results */}
              {researchResults.length > 0 && (
                <div style={{border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '1rem', backgroundColor: 'rgba(240, 253, 244, 0.8)', backdropFilter: 'blur(10px)', overflowX: 'hidden'}}>
                  <div style={{
                    padding: '1rem',
                    margin: 0,
                    fontWeight: '700',
                    borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                    color: '#059669'
                  }}>
                    ✅ {t('ui.foundRacers')} ({filteredResearchResults.filter(r => r.foundInDb).length}/{filteredResearchResults.length} {t('ui.found')})
                  </div>

                  {/* Category Filter */}
                  {availableCategories.length > 0 && (
                    <div style={{
                      padding: '1rem',
                      borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: '#059669',
                          fontSize: '0.9rem'
                        }}>
                          🏷️ {t('ui.filterByCategory') || 'Filter by Category'}:
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleSelectAllCategories}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: selectedCategories.length === availableCategories.length ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                              color: selectedCategories.length === availableCategories.length ? 'white' : '#059669',
                              border: '1px solid #10b981',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {t('ui.selectAll') || 'All'}
                          </button>
                          <button
                            onClick={handleDeselectAllCategories}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: selectedCategories.length === 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                              color: selectedCategories.length === 0 ? 'white' : '#dc2626',
                              border: '1px solid #ef4444',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {t('ui.selectNone') || 'None'}
                          </button>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        {availableCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => handleCategoryToggle(category)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.8rem',
                              backgroundColor: selectedCategories.includes(category) ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                              color: selectedCategories.includes(category) ? 'white' : '#3b82f6',
                              border: '1px solid #3b82f6',
                              borderRadius: '1rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontWeight: selectedCategories.includes(category) ? '600' : '500'
                            }}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                    <div
                      onClick={() => handleResearchSort('bestPosition')}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color 0.2s ease',
                        padding: '0.25rem',
                        borderRadius: '0.25rem'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🥇 Pos
                      <ResearchSortIcon field="bestPosition" />
                    </div>
                    {isLargeScreen && (
                      <div
                        onClick={() => handleResearchSort('id')}
                        style={{
                          cursor: 'pointer',
                          userSelect: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background-color 0.2s ease',
                          padding: '0.25rem',
                          borderRadius: '0.25rem'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        🆔 ID
                        <ResearchSortIcon field="id" />
                      </div>
                    )}
                    <div
                      onClick={() => handleResearchSort('name')}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color 0.2s ease',
                        padding: '0.25rem',
                        borderRadius: '0.25rem'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      👤 {t('table.name')}
                      <ResearchSortIcon field="name" />
                    </div>
                    {isLargeScreen && (
                      <div
                        onClick={() => handleResearchSort('region')}
                        style={{
                          cursor: 'pointer',
                          userSelect: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background-color 0.2s ease',
                          padding: '0.25rem',
                          borderRadius: '0.25rem'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        📍 {t('table.region')}
                        <ResearchSortIcon field="region" />
                      </div>
                    )}
                    <div
                      onClick={() => handleResearchSort('team')}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color 0.2s ease',
                        padding: '0.25rem',
                        borderRadius: '0.25rem'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🏃‍♂️ {t('table.team')}
                      <ResearchSortIcon field="team" />
                    </div>
                  </div>
                  
                  <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {(() => {
                      // Apply sorting to filtered results
                      const sortedResults = [...filteredResearchResults].sort((a, b) => {
                        let aVal, bVal;

                        switch (researchSortField) {
                          case 'position':
                          case 'bestPosition':
                            // For not found cyclists, put them at the end
                            if (!a.foundInDb && b.foundInDb) return 1;
                            if (a.foundInDb && !b.foundInDb) return -1;
                            if (!a.foundInDb && !b.foundInDb) return (a.estimatedNumber || 999) - (b.estimatedNumber || 999);
                            aVal = a.bestPosition || 999;
                            bVal = b.bestPosition || 999;
                            break;
                          case 'id':
                            aVal = (a.id || '').toLowerCase();
                            bVal = (b.id || '').toLowerCase();
                            break;
                          case 'name':
                            aVal = (a.formattedName || '').toLowerCase();
                            bVal = (b.formattedName || '').toLowerCase();
                            break;
                          case 'region':
                            aVal = (a.region || '').toLowerCase();
                            bVal = (b.region || '').toLowerCase();
                            break;
                          case 'team':
                            aVal = (a.team || '').toLowerCase();
                            bVal = (b.team || '').toLowerCase();
                            break;
                          default:
                            return 0;
                        }

                        if (aVal < bVal) return researchSortDirection === 'asc' ? -1 : 1;
                        if (aVal > bVal) return researchSortDirection === 'asc' ? 1 : -1;
                        return 0;
                      });

                      return sortedResults.map((racer, index) => {
                      const isDefault = racer.foundInDb && isDefaultCyclistById(racer.id, racer.formattedName);
                      const isOrganizer = racer.foundInDb && organizerClub.trim() && racer.team.toLowerCase().includes(organizerClub.toLowerCase().trim());
                      const isNotFound = !racer.foundInDb;

                      return (
                      <div
                        key={index}
                        onClick={() => handleResearchRacerClick(racer)}
                        style={{
                          padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                          borderBottom: index < filteredResearchResults.length - 1 ? '1px solid rgba(229, 231, 235, 0.5)' : 'none',
                          cursor: isNotFound ? 'not-allowed' : 'pointer',
                          backgroundColor: isDefault ? 'rgba(34, 197, 94, 0.15)' :
                                          isOrganizer ? 'rgba(255, 193, 7, 0.1)' :
                                          'rgba(255, 255, 255, 0.7)',
                          transition: 'all 0.2s ease',
                          display: 'grid',
                          gridTemplateColumns: getResearchGridColumns(),
                          gap: 'clamp(0.1rem, 0.5vw, 0.25rem)',
                          alignItems: 'center',
                          borderLeft: isNotFound ? '4px solid #9ca3af' :
                                     isDefault ? '4px solid #10b981' :
                                     isOrganizer ? '4px solid #fbbf24' :
                                     'none',
                          boxShadow: isNotFound ? '0 2px 8px rgba(156, 163, 175, 0.1)' :
                                    isDefault ? '0 2px 8px rgba(34, 197, 94, 0.2)' :
                                    isOrganizer ? '0 2px 8px rgba(255, 193, 7, 0.2)' :
                                    'none',
                          opacity: isNotFound ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isNotFound) {
                            const item = e.currentTarget;
                            item.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                            item.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isNotFound) {
                            const item = e.currentTarget;
                            item.style.backgroundColor = isDefault ? 'rgba(34, 197, 94, 0.15)' :
                                                        isOrganizer ? 'rgba(255, 193, 7, 0.1)' :
                                                        'rgba(255, 255, 255, 0.7)';
                            item.style.transform = 'translateX(0)';
                          }
                        }}
                      >
                        <div style={{
                          fontWeight: '800',
                          color: isNotFound ? '#9ca3af' : '#059669',
                          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                          textAlign: 'center'
                        }}>
                          {isNotFound ? '❌' : `#${racer.bestPosition}`}
                        </div>
                        {isLargeScreen && (
                          <div style={{
                            fontWeight: '600',
                            color: isNotFound ? '#9ca3af' : '#64748b',
                            fontFamily: 'monospace',
                            fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
                            wordBreak: 'break-all'
                          }}>
                            {!racer.id || racer.id === '' || !/^\d{11}$/.test(racer.id) ? t('ui.unknown') : racer.id}
                          </div>
                        )}
                        <div style={{
                          fontWeight: '700',
                          color: isNotFound ? '#9ca3af' : '#1f2937',
                          fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {racer.formattedName}
                        </div>
                        {isLargeScreen && (
                          <div style={{
                            fontWeight: '500',
                            color: isNotFound ? '#9ca3af' : '#64748b',
                            fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
                            wordBreak: 'break-word',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {racer.region}
                          </div>
                        )}
                        <div style={{
                          fontWeight: '500',
                          color: isNotFound ? '#9ca3af' : '#64748b',
                          fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {racer.team}
                        </div>
                      </div>
                      );
                      });
                    })()}
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
        </div>

        {/* Cyclists to Follow Section */}
        <div style={styles.searchCard}>
          <CyclistsToFollow ref={cyclistsToFollowRef} onCyclistClick={handleCyclistClick} />
        </div>

        {getDefaultCyclistInfo() && defaultCyclistRaces.length > 0 && (
          <div key={`chart-container-${getDefaultCyclistInfo().firstName}-${getDefaultCyclistInfo().lastName}-${defaultCyclistRaces.length}`} style={styles.chartCard}>
            <div>
              <PerformanceChart
                key={`chart-${getDefaultCyclistInfo().firstName}-${getDefaultCyclistInfo().lastName}-${Date.now()}`}
                data={defaultCyclistRaces}
                onPointClick={handleChartPointClick}
                cyclistName={getDefaultCyclistInfo().fullName}
                cyclistInfo={getDefaultCyclistInfo()}
                selectedYears={chartSelectedYears}
                onYearsChange={setChartSelectedYears}
              />
            </div>

            {/* Race History Table */}
            <div style={{ marginTop: window.innerWidth < 768 ? '0rem' : '10rem' }}>
              <CyclistRaceHistoryTable
                races={defaultCyclistRaces}
                selectedYears={historySelectedYears}
                onRaceClick={handleTableRaceClick}
                getRaceById={getRaceById}
                showDateFilter={true}
                DateFilterComponent={DateFilter}
                onYearsChange={setHistorySelectedYears}
                title={`📊 ${t('ui.raceHistory')} - ${getDefaultCyclistInfo().fullName}`}
                cyclistName={getDefaultCyclistInfo().fullName}
              />
            </div>
          </div>
        )}

        <div style={styles.overviewCard}>
          <h2 style={styles.overviewTitle}>{t('ui.datasetOverview')}</h2>
          <div style={{
            ...styles.statsGrid,
            gridTemplateColumns: window.innerWidth < 768
              ? 'repeat(2, 1fr)'
              : (getDefaultCyclistInfo() && defaultCyclistRaces.length > 0
                  ? 'repeat(4, 1fr)'
                  : 'repeat(3, 1fr)')
          }}>
            <div style={{...styles.statCard, backgroundColor: '#eff6ff'}}>
              <div style={{...styles.statNumber, color: '#2563eb'}}>
                {stats?.total_races || 0}
              </div>
              <div style={{...styles.statLabel, color: '#1e40af'}}>{t('ui.totalRaces')}</div>
            </div>
            <div style={{...styles.statCard, backgroundColor: '#f0fdf4'}}>
              <div style={{...styles.statNumber, color: '#16a34a'}}>
                {stats?.total_cyclists || 0}
              </div>
              <div style={{...styles.statLabel, color: '#15803d'}}>{t('ui.totalRacers')}</div>
            </div>
            {getDefaultCyclistInfo() && defaultCyclistRaces.length > 0 && (
              <div style={{...styles.statCard, backgroundColor: '#faf5ff'}}>
                <div style={{...styles.statNumber, color: '#9333ea'}}>
                  {defaultCyclistRaces.length}
                </div>
                <div style={{...styles.statLabel, color: '#7c3aed'}}>{getDefaultCyclistInfo().fullName} {t('ui.races')}</div>
              </div>
            )}
            <div style={{...styles.statCard, backgroundColor: '#fef2f2'}}>
              <div style={{...styles.statNumber, color: '#dc2626', textAlign: 'left'}}>
                {scrapingInfo?.timestamp ? formatDateTimeInFrenchTimezone(scrapingInfo.timestamp) : t('ui.loading')}
              </div>
              <div style={{...styles.statLabel, color: '#991b1b'}}>dernière mise à jour</div>
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
          padding: window.innerWidth < 768 ? '0' : 'clamp(0.5rem, 2vw, 1rem)',
          touchAction: 'pan-x pan-y'
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRacesPanel(false);
          }
        }}
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
        onScroll={(e) => e.preventDefault()}>
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
              style={{
                padding: window.innerWidth < 768 ? 'clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 2rem)' : 'clamp(1rem, 3vw, 2rem)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent',
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
              <RacesList 
                onRaceClick={handleRaceClick}
                selectedYears={racesSelectedYears}
                onYearsChange={setRacesSelectedYears}
                api={api}
              />
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
        team={selectedCyclist?.team}
        region={selectedCyclist?.region}
        isOpen={showCyclistProfile}
        onClose={() => setShowCyclistProfile(false)}
        onPointClick={handleChartPointClick}
        onRaceClick={handleRaceClick}
        isDefaultCyclistById={isDefaultCyclistById}
        onDefaultChange={handleDefaultCyclistChange}
        getDefaultCyclistRaces={getDefaultCyclistRaces}
        getDefaultCyclistInfo={getDefaultCyclistInfo}
        isLeaderboardOpen={showLeaderboard}
        onFollowChange={handleFollowChange}
      />

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: window.innerWidth < 768 ? '0' : '1rem',
          touchAction: 'none'
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAdminPanel(false);
          }
        }}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        onScroll={(e) => e.preventDefault()}>
          <div style={{
            maxWidth: window.innerWidth < 768 ? '95vw' : '90vw',
            maxHeight: '90vh',
            height: 'auto',
            width: '100%',
            overflow: 'hidden',
            borderRadius: window.innerWidth < 768 ? '0' : '16px',
            position: 'relative',
            touchAction: 'auto'
          }}>
            <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <UserManagement onClose={() => setShowAdminPanel(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Copyright Footer */}
      <footer style={{
        textAlign: 'center',
        padding: window.innerWidth < 768 ? '0rem' : '0rem',
        paddingBottom: window.innerWidth < 768 ? '0.5rem' : '2rem',
        marginTop: window.innerWidth < 768 ? '0.5rem' : '1rem',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
        fontWeight: '500'
      }}>
        © 2025 - Cyclisme Tomarea
      </footer>
    </div>
  );
}

export default App;