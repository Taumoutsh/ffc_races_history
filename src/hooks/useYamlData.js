import { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import { appConfig } from '../config/appConfig.js';

export const useYamlData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.yaml');
        const yamlText = await response.text();
        const parsedData = yaml.load(yamlText);
        setData(parsedData);
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

  // Helper function to find default cyclist's race data
  const getDefaultCyclistRaces = () => {
    if (!data) return [];
    
    const { firstName, lastName } = appConfig.defaultCyclist;
    const defaultCyclistRaces = [];
    
    Object.entries(data.races).forEach(([raceId, race]) => {
      const cyclistParticipant = race.participants.find(p => 
        p.raw_data[2] === lastName && p.raw_data[3] === firstName
      );
      
      if (cyclistParticipant) {
        defaultCyclistRaces.push({
          raceId,
          date: race.date,
          name: race.name,
          position: parseInt(cyclistParticipant.raw_data[0]),
          rank: cyclistParticipant.rank
        });
      }
    });
    
    // Sort by date using proper French date parsing
    return defaultCyclistRaces.sort((a, b) => parseFrenchDate(a.date) - parseFrenchDate(b.date));
  };


  // Helper function to get race by ID
  const getRaceById = (raceId) => {
    return data?.races?.[raceId] || null;
  };

  // Helper function to get cyclist history by ID
  const getCyclistHistory = (cyclistId) => {
    return data?.racers_history?.[cyclistId] || [];
  };

  // Helper function to search cyclists by name
  const searchCyclist = (query) => {
    if (!data) return [];
    
    const cyclists = new Map();
    const searchTerm = query.toLowerCase();
    
    // Search through all races to find cyclists
    Object.entries(data.races).forEach(([raceId, race]) => {
      race.participants.forEach(participant => {
        const lastName = participant.raw_data[2]?.toLowerCase() || '';
        const firstName = participant.raw_data[3]?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const reverseName = `${lastName} ${firstName}`.trim();
        const cyclistId = participant.raw_data[1];
        
        // Check if query matches first name, last name, or full name
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
    const { firstName, lastName } = appConfig.defaultCyclist;
    return {
      firstName,
      lastName,
      fullName: formatName(firstName, lastName)
    };
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
    formatName
  };
};