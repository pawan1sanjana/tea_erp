import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Save, X, AlertTriangle, CheckCircle, Loader2, Edit2, Eye, Database } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function GPSFieldMapping({ selectedField, onMapUpdate }) {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCoords, setEditingCoords] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: null, lng: null });
  const [coordsData, setCoordsData] = useState({ north: '', south: '', east: '', west: '' });
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [yieldHistory, setYieldHistory] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name or status

  // Fetch blocks from API
  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/crop/blocks');
      if (response.success) {
        setBlocks(response.data);
        onMapUpdate(response.data);
      } else {
        showMessage('error', 'Failed to load blocks');
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
      showMessage('error', 'Cannot connect to database');
    } finally {
      setLoading(false);
    }
  };

  // Fetch yield history for selected block
  const fetchYieldHistory = async (blockId) => {
    try {
      const response = await apiClient.get(`/crop/blocks/${blockId}/yields`);
      if (response.success) {
        setYieldHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch yield history:', error);
      setYieldHistory([]);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (selectedBlock) {
      fetchYieldHistory(selectedBlock.id);
      // Parse existing coordinates if they exist
      if (selectedBlock.polygon_coordinates) {
        try {
          const coords = JSON.parse(selectedBlock.polygon_coordinates);
          setCoordsData(coords);
          setCurrentCoords({ lat: coords.north, lng: coords.east });
        } catch (e) {
          setCoordsData({ north: '', south: '', east: '', west: '' });
        }
      }
    }
  }, [selectedBlock]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSelectBlock = (block) => {
    setSelectedBlock(block);
    setEditingCoords(false);
  };

  const handleCoordsChange = (field, value) => {
    setCoordsData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showMessage('error', 'Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordsData(prev => ({
          ...prev,
          north: latitude.toFixed(6),
          east: longitude.toFixed(6)
        }));
        showMessage('success', 'Current location captured');
      },
      (error) => {
        showMessage('error', `Location error: ${error.message}`);
      }
    );
  };

  const saveCoordinates = async () => {
    if (!selectedBlock) return;
    if (!coordsData.north || !coordsData.east) {
      showMessage('error', 'North and East coordinates are required');
      return;
    }

    setSaving(true);
    try {
      const polygonData = {
        north: parseFloat(coordsData.north),
        south: parseFloat(coordsData.south) || null,
        east: parseFloat(coordsData.east),
        west: parseFloat(coordsData.west) || null
      };

      const response = await apiClient.put(`/crop/blocks/${selectedBlock.id}`, {
        polygon_coordinates: JSON.stringify(polygonData)
      });

      if (response.success) {
        setSelectedBlock(prev => ({
          ...prev,
          polygon_coordinates: JSON.stringify(polygonData)
        }));
        setEditingCoords(false);
        showMessage('success', 'Coordinates saved successfully');
      } else {
        showMessage('error', 'Failed to save coordinates');
      }
    } catch (error) {
      console.error('Save failed:', error);
      showMessage('error', 'Error saving coordinates');
    } finally {
      setSaving(false);
    }
  };

  const calculateArea = () => {
    if (!coordsData.north || !coordsData.south || !coordsData.east || !coordsData.west) {
      return 'Incomplete coordinates';
    }

    const latDiff = Math.abs(parseFloat(coordsData.north) - parseFloat(coordsData.south));
    const lngDiff = Math.abs(parseFloat(coordsData.east) - parseFloat(coordsData.west));
    const approximateArea = (latDiff * lngDiff * 111 * 111).toFixed(2);

    return `~${approximateArea} sq km`;
  };

  const sortedBlocks = [...blocks].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return a.status.localeCompare(b.status);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast Messages */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-4 ${
          message.type === 'success'
            ? 'bg-green-500/90 text-white'
            : 'bg-red-500/90 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blocks List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database size={20} className="text-tea-500" />
                Field Blocks
              </h3>
              <button
                onClick={fetchBlocks}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh blocks"
              >
                <Navigation size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'name'
                    ? 'bg-tea-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setSortBy('status')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'status'
                    ? 'bg-tea-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Status
              </button>
            </div>

            {/* Blocks List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-5 h-5 text-tea-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Loading blocks...</p>
                </div>
              ) : blocks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No blocks found</p>
              ) : (
                sortedBlocks.map(block => (
                  <button
                    key={block.id}
                    onClick={() => handleSelectBlock(block)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                      selectedBlock?.id === block.id
                        ? 'bg-tea-500/10 border-tea-500 text-tea-700 dark:text-tea-400'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-sm">{block.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {block.division_name || 'Division'} • {block.area_hectares} ha
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {block.status}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Block Details & Coordinates Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBlock ? (
            <>
              {/* Block Header */}
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedBlock.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {selectedBlock.division_name} Division
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedBlock.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : selectedBlock.status === 'fallow'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {selectedBlock.status}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Area</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedBlock.area_hectares} ha</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tea Variety</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedBlock.tea_variety}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Yield</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedBlock.last_yield || '—'} kg</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Quality</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedBlock.quality_grade || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* GPS Coordinates Section */}
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin size={20} className="text-tea-500" />
                    GPS Coordinates
                  </h3>
                  {!editingCoords && (
                    <button
                      onClick={() => setEditingCoords(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-tea-500 text-white text-xs font-bold rounded-lg hover:bg-tea-600 transition-all"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>

                {editingCoords ? (
                  <div className="space-y-4">
                    {/* Coordinate Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          North Latitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="e.g., 6.9271"
                          value={coordsData.north}
                          onChange={(e) => handleCoordsChange('north', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          South Latitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Optional"
                          value={coordsData.south}
                          onChange={(e) => handleCoordsChange('south', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          East Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="e.g., 80.7744"
                          value={coordsData.east}
                          onChange={(e) => handleCoordsChange('east', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          West Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Optional"
                          value={coordsData.west}
                          onChange={(e) => handleCoordsChange('west', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={getCurrentLocation}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all"
                      >
                        <Navigation size={14} /> Use Current Location
                      </button>
                      <button
                        onClick={() => setEditingCoords(false)}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveCoordinates}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-tea-500 text-white text-xs font-bold rounded-lg hover:bg-tea-600 disabled:opacity-50 transition-all"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coordsData.north && coordsData.east ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">North</p>
                            <p className="text-sm font-mono text-slate-900 dark:text-white mt-1">{coordsData.north}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">East</p>
                            <p className="text-sm font-mono text-slate-900 dark:text-white mt-1">{coordsData.east}</p>
                          </div>
                          {coordsData.south && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">South</p>
                              <p className="text-sm font-mono text-slate-900 dark:text-white mt-1">{coordsData.south}</p>
                            </div>
                          )}
                          {coordsData.west && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">West</p>
                              <p className="text-sm font-mono text-slate-900 dark:text-white mt-1">{coordsData.west}</p>
                            </div>
                          )}
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                            📍 Calculated Area: {calculateArea()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                        <AlertTriangle size={16} className="mx-auto text-amber-600 dark:text-amber-400 mb-2" />
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                          No coordinates assigned yet
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">Click Edit to add GPS coordinates</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Yield History */}
              {yieldHistory.length > 0 && (
                <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Yield Records</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {yieldHistory.slice(0, 5).map((y, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{y.total_kg} kg</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{y.record_date}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          y.quality_grade === 'A'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : y.quality_grade === 'B'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          Grade {y.quality_grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Select a block from the list to view and edit GPS coordinates
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
