import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const RaceLeaderboardModal = ({ race, isOpen, onClose, onCyclistClick, formatName, isDefaultCyclist }) => {
  const { t } = useTranslation();
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Responsive column widths
  const getColumnWidths = () => {
    if (isLargeScreen) {
      return {
        position: '12%',
        id: '15%',
        firstName: '18%',
        lastName: '18%',
        region: '15%',
        team: '22%'
      };
    } else {
      return {
        position: '15%',
        id: '0',
        firstName: '25%',
        lastName: '25%',
        region: '15%',
        team: '20%'
      };
    }
  };
  
  const cleanClubName = (clubName) => {
    if (!clubName) return '';
    // Remove leading numbers and spaces (e.g., "5244197 VC ST SEBASTIEN" becomes "VC ST SEBASTIEN")
    return clubName.replace(/^\d+\s+/, '');
  };

  if (!isOpen || !race) return null;

  const handleCyclistClick = (participant) => {
    const cyclistId = participant.raw_data[1];
    const cyclistName = formatName(participant.raw_data[3], participant.raw_data[2]);
    const team = participant.raw_data[5] || null;
    const region = participant.raw_data[4] || null;
    onCyclistClick(cyclistId, cyclistName, team, region);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
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
        zIndex: 60,
        padding: window.innerWidth < 768 ? '0' : 'clamp(0.5rem, 2vw, 1rem)',
        touchAction: 'pan-x pan-y'
      }}
      onClick={handleBackdropClick}
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
      onScroll={(e) => e.preventDefault()}
    >
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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <h2 style={{
            fontSize: 'clamp(1.125rem, 3.5vw, 2rem)', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em'
          }}>🏆 {t('ui.leaderboard')}</h2>
          <button
            onClick={onClose}
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
        
        <div style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <h3 style={{fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem'}}>🚴‍♂️ {race.name}</h3>
          <p style={{color: '#64748b', fontWeight: '600', fontSize: '1rem'}}>📅 {race.date}</p>
        </div>

        <div style={{
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '1rem', 
          overflow: 'hidden'
        }}>
          <div style={{
            overflow: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent'
          }}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)'}}>
                <th style={{border: 'none', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', borderRight: '1px solid rgba(59, 130, 246, 0.1)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', textAlign: 'left', fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', width: getColumnWidths().position}}>
                  {window.innerWidth < 768 ? '🥇' : '🥇 Pos'}
                </th>
                {isLargeScreen && (
                  <th style={{border: 'none', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', borderRight: '1px solid rgba(59, 130, 246, 0.1)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', textAlign: 'left', fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', width: getColumnWidths().id}}>
                    🆔 ID
                  </th>
                )}
                <th style={{border: 'none', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', borderRight: '1px solid rgba(59, 130, 246, 0.1)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', textAlign: 'left', fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', width: getColumnWidths().firstName}}>
                  {window.innerWidth < 768 ? '👤' : `👤 ${t('table.firstName')}`}
                </th>
                <th style={{border: 'none', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', borderRight: '1px solid rgba(59, 130, 246, 0.1)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', textAlign: 'left', fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', width: getColumnWidths().lastName}}>
                  {window.innerWidth < 768 ? '👤' : `👤 ${t('table.lastName')}`}
                </th>
                <th style={{border: 'none', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', borderRight: '1px solid rgba(59, 130, 246, 0.1)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', textAlign: 'left', fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', width: getColumnWidths().region}}>
                  {window.innerWidth < 768 ? '📍' : '📍 Region'}
                </th>
                <th style={{border: 'none', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', textAlign: 'left', fontWeight: '700', color: '#1f2937', fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', width: getColumnWidths().team}}>
                  {window.innerWidth < 768 ? '🏃‍♂️' : `🏃‍♂️ ${t('table.team')}`}
                </th>
              </tr>
            </thead>
            <tbody>
              {race.participants
                .sort((a, b) => parseInt(a.raw_data[0]) - parseInt(b.raw_data[0]))
                .map((participant, index) => {
                  const position = parseInt(participant.raw_data[0]);
                  const isTopThree = position <= 3;
                  const isMedal = position === 1 || position === 2 || position === 3;
                  const isDefault = isDefaultCyclist ? isDefaultCyclist(participant) : false;
                  
                  return (
                    <tr 
                      key={index}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isDefault 
                          ? 'rgba(34, 197, 94, 0.15)' 
                          : index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                        transition: 'all 0.3s ease',
                        borderLeft: isDefault 
                          ? '4px solid #10b981' 
                          : isTopThree ? `4px solid ${position === 1 ? '#ffd700' : position === 2 ? '#c0c0c0' : '#cd7f32'}` : 'none',
                        boxShadow: isDefault ? '0 2px 8px rgba(34, 197, 94, 0.2)' : 'none'
                      }}
                      onClick={() => handleCyclistClick(participant)}
                      onMouseEnter={(e) => {
                        const row = e.currentTarget;
                        row.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        row.style.transform = 'translateX(4px)';
                        row.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        const row = e.currentTarget;
                        row.style.backgroundColor = isDefault 
                          ? 'rgba(34, 197, 94, 0.15)' 
                          : index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.8)';
                        row.style.transform = 'translateX(0)';
                        row.style.boxShadow = isDefault ? '0 2px 8px rgba(34, 197, 94, 0.2)' : 'none';
                      }}
                    >
                      <td style={{
                        border: 'none', 
                        padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', 
                        fontWeight: '800', 
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                        color: isTopThree ? (position === 1 ? '#d97706' : position === 2 ? '#64748b' : '#92400e') : '#3b82f6',
                        textAlign: 'center'
                      }}>
                        {isMedal ? (position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉') : `#${position}`}
                      </td>
                      {isLargeScreen && (
                        <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '600', color: '#64748b', fontFamily: 'monospace', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', wordBreak: 'break-all'}}>
                          {participant.raw_data[1]}
                        </td>
                      )}
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '700', color: '#374151', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {participant.raw_data[3] ? participant.raw_data[3].toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase()) : ''}
                      </td>
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '700', color: '#374151', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {participant.raw_data[2] ? participant.raw_data[2].toUpperCase() : ''}
                      </td>
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '500', color: '#64748b', fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {participant.raw_data[4]}
                      </td>
                      <td style={{border: 'none', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.75rem)', fontWeight: '500', color: '#64748b', fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {cleanClubName(participant.raw_data[5])}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RaceLeaderboardModal;