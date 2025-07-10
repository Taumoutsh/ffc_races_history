import { jsPDF } from 'jspdf';
import jsPDFAutoTable from 'jspdf-autotable';
import { parseFrenchDate } from './dateUtils.js';

/**
 * Generate a PDF with research results and cyclist race histories
 * Optimized for iPhone viewing with clickable navigation
 */
export const generateResearchPDF = async (researchResults, getCyclistHistory, organizerClub = '', t) => {
  // Create PDF optimized for mobile viewing
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Initialize autoTable plugin
  pdf.autoTable = function(options) {
    return jsPDFAutoTable(pdf, options);
  };

  // Set font for better mobile readability
  pdf.setFont('helvetica');
  
  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(t('pdf.title') || 'Research Results', 105, 20, { align: 'center' });
  
  // Add organizer club info if provided
  if (organizerClub.trim()) {
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${t('pdf.organizerClub') || 'Organizer Club'}: ${organizerClub}`, 105, 30, { align: 'center' });
  }

  // Add generation date
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  const date = new Date().toLocaleDateString();
  pdf.text(`${t('pdf.generatedOn') || 'Generated on'}: ${date}`, 105, organizerClub.trim() ? 40 : 35, { align: 'center' });

  // Research results table
  let currentY = organizerClub.trim() ? 50 : 45;
  
  // Prepare table data
  const tableData = researchResults.map(racer => {
    return [
      racer.estimatedNumber.toString(),
      racer.bestPosition.toString(),
      racer.formattedName,
      racer.region,
      racer.team
    ];
  });

  // Create table with mobile-optimized styling
  pdf.autoTable({
    head: [[
      t('ui.estimatedNumber') || 'Est. #',
      t('ui.bestPosition') || 'Best Pos.',
      t('table.name') || 'Name',
      t('table.region') || 'Region',
      t('table.team') || 'Team'
    ]],
    body: tableData,
    startY: currentY,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 }, // Est. #
      1: { halign: 'center', cellWidth: 25 }, // Best Pos.
      2: { halign: 'left', cellWidth: 50, textColor: [59, 130, 246] },   // Name (blue for reference)
      3: { halign: 'left', cellWidth: 35 },   // Region
      4: { halign: 'left', cellWidth: 60 }    // Team
    }
  });

  // Store cyclist page locations for table of contents
  const cyclistPageLocations = {};
  
  // Add table of contents section
  currentY = pdf.lastAutoTable.finalY + 20;
  
  // Check if we need a new page for table of contents
  if (currentY > 220) {
    pdf.addPage();
    currentY = 20;
  }
  
  // Table of contents header
  pdf.setFontSize(14);
  pdf.setTextColor(59, 130, 246);
  pdf.text(t('pdf.tableOfContents') || 'Table of Contents - Race Histories', 20, currentY);
  currentY += 15;
  
  // Add cyclist histories
  currentY += 5;
  
  for (const racer of researchResults) {
    const history = getCyclistHistory(racer.id);
    if (!history || history.length === 0) continue;
    
    // Debug: Log the first race to understand the data structure
    if (history.length > 0) {
      console.log(`Cyclist ${racer.formattedName} first race:`, history[0]);
    }
    
    // Sort race history by date (most recent first)
    const sortedHistory = [...history].sort((a, b) => {
      try {
        const dateA = parseFrenchDate(a.date || '');
        const dateB = parseFrenchDate(b.date || '');
        return dateB - dateA; // Descending order (most recent first)
      } catch (error) {
        // If date parsing fails, maintain original order
        return 0;
      }
    });

    // Format race history data properly
    const formattedHistory = sortedHistory.map(race => ({
      date: race.date || 'N/A',
      race: race.race_name || 'N/A',
      position: race.rank || 'N/A'
    }));

    // Check if we need a new page
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
    }

    // Store this cyclist's page location
    const pageNumber = pdf.getCurrentPageInfo().pageNumber;
    cyclistPageLocations[racer.id] = {
      page: pageNumber,
      y: currentY,
      name: racer.formattedName
    };
    
    // Cyclist name header
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${t('pdf.raceHistoryFor') || 'Race History for'} ${racer.formattedName}`, 20, currentY);
    currentY += 10;

    // Cyclist stats
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${t('ui.bestPosition') || 'Best Position'}: #${racer.bestPosition} | ${t('table.totalRaces') || 'Total Races'}: ${history.length}`, 20, currentY);
    currentY += 10;

    // Race history table
    const raceTableData = formattedHistory.map(race => [
      race.date,
      race.race,
      race.position?.toString() || 'N/A'
    ]);

    pdf.autoTable({
      head: [[
        t('table.date') || 'Date',
        t('table.race') || 'Race',
        t('table.position') || 'Position'
      ]],
      body: raceTableData,
      startY: currentY,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 }, // Date
        1: { halign: 'left', cellWidth: 100 },  // Race
        2: { halign: 'center', cellWidth: 20 }  // Position
      },
      margin: { left: 20, right: 20 }
    });

    currentY = pdf.lastAutoTable.finalY + 10;

    // Add "Back to Top" button
    const buttonY = currentY;
    const buttonWidth = 40;
    const buttonHeight = 8;
    const buttonX = (210 - buttonWidth) / 2; // Center on page

    // Button background
    pdf.setFillColor(59, 130, 246);
    pdf.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');

    // Button text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(t('pdf.backToTop') || 'Back to Top', buttonX + buttonWidth/2, buttonY + 5, { align: 'center' });

    // Make button clickable (link to first page)
    pdf.link(buttonX, buttonY, buttonWidth, buttonHeight, { pageNumber: 1 });

    // Reset text color
    pdf.setTextColor(0, 0, 0);
    currentY += 15;
  }

  // Update table of contents with page numbers
  if (Object.keys(cyclistPageLocations).length > 0) {
    // Go back to the table of contents page
    const tocPageNumber = 1; // Assuming it's on the first page
    pdf.setPage(tocPageNumber);
    
    // Find the table of contents Y position (after the header we added earlier)
    let tocY = pdf.lastAutoTable.finalY + 55;
    
    // Add entries for each cyclist
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    Object.values(cyclistPageLocations).forEach((location, index) => {
      const entryY = tocY + (index * 5);
      pdf.text(`• ${location.name}`, 25, entryY);
      pdf.text(`Page ${location.page}`, 150, entryY);
    });
  }

  // Add footer with instructions
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(t('pdf.instructions') || 'Click on cyclist names to view race history. Use "Back to Top" buttons to return to the main table.', 
             105, 285, { align: 'center', maxWidth: 170 });
    pdf.text(`${t('pdf.page') || 'Page'} ${i} ${t('pdf.of') || 'of'} ${pageCount}`, 105, 295, { align: 'center' });
  }

  return pdf;
};

/**
 * Download the generated PDF
 */
export const downloadResearchPDF = async (researchResults, getCyclistHistory, organizerClub = '', t, raceData = null) => {
  try {
    // Validate inputs
    if (!researchResults || researchResults.length === 0) {
      throw new Error('No research results to export');
    }
    
    if (typeof getCyclistHistory !== 'function') {
      throw new Error('getCyclistHistory must be a function');
    }
    
    if (typeof t !== 'function') {
      throw new Error('Translation function must be provided');
    }

    const pdf = await generateResearchPDF(researchResults, getCyclistHistory, organizerClub, t);
    
    // Generate filename with race data if available
    let fileName;
    if (raceData && raceData.raceName && raceData.raceDate) {
      // Format: race date_race place_data_export datetime
      const now = new Date();
      const exportDateTime = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-MM-SS
      
      // Clean race name for filename
      const cleanRaceName = raceData.raceName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      
      // Parse and format race date to YYYY-MM-DD
      let formattedRaceDate = '';
      try {
        // Handle French date format like "12 juillet 2025"
        const frenchMonths = {
          'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
          'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
        };
        
        const dateParts = raceData.raceDate.toLowerCase().split(' ');
        if (dateParts.length >= 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = frenchMonths[dateParts[1]] || '01';
          const year = dateParts[2];
          formattedRaceDate = `${year}-${month}-${day}`;
        } else {
          // Fallback: use current date if parsing fails
          formattedRaceDate = new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        // Fallback: use current date if parsing fails
        formattedRaceDate = new Date().toISOString().split('T')[0];
      }
      
      fileName = `${formattedRaceDate}_${cleanRaceName}_data_export_${exportDateTime}.pdf`;
    } else {
      // Fallback to original format
      fileName = `research-results-${new Date().toISOString().split('T')[0]}.pdf`;
    }
    
    pdf.save(fileName);
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};