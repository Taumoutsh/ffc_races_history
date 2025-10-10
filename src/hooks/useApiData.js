import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { appConfig } from '../config/appConfig.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// API URL is configured in AuthContext - use the same axios instance

export const useApiData = (dynamicDefaultCyclist) => {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [scrapingInfo, setScrapingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, loading: authLoading, token } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load race data, database stats, and scraping info
        const [racesResponse, statsResponse, scrapingResponse] = await Promise.all([
          axios.get('/races/data'),
          axios.get('/stats'),
          axios.get('/scraping-info')
        ]);

        const jsonData = racesResponse.data;
        const statsData = statsResponse.data;
        const scrapingData = scrapingResponse.data;

        setData(jsonData);
        setStats(statsData);
        setScrapingInfo(scrapingData);
      } catch (err) {
        let errorMessage = err.message;

        // Provide specific error messages for common issues
        if (err.message.includes('Failed to fetch')) {
          errorMessage = `Cannot connect to API server. Check network connection and server status.`;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Only load data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated && token) {
      loadData();
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, don't try to load data
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, token]);

  // Helper function to format names (CamelCase for first name, UPPERCASE for last name)
  const formatName = (firstName, lastName) => {
    const formatCamelCase = (str) => {
      if (!str) return '';
      return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
    };
    
    const formattedFirstName = formatCamelCase(firstName);
    const formattedLastName = lastName ? lastName.toUpperCase() : '';
    
    return `${formattedFirstName} ${formattedLastName}`.trim();
  };

  // Helper function to normalize accented characters for search
  const normalizeForSearch = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
      .trim();
  };

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

  // State for memoizing default cyclist races
  const [defaultCyclistRaces, setDefaultCyclistRaces] = useState([]);

  // Effect to update default cyclist races when data or dynamicDefaultCyclist changes
  useEffect(() => {
    if (!data) {
      setDefaultCyclistRaces([]);
      return;
    }

    const defaultCyclist = dynamicDefaultCyclist || appConfig.defaultCyclist;

    // If no default cyclist is set, return empty array
    if (!defaultCyclist) {
      setDefaultCyclistRaces([]);
      return;
    }

    const { firstName, lastName } = defaultCyclist;

    const races = [];

    Object.entries(data.races).forEach(([raceId, race]) => {
      const cyclistParticipant = race.participants.find(p =>
        p.raw_data[2]?.toLowerCase() === lastName.toLowerCase() &&
        p.raw_data[3]?.toLowerCase() === firstName.toLowerCase()
      );

      if (cyclistParticipant) {
        races.push({
          raceId,
          date: race.date,
          name: race.name,
          position: parseInt(cyclistParticipant.raw_data[0]),
          rank: cyclistParticipant.rank,
          participant_count: race.participants.length
        });
      }
    });

    // Sort by date using proper French date parsing
    const sortedRaces = races.sort((a, b) => parseFrenchDate(a.date) - parseFrenchDate(b.date));

    setDefaultCyclistRaces(sortedRaces);
  }, [data, dynamicDefaultCyclist]);

  // Helper function to get default cyclist's race data
  const getDefaultCyclistRaces = () => {
    return defaultCyclistRaces;
  };

  // Helper function to get race by ID
  const getRaceById = (raceId) => {
    return data?.races?.[raceId] || null;
  };

  // Helper function to get cyclist history by ID
  const getCyclistHistory = (cyclistId) => {
    return data?.racers_history?.[cyclistId] || [];
  };

  // Helper function to search cyclists by name using local normalized search (handles accents)
  const searchCyclist = async (query) => {
    if (!query.trim()) return [];
    
    // Use local search with accent normalization for better French support
    if (data) {
      return searchCyclistLocal(query);
    }
    
    // Fallback to API if no local data available
    try {
      const response = await axios.get(`/cyclists/search?q=${encodeURIComponent(query)}`);
      const results = response.data;
      
      return results.map(cyclist => ({
        id: cyclist.uci_id,
        name: formatName(cyclist.first_name, cyclist.last_name),
        totalRaces: cyclist.total_races || 0,
      }));
    } catch (err) {
      return [];
    }
  };

  // Local search fallback function
  const searchCyclistLocal = (query) => {
    if (!data) return [];
    
    const cyclists = new Map();
    const searchTerm = normalizeForSearch(query);
    
    // Search through all races to find cyclists
    Object.entries(data.races).forEach(([raceId, race]) => {
      race.participants.forEach(participant => {
        const lastName = normalizeForSearch(participant.raw_data[2]);
        const firstName = normalizeForSearch(participant.raw_data[3]);
        const fullName = `${firstName} ${lastName}`.trim();
        const reverseName = `${lastName} ${firstName}`.trim();
        const cyclistId = participant.raw_data[1];
        
        // Check if query matches first name, last name, or full name (normalized comparison)
        if (firstName.includes(searchTerm) || 
            lastName.includes(searchTerm) || 
            fullName.includes(searchTerm) ||
            reverseName.includes(searchTerm)) {
          
          if (!cyclists.has(cyclistId)) {
            const history = getCyclistHistory(cyclistId);
            cyclists.set(cyclistId, {
              id: cyclistId,
              name: formatName(participant.raw_data[3], participant.raw_data[2]),
              totalRaces: history.length,
              team: participant.raw_data[5],
              region: participant.raw_data[4]
            });
          }
        }
      });
    });
    
    // Convert to array and sort by name
    return Array.from(cyclists.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get default cyclist information
  const getDefaultCyclistInfo = () => {
    const defaultCyclist = dynamicDefaultCyclist || appConfig.defaultCyclist;

    // If no default cyclist is set, return null
    if (!defaultCyclist) {
      return null;
    }

    const { firstName, lastName } = defaultCyclist;
    const fullName = formatName(firstName, lastName);
    return {
      firstName,
      lastName,
      fullName
    };
  };

  // Check if a cyclist is the default cyclist
  const isDefaultCyclist = (participantData) => {
    if (!participantData || !participantData.raw_data) return false;

    const defaultCyclist = dynamicDefaultCyclist || appConfig.defaultCyclist;

    // If no default cyclist is set, return false
    if (!defaultCyclist) {
      return false;
    }

    const { firstName, lastName } = defaultCyclist;
    const participantFirstName = participantData.raw_data[3];
    const participantLastName = participantData.raw_data[2];

    return participantFirstName?.toLowerCase() === firstName?.toLowerCase() &&
           participantLastName?.toLowerCase() === lastName?.toLowerCase();
  };

  // Check if a cyclist ID belongs to the default cyclist
  const isDefaultCyclistById = (cyclistId, cyclistName) => {
    const defaultCyclist = dynamicDefaultCyclist || appConfig.defaultCyclist;

    // If no default cyclist is set, return false
    if (!defaultCyclist) {
      return false;
    }

    const { firstName, lastName } = defaultCyclist;
    const defaultFullName = formatName(firstName, lastName);

    // Check by name if provided
    if (cyclistName) {
      return cyclistName === defaultFullName;
    }

    // Check by ID in racers_history
    if (data?.racers_history?.[cyclistId]) {
      return true; // We can enhance this by checking actual name in race data
    }
    
    return false;
  };

  // Helper function to clean club names
  const cleanClubName = (clubName) => {
    if (!clubName) return '';
    // Remove leading numbers and spaces (e.g., "5244197 VC ST SEBASTIEN" becomes "VC ST SEBASTIEN")
    return clubName.replace(/^\d+\s+/, '');
  };

  // Scrape race data from URL
  const scrapeRaceData = async (url) => {
    if (!url?.trim()) return null;
    
    try {
      const response = await axios.post('/research/scrape-race', {
        url: url.trim()
      });
      
      const result = response.data;
      return {
        raceName: result.race_name || '',
        raceDate: result.race_date || '',
        organizerClub: result.organizer_club || '',
        entryList: result.entry_list || ''
      };
      
    } catch (err) {
      console.error('Scraping error:', err);
      throw err;
    }
  };

  // Research function to find racers from imported list using API
  const researchRacers = async (importedRacersList, organizerClub = '') => {
    if (!importedRacersList?.trim()) return [];
    
    try {
      const response = await axios.post('/research/entry-list', {
        entryList: importedRacersList
      });
      
      const result = response.data;
      
      // Parse the original entry list to get club names and calculate estimated numbers
      const entryLines = importedRacersList.trim().split('\n');
      const parsedEntries = [];
      
      entryLines.forEach(line => {
        // Split by tab or multiple spaces (same as backend logic)
        const parts = line.split(/\t+|\s{2,}/);
        if (parts.length >= 6) {
          const [uci_id, last_name, first_name, category, region, club, team] = parts;
          
          parsedEntries.push({
            uci_id,
            last_name,
            first_name,
            club: club || '',
            team: team || club || '',
            region,
            category
          });
        }
      });
      
      // Sort entries: organizer club first, then alphabetically by club name, then by last name within each club
      parsedEntries.sort((a, b) => {
        const clubA = (a.club || '').toLowerCase().trim();
        const clubB = (b.club || '').toLowerCase().trim();
        const organizerClubLower = organizerClub.toLowerCase().trim();
        
        // Check if clubs match the organizer club
        const isOrganizerA = organizerClubLower && clubA === organizerClubLower;
        const isOrganizerB = organizerClubLower && clubB === organizerClubLower;
        
        // If one is organizer club and the other is not, organizer club comes first
        if (isOrganizerA && !isOrganizerB) return -1;
        if (!isOrganizerA && isOrganizerB) return 1;
        
        // If both are organizer club or both are not, sort alphabetically by club name
        if (clubA !== clubB) {
          return clubA.localeCompare(clubB);
        }
        
        // Within same club, sort by last name
        return (a.last_name || '').toLowerCase().localeCompare((b.last_name || '').toLowerCase());
      });
      
      // Create a map of estimated numbers by UCI ID
      const estimatedNumberMap = {};
      parsedEntries.forEach((entry, index) => {
        estimatedNumberMap[entry.uci_id] = index + 1;
      });
      
      // Transform API response to match expected format
      return result.results
        .map(racer => ({
          id: racer.db_uci_id || racer.uci_id,
          firstName: racer.first_name,
          lastName: racer.last_name,
          category: racer.category,
          region: racer.region,
          team: racer.team || racer.club || 'N/A',
          bestPosition: racer.best_position,
          averageTopPercentage: racer.average_top_percentage,
          formattedName: formatName(racer.first_name, racer.last_name),
          estimatedNumber: estimatedNumberMap[racer.db_uci_id || racer.uci_id] || '-',
          foundInDb: racer.found_in_db
        }))
        .sort((a, b) => {
          // Sort found cyclists by best position, then not found cyclists at the end
          if (a.foundInDb && !b.foundInDb) return -1;
          if (!a.foundInDb && b.foundInDb) return 1;
          if (a.foundInDb && b.foundInDb) return a.bestPosition - b.bestPosition;
          // For not found cyclists, sort by estimated number
          return (a.estimatedNumber || 0) - (b.estimatedNumber || 0);
        });
        
    } catch (err) {
      return [];
    }
  };

  // API-specific functions for direct database access (memoized to prevent recreation)
  const api = useMemo(() => ({
    // Get cyclist details from API
    getCyclist: async (uciId) => {
      try {
        const response = await axios.get(`/cyclists/${encodeURIComponent(uciId)}`);
        return response.data;
      } catch (err) {
        console.error('API getCyclist error:', err);
        return null;
      }
    },

    // Get race details from API
    getRaces: async () => {
      try {
        const response = await axios.get(`/races`);
        return response.data;
      } catch (err) {
        console.error('API getRaces error:', err);
        return null;
      }
    },

    // Get race details from API
    getRace: async (raceId) => {
      try {
        const response = await axios.get(`/races/${encodeURIComponent(raceId)}`);
        return response.data;
      } catch (err) {
        console.error('API getRace error:', err);
        return null;
      }
    },

    // Get database stats
    getStats: async () => {
      try {
        const response = await axios.get('/stats');
        return response.data;
      } catch (err) {
        console.error('API getStats error:', err);
        return null;
      }
    },

    // Health check
    healthCheck: async () => {
      try {
        const response = await axios.get('/health');
        return response.status === 200;
      } catch (err) {
        return false;
      }
    },

    // Get scraping info
    getScrapingInfo: async () => {
      try {
        const response = await axios.get('/scraping-info');
        return response.data;
      } catch (err) {
        console.error('API getScrapingInfo error:', err);
        return null;
      }
    }
  }), []); // Empty dependency array since these functions don't depend on any props or state


  return {
    data,
    stats,
    scrapingInfo,
    loading,
    error,
    getDefaultCyclistRaces,
    getDefaultCyclistInfo,
    getRaceById,
    getCyclistHistory,
    searchCyclist,
    formatName,
    researchRacers,
    scrapeRaceData,
    cleanClubName,
    isDefaultCyclist,
    isDefaultCyclistById,
    api
  };
};