# GIS Field Mapping Module

A comprehensive Geographic Information System (GIS) module for agricultural field management and GPS-based field mapping.

## Overview

The GIS Mapping Module provides advanced geospatial functionality for managing agricultural fields, including interactive map visualization, field data management, and precise GPS-based field boundary mapping.

## Features

### 🗺️ Field Map
- **Interactive Field Visualization**: View all fields on an interactive map interface
- **Field Selection**: Click on fields to select and view detailed information
- **Map Controls**: Zoom in/out and reset map to default view
- **Field List Sidebar**: Browsable list of all fields with status indicators
- **Real-time Updates**: Dynamic field data synchronization

**Key Features:**
- Field boundary visualization
- Active/Inactive field status indicators
- Crop type labeling
- Area measurements in hectares
- Map legend for easy interpretation

### 📊 Field Data
- **Comprehensive Field Information**: View and edit all field-related data
- **Basic Information**: Field name, area, crop type
- **Soil Information**: Soil type, moisture levels, pH values
- **Environmental Data**: Temperature monitoring and tracking
- **Observations**: Notes and additional field observations

**Key Features:**
- Read-only and edit modes
- Form validation
- Real-time data updates
- Multiple soil type options
- Environmental metrics tracking

### 📍 GPS Field Mapping
- **Real-time GPS Tracking**: Continuous or manual GPS point recording
- **Dual Tracking Modes**: 
  - Manual Mode: Click to add points manually
  - Auto Track: Continuous GPS tracking with geofencing
- **Precision Measurements**: Calculate field area and perimeter
- **Field Boundary Creation**: Create accurate field boundaries from GPS points
- **Data Export**: Export GPS data as CSV files

**Key Features:**
- High-accuracy GPS point recording
- Accuracy metrics display (±meters)
- Point management and removal
- Real-time metric calculations
- GeoJSON boundary export
- Visual point mapping

## Module Structure

```
GISMapping/
├── pages/
│   └── GISMapping/
│       ├── index.jsx           # Main GIS module page
│       └── GISMapping.css       # Main styling
├── components/
│   └── GISMapping/
│       ├── FieldMap.jsx        # Field map component
│       ├── FieldMap.css        # Field map styling
│       ├── FieldData.jsx       # Field data component
│       ├── FieldData.css       # Field data styling
│       ├── GPSFieldMapping.jsx # GPS mapping component
│       └── GPSFieldMapping.css # GPS styling
├── api/
│   └── gisService.js           # GIS API services
└── utils/
    └── gisUtils.js             # GIS utility functions
```

## Components

### Main Page (GISMapping)
The main entry point with tabbed interface for accessing all GIS features.

**Props:**
- None (manages internal state)

**State:**
- `activeTab`: Current active tab ('fieldMap', 'fieldData', 'gpsMapping')
- `selectedField`: Currently selected field object
- `mapData`: GIS mapping data

### FieldMap Component
Displays an interactive map of all fields with selection capabilities.

**Props:**
- `onFieldSelect(field)`: Callback when field is selected
- `selectedField`: Currently selected field
- `mapData`: Map visualization data

**Features:**
- Real-time field list from API
- Map controls (zoom, reset)
- Field selection and highlighting
- Status indicators

### FieldData Component
Detailed field information editor with multiple data sections.

**Props:**
- `selectedField`: Field to display data for
- `onDataUpdate(data)`: Callback when data is updated

**Features:**
- Basic field information
- Soil characteristics
- Environmental data
- Edit mode toggle
- Form validation

### GPSFieldMapping Component
Advanced GPS tracking and field boundary creation tool.

**Props:**
- `selectedField`: Field being mapped
- `onMapUpdate(data)`: Callback when map is updated

**Features:**
- Manual and automatic GPS recording
- Real-time accuracy display
- Field metrics calculation
- Point management
- Data export functionality

## API Integration

The module uses the following API endpoints:

### Fields
- `GET /api/gis/fields` - Fetch all fields
- `GET /api/gis/fields/:id` - Fetch specific field
- `PUT /api/gis/fields/:id` - Update field
- `POST /api/gis/fields` - Create field
- `DELETE /api/gis/fields/:id` - Delete field

### Boundaries
- `GET /api/gis/boundaries` - Fetch field boundaries
- `POST /api/gis/boundaries` - Save boundary
- `PUT /api/gis/boundaries/:id` - Update boundary
- `DELETE /api/gis/boundaries/:id` - Delete boundary

### GPS Tracking
- `GET /api/gis/tracking` - Fetch tracking history
- `POST /api/gis/tracking` - Save tracking data

### Metrics & Analysis
- `POST /api/gis/metrics/calculate` - Calculate field metrics
- `GET /api/gis/fields/:id/soil-analysis` - Get soil analysis

### Export
- `GET /api/gis/fields/:id/geojson` - Export as GeoJSON
- `GET /api/gis/fields/:id/kml` - Export as KML

## Utility Functions (gisUtils.js)

### Distance & Area Calculations
- `calculateDistance(lat1, lng1, lat2, lng2)` - Calculate distance between two points
- `calculatePolygonArea(points)` - Calculate area of polygon
- `calculatePerimeter(points)` - Calculate perimeter of polygon

### Unit Conversions
- `hectaresToSqKm(hectares)` - Convert hectares to square kilometers
- `sqKmToHectares(sqKm)` - Convert square kilometers to hectares

### Coordinate Utilities
- `decimalToDMS(decimal)` - Convert decimal to DMS format
- `dmsToDecimal(degrees, minutes, seconds, direction)` - Convert DMS to decimal
- `formatCoordinates(lat, lng)` - Format coordinates as string
- `validateCoordinates(lat, lng)` - Validate coordinate values

### Geometric Operations
- `isPointInPolygon(lat, lng, polygon)` - Check if point is inside polygon
- `calculateBoundingBox(points)` - Get bounding box of points
- `getPolygonCenter(points)` - Get center point of polygon
- `getNearbyFields(lat, lng, fields, radiusKm)` - Find nearby fields

### Export Functions
- `exportToGeoJSON(field, points)` - Export field as GeoJSON

## Usage Examples

### Import the module in your main App

```jsx
import GISMapping from './pages/GISMapping';

function App() {
  return (
    <Routes>
      <Route path="/gis" element={<GISMapping />} />
    </Routes>
  );
}
```

### Use API services in components

```jsx
import { fetchAllFields, updateField } from '../api/gisService';

async function loadFields() {
  try {
    const fields = await fetchAllFields();
    setFields(fields);
  } catch (error) {
    console.error('Failed to load fields:', error);
  }
}
```

### Use utility functions

```jsx
import { calculateDistance, calculatePolygonArea } from '../utils/gisUtils';

const distance = calculateDistance(20.5937, 78.9629, 20.6, 78.98);
const area = calculatePolygonArea(gpsPoints);
```

## Styling

The module uses a modern, responsive design with:
- **Color Scheme**: 
  - Primary Green: #27ae60 (Active status)
  - Primary Blue: #3498db (Interactive elements)
  - Neutral Gray: #7f8c8d (Text)
  - Background: #f8f9fa (Light sections)

- **Responsive Design**: Adapts to mobile, tablet, and desktop screens
- **Animations**: Smooth transitions and fade-in effects
- **Accessibility**: Proper contrast ratios and semantic HTML

## Browser Compatibility

- **Geolocation API**: Chrome, Firefox, Safari, Edge (requires HTTPS)
- **Modern CSS**: CSS Grid, Flexbox support required
- **ES6+**: Modern JavaScript features

## Error Handling

The module includes comprehensive error handling:
- API request failures with fallback mock data
- Geolocation permission denials
- Invalid coordinate validation
- Network error recovery

## Performance Considerations

- Lazy loading of field data
- Debounced map interactions
- Optimized re-renders with React hooks
- Efficient coordinate calculations

## Future Enhancements

- Real map provider integration (Google Maps, OpenStreetMap, Mapbox)
- Advanced soil analysis with satellite imagery
- Yield prediction models
- Crop recommendation engine
- Mobile app integration
- Historical data analysis
- Multi-field operations
- Integration with weather APIs
- Drone flight planning
- Precision agriculture tools

## License

This module is part of the Agricultural ERP System and follows the same license.

## Support

For issues, questions, or feature requests, please contact the development team.
