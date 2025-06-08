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

  // Check if a cyclist is the default cyclist
  const isDefaultCyclist = (participantData) => {
    if (!participantData || !participantData.raw_data) return false;
    
    const { firstName, lastName } = appConfig.defaultCyclist;
    const participantFirstName = participantData.raw_data[3];
    const participantLastName = participantData.raw_data[2];
    
    return participantFirstName === firstName && participantLastName === lastName;
  };

  // Check if a cyclist ID belongs to the default cyclist
  const isDefaultCyclistById = (cyclistId, cyclistName) => {
    const { firstName, lastName } = appConfig.defaultCyclist;
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

  // Research function to find racers from imported list
  const researchRacers = (importedRacersList) => {
    if (!data || !importedRacersList) return [];
    
    const foundRacers = [];
    
    // Parse the imported list (tab-separated or space-separated)
    const lines = importedRacersList.trim().split('\n');
    
    lines.forEach(line => {
      if (!line.trim()) return;
      
      // Split by tabs or multiple spaces to handle different formats
      const parts = line.split(/\t+|\s{2,}/).filter(part => part.trim());
      
      if (parts.length >= 3) {
        const importedId = parts[0]?.trim();
        const importedLastName = parts[1]?.trim().toUpperCase();
        const importedFirstName = parts[2]?.trim();
        
        // Search for this racer in our data
        let foundRacer = null;
        let bestPosition = Infinity;
        let racerInfo = null;
        
        // Check in races data
        Object.entries(data.races).forEach(([raceId, race]) => {
          race.participants.forEach(participant => {
            const dataId = participant.raw_data[1];
            const dataLastName = participant.raw_data[2]?.toUpperCase();
            const dataFirstName = participant.raw_data[3];
            
            // Match by ID or by name
            if (dataId === importedId || 
                (dataLastName === importedLastName && dataFirstName?.toUpperCase() === importedFirstName?.toUpperCase())) {
              
              const position = parseInt(participant.raw_data[0]);
              if (position < bestPosition) {
                bestPosition = position;
              }
              
              if (!racerInfo) {
                racerInfo = {
                  id: dataId,
                  firstName: participant.raw_data[3],
                  lastName: participant.raw_data[2],
                  region: participant.raw_data[4],
                  team: cleanClubName(participant.raw_data[5])
                };
              }
            }
          });
        });
        
        // Also check in racers_history for more complete data
        if (data.racers_history && data.racers_history[importedId]) {
          const history = data.racers_history[importedId];
          history.forEach(raceEntry => {
            if (raceEntry.rank < bestPosition) {
              bestPosition = raceEntry.rank;
            }
          });
          
          // If we found in history but not in races, try to get info from races
          if (!racerInfo && history.length > 0) {
            const firstRace = history[0];
            const raceData = getRaceById(firstRace.race_id);
            if (raceData) {
              const participant = raceData.participants.find(p => p.raw_data[1] === importedId);
              if (participant) {
                racerInfo = {
                  id: importedId,
                  firstName: participant.raw_data[3],
                  lastName: participant.raw_data[2],
                  region: participant.raw_data[4],
                  team: cleanClubName(participant.raw_data[5])
                };
              }
            }
          }
        }
        
        if (racerInfo && bestPosition !== Infinity) {
          foundRacers.push({
            ...racerInfo,
            bestPosition: bestPosition,
            formattedName: formatName(racerInfo.firstName, racerInfo.lastName)
          });
        }
      }
    });
    
    // Sort by best position
    return foundRacers.sort((a, b) => a.bestPosition - b.bestPosition);
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
    isDefaultCyclistById
  };
};