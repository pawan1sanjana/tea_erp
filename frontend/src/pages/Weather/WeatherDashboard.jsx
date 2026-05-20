import React, { useState, useEffect } from 'react';
import { Cloud, MapPin, AlertCircle, Leaf, BarChart3, History } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WeatherDashboard() {
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoadingLocation(false);
        }
      );
    }
  }, []);

  const modules = [
    {
      id: 'realtime',
      title: 'Real-Time Weather',
      description: 'Live weather data based on your current location',
      icon: Cloud,
      color: 'from-sky-400 to-blue-500',
      path: '/weather/realtime',
      stats: ['Temperature', 'Humidity', 'Wind Speed', 'Rainfall']
    },
    {
      id: 'fertilizer',
      title: 'Fertilizer Recommendation',
      description: 'Smart fertilizer suggestions based on weather conditions',
      icon: Leaf,
      color: 'from-green-400 to-emerald-500',
      path: '/weather/fertilizer',
      stats: ['Soil Status', 'Weather Impact', 'Recommendations']
    },
    {
      id: 'historical',
      title: 'Historical Data',
      description: 'Analyze weather patterns and trends over time',
      icon: History,
      color: 'from-purple-400 to-indigo-500',
      path: '/weather/historical',
      stats: ['Trends', 'Patterns', 'Analytics']
    }
  ];

  return (
    <div className="animate-fade-in relative">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
          Weather Intelligence Platform
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
          {loadingLocation ? (
            <>
              <AlertCircle size={18} />
              Getting your location...
            </>
          ) : location ? (
            <>
              <MapPin size={18} className="text-tea-500" />
              {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
            </>
          ) : (
            <>
              <AlertCircle size={18} />
              Enable location for personalized weather data
            </>
          )}
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.id} to={module.path}>
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-full hover:shadow-xl hover:border-tea-500 transition-all cursor-pointer group">
                {/* Gradient Background Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${module.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={28} />
                </div>

                {/* Title & Description */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {module.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {module.description}
                </p>

                {/* Stats */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {module.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-tea-500" />
                      {stat}
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-tea-500 to-tea-600 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all group-hover:translate-x-1">
                    Explore →
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Cloud className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Current Condition</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">Partly Cloudy</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Active Alerts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">2 Alerts</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Leaf className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Crop Status</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">Healthy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
