import { useState, useEffect } from 'react';
import { appConfig } from '../config/appConfig.js';

// Dynamic API URL detection for network access
const getApiBaseUrl = () => {
  // If VITE_API_URL is set during build, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For runtime, detect the current host
  const currentHost = window.location.hostname;
  
  // If accessing via network IP or domain, use the same host for API
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}:3001/api`;
  }
  
  // Default to localhost for local development
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export const useApiData = (dynamicDefaultCyclist) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data in YAML-compatible format for easier migration
        const response = await fetch(`${API_BASE_URL}/export/yaml`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    
    const { firstName, lastName } = dynamicDefaultCyclist || appConfig.defaultCyclist;
    
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
          rank: cyclistParticipant.rank
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
      const response = await fetch(`${API_BASE_URL}/cyclists/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const results = await response.json();
      
      return results.map(cyclist => ({
        id: cyclist.uci_id,
        name: formatName(cyclist.first_name, cyclist.last_name),
        totalRaces: cyclist.total_races || 0
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
              totalRaces: history.length
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
    const { firstName, lastName } = dynamicDefaultCyclist || appConfig.defaultCyclist;
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
    
    const { firstName, lastName } = dynamicDefaultCyclist || appConfig.defaultCyclist;
    const participantFirstName = participantData.raw_data[3];
    const participantLastName = participantData.raw_data[2];
    
    return participantFirstName?.toLowerCase() === firstName?.toLowerCase() && 
           participantLastName?.toLowerCase() === lastName?.toLowerCase();
  };

  // Check if a cyclist ID belongs to the default cyclist
  const isDefaultCyclistById = (cyclistId, cyclistName) => {
    const { firstName, lastName } = dynamicDefaultCyclist || appConfig.defaultCyclist;
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

  // Research function to find racers from imported list using API
  const researchRacers = async (importedRacersList) => {
    if (!importedRacersList?.trim()) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/research/entry-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryList: importedRacersList
        })
      });
      
      if (!response.ok) {
        throw new Error(`Research failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform API response to match expected format
      return result.results
        .filter(racer => racer.found_in_db)
        .map(racer => ({
          id: racer.db_uci_id || racer.uci_id,
          firstName: racer.first_name,
          lastName: racer.last_name,
          region: racer.region,
          team: racer.team || racer.club || 'N/A', // Use team, fallback to club, then N/A
          bestPosition: racer.best_position,
          formattedName: formatName(racer.first_name, racer.last_name)
        }))
        .sort((a, b) => a.bestPosition - b.bestPosition);
        
    } catch (err) {
      return [];
    }
  };

  // API-specific functions for direct database access
  const api = {
    // Get cyclist details from API
    getCyclist: async (uciId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/cyclists/${encodeURIComponent(uciId)}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('API getCyclist error:', err);
        return null;
      }
    },

    // Get race details from API
    getRace: async (raceId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/races/${encodeURIComponent(raceId)}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('API getRace error:', err);
        return null;
      }
    },

    // Get database stats
    getStats: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('API getStats error:', err);
        return null;
      }
    },

    // Health check
    healthCheck: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
      } catch (err) {
        return false;
      }
    }
  };

  return {
    data,
    loading,
    error,
    getDefaultCyclistRaces,
    getDefaultCyclistInfo,
    getRaceById,
    getCyclistHistory,
    searchCyclist,
    formatName,
    researchRacers,
    cleanClubName,
    isDefaultCyclist,
    isDefaultCyclistById,
    api,
    apiBaseUrl: API_BASE_URL
  };
};