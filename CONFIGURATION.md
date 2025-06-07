# Configuration Guide

This guide explains how to configure the FFC Races History Viewer for your specific needs.

## Application Configuration

### Default Cyclist Configuration

The primary configuration is located in `src/config/appConfig.js`. This file controls which cyclist is displayed by default when the application loads.

```javascript
export const appConfig = {
  // Default cyclist to display on the main chart
  defaultCyclist: {
    firstName: 'JOHN',      // First name as it appears in your data
    lastName: 'DOE',        // Last name as it appears in your data
    // Optional: specify cyclist ID if known
    // id: '10001234567'
  }
};
```

### Configuration Options

#### Default Cyclist
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `firstName` | String | Cyclist's first name (case sensitive) | `'JANE'` |
| `lastName` | String | Cyclist's last name (case sensitive) | `'SMITH'` |
| `id` | String (Optional) | Specific cyclist ID if known | `'10001234567'` |

## Data Configuration

### YAML File Location
Place your data file at: `public/data.yaml`

### Required Data Structure
Your YAML file must follow this exact structure:

```yaml
# Metadata about the scraping process
scraping_info:
  timestamp: "2025-06-07T10:30:00Z"
  total_races: 150
  total_racers: 500

# Race data - each race has a unique ID
races:
  race_001:
    date: "24 mai 2025"                    # French date format
    name: "Sample Cycling Race"           # Full race name
    participants:
    - name: '10073339054'                  # Participant identifier
      rank: 1                             # Final ranking
      raw_data:                           # Array of participant data
      - '1'                              # [0] Position
      - '10073339054'                    # [1] Cyclist ID
      - 'DOE'                            # [2] Last name (UPPERCASE)
      - 'JOHN'                           # [3] First name (UPPERCASE)
      - 'SAMPLE REGION'                  # [4] Region
      - 'SAMPLE TEAM'                    # [5] Team/Club

# Individual racer history (optional but recommended)
racers_history:
  '10073339054':                          # Cyclist ID
  - date: "24 mai 2025"                   # Race date
    race_id: race_001                     # Reference to race
    race_name: "Sample Cycling Race"      # Race name
    rank: 1                              # Position achieved
```

### Data Requirements

#### Date Format
- **Required**: French date format
- **Examples**: 
  - `"24 mai 2025"`
  - `"30 mars 2025"`
  - `"15 septembre 2024"`

#### Name Format
- **First Name**: UPPERCASE (e.g., `'JOHN'`)
- **Last Name**: UPPERCASE (e.g., `'DOE'`)
- **Consistency**: Must match exactly across all race entries

#### Participant Data Array
The `raw_data` array must contain exactly 6 elements in this order:
1. **Position** (string): `'1'`, `'2'`, `'3'`, etc.
2. **Cyclist ID** (string): Unique identifier
3. **Last Name** (string): UPPERCASE last name
4. **First Name** (string): UPPERCASE first name  
5. **Region** (string): Geographic region
6. **Team** (string): Team or club name

## Common Configuration Scenarios

### Scenario 1: Different Default Cyclist

To change the default cyclist from John DOE to Jane SMITH:

```javascript
export const appConfig = {
  defaultCyclist: {
    firstName: 'JANE',
    lastName: 'SMITH',
  },
  // ... rest of config
};
```

## Troubleshooting

### Common Issues

#### "No race data found"
- **Cause**: Default cyclist name doesn't match data
- **Solution**: Check name spelling and case in `appConfig.js`
- **Verify**: Names in YAML use UPPERCASE format

#### Application won't load
- **Cause**: Invalid YAML syntax
- **Solution**: Validate YAML file online (yamllint.com)
- **Check**: Proper indentation and quotes

#### Wrong cyclist displayed
- **Cause**: Configuration not updated
- **Solution**: Restart development server after config changes
- **Command**: `npm run dev`

### Data Validation

Before using your data file:

1. **Validate YAML syntax**: Use online YAML validator
2. **Check cyclist names**: Ensure exact case match
3. **Verify dates**: Use French format (`DD mois YYYY`)
4. **Test with small dataset**: Start with 2-3 races for testing

### Performance Considerations

#### Large Datasets
- **File size**: Keep YAML under 50MB for best performance
- **Race count**: 1000+ races may cause slow loading
- **Optimization**: Consider data pagination for very large datasets

#### Browser Memory
- **Cyclists**: 500+ cyclists work well
- **History**: Individual cyclist with 100+ races is optimal
- **Monitoring**: Check browser dev tools for memory usage

## Environment Setup

### Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Production Deployment
1. Build the application: `npm run build`
2. Deploy `dist/` folder to web server
3. Ensure `data.yaml` is accessible at `/data.yaml`
4. Configure web server for SPA routing

## Advanced Configuration

### Custom Styling
Modify styles in components using the existing inline style patterns:

```javascript
const customStyles = {
  primaryColor: '#your-color',
  secondaryColor: '#your-secondary',
  // Add to component style objects
};
```

### Adding New Metrics
Extend the data processing in `useYamlData.js`:

```javascript
// Add custom calculations
const getCustomMetrics = () => {
  // Your custom logic here
  return customData;
};
```

### Component Customization
Each component accepts props for customization:

```javascript
<PerformanceChart
  data={raceData}
  onPointClick={handleClick}
  cyclistName="Custom Name"
  // Add custom props
/>
```

---

For additional help, refer to the main [README.md](README.md) or check the source code comments.