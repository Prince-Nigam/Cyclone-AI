"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  Search,
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface WeatherData {
  city: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  precip: number;
  precipProb: number;
  weatherCode: number;
  windSpeed: number;
  windDir: number;
  humidity: number;
  pressure: number;
  cloudCover: number;
  isRaining: boolean;
  condition: string;
  icon: string;
  hourly: Array<{
    time: string;
    temp: number;
    precip: number;
    precipProb: number;
    code: number;
  }>;
}

const POPULAR_CITIES = [
  { name: "Lucknow, UP", lat: 26.8467, lon: 80.9462 },
  { name: "Barabanki, UP", lat: 26.9298, lon: 81.1834 },
  { name: "Mumbai, MH", lat: 18.9667, lon: 72.8333 },
  { name: "Kolkata, WB", lat: 22.5726, lon: 88.3639 },
  { name: "Chennai, TN", lat: 13.0827, lon: 80.2707 },
  { name: "Bhubaneswar, OD", lat: 20.2961, lon: 85.8245 },
  { name: "Visakhapatnam, AP", lat: 17.6868, lon: 83.2185 },
  { name: "Kochi, KL", lat: 9.9312, lon: 76.2673 },
  { name: "Delhi, DL", lat: 28.6139, lon: 77.2090 },
  { name: "Ahmedabad, GJ", lat: 23.0225, lon: 72.5714 },
];

interface Props {
  selectedLocation?: { name: string; lat: number; lon: number } | null;
  onLocationChange?: (loc: { name: string; lat: number; lon: number }) => void;
}

export function LiveWeatherInspector({ selectedLocation, onLocationChange }: Props) {
  const [currentLoc, setCurrentLoc] = useState(
    selectedLocation || { name: "Lucknow, UP", lat: 26.8467, lon: 80.9462 }
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Sync if parent updates selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      setCurrentLoc(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchWeather = useCallback(async (loc: { name: string; lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat.toFixed(4)}&longitude=${loc.lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&forecast_days=2&wind_speed_unit=kn`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not fetch real-time weather data");
      const data = await res.json();

      const cur = data.current || {};
      const hourly = data.hourly || {};
      const precip = cur.precipitation ?? cur.rain ?? 0;
      const code = cur.weather_code ?? 0;

      // Translate WMO Weather Code
      let condition = "Clear Sky";
      let icon = "☀️";
      if (code >= 1 && code <= 3) { condition = "Partly Cloudy / Overcast"; icon = "⛅"; }
      else if (code >= 45 && code <= 48) { condition = "Foggy"; icon = "🌫️"; }
      else if (code >= 51 && code <= 55) { condition = "Light Drizzle"; icon = "🌦️"; }
      else if (code >= 61 && code <= 65) { condition = "Rainfall"; icon = "🌧️"; }
      else if (code >= 80 && code <= 82) { condition = "Rain Showers"; icon = "🌧️"; }
      else if (code >= 95) { condition = "Thunderstorm / Heavy Storm"; icon = "⛈️"; }

      // Format hourly (next 12 hours)
      const now = new Date();
      const currentHour = now.getHours();
      const hourlyList = [];
      const times = hourly.time || [];
      const temps = hourly.temperature_2m || [];
      const precips = hourly.precipitation || [];
      const probs = hourly.precipitation_probability || [];
      const codes = hourly.weather_code || [];

      for (let i = 0; i < Math.min(times.length, 24); i++) {
        const itemDate = new Date(times[i]);
        if (itemDate >= now && hourlyList.length < 12) {
          const hourNum = itemDate.getHours();
          const ampm = hourNum >= 12 ? "PM" : "AM";
          const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;

          hourlyList.push({
            time: `${displayHour} ${ampm}`,
            temp: Math.round(temps[i] ?? 0),
            precip: precips[i] ?? 0,
            precipProb: probs[i] ?? 0,
            code: codes[i] ?? 0,
          });
        }
      }

      setWeather({
        city: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        temp: Math.round(cur.temperature_2m ?? 0),
        feelsLike: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
        precip,
        precipProb: hourlyList[0]?.precipProb ?? (precip > 0 ? 90 : 10),
        weatherCode: code,
        windSpeed: Math.round(cur.wind_speed_10m ?? 0),
        windDir: Math.round(cur.wind_direction_10m ?? 0),
        humidity: Math.round(cur.relative_humidity_2m ?? 0),
        pressure: Math.round(cur.surface_pressure ?? 1012),
        cloudCover: Math.round(cur.cloud_cover ?? 0),
        isRaining: precip > 0 || code >= 51,
        condition,
        icon,
        hourly: hourlyList,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load location weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(currentLoc);
  }, [currentLoc, fetchWeather]);

  const handleSelectCity = (city: { name: string; lat: number; lon: number }) => {
    setCurrentLoc(city);
    setShowSearchDropdown(false);
    setSearchQuery("");
    if (onLocationChange) onLocationChange(city);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check pre-defined list first
    const match = POPULAR_CITIES.find((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      handleSelectCity(match);
      return;
    }

    // Geocoding query via Open-Meteo free geocoding API
    try {
      setLoading(true);
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchQuery.trim()
        )}&count=1&language=en&format=json`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        const newLoc = {
          name: `${top.name}${top.admin1 ? ", " + top.admin1 : ""}${top.country_code ? " (" + top.country_code + ")" : ""}`,
          lat: top.latitude,
          lon: top.longitude,
        };
        handleSelectCity(newLoc);
      } else {
        setError(`City "${searchQuery}" not found. Try another city.`);
      }
    } catch {
      setError("Geocoding service unreachable. Please choose from the list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-700/60 bg-slate-900/70 shadow-xl space-y-4">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              Live Rain &amp; Weather Inspector
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400">
              Check real-time precipitation, rain chance, and storm forecast for any location
            </p>
          </div>
        </div>

        {/* City Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xs w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search city (e.g. Lucknow)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full text-xs bg-slate-800/90 border border-slate-700 text-slate-200 pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800">
              <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60 px-3">
                Suggested Locations
              </div>
              {POPULAR_CITIES.filter((c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {city.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {city.lat.toFixed(1)}°N, {city.lon.toFixed(1)}°E
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Quick City Quick-Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-slate-500 font-bold uppercase text-[10px] flex-shrink-0">Quick Cities:</span>
        {POPULAR_CITIES.slice(0, 6).map((c) => (
          <button
            key={c.name}
            onClick={() => handleSelectCity(c)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 font-medium ${
              currentLoc.name === c.name
                ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60"
            }`}
          >
            {c.name.split(",")[0]}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => fetchWeather(currentLoc)} className="underline hover:text-white font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Main Weather Card */}
      {weather && (
        <div className="space-y-4">
          {/* Top Status & Rain Alert Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              weather.isRaining
                ? "bg-gradient-to-br from-blue-950/80 via-blue-900/40 to-slate-900 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                : "bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-950 border-slate-700/60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Location & Condition */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-slate-200">{weather.city}</span>
                  <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {weather.lat.toFixed(2)}°N, {weather.lon.toFixed(2)}°E
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-4xl">{weather.icon}</span>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                      {weather.temp}°C
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Feels like {weather.feelsLike}°C · {weather.condition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Big Rain / Barish Indicator */}
              <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-xl border border-slate-800 flex flex-col justify-center min-w-[200px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    Barish / Precipitation
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      weather.isRaining
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {weather.isRaining ? "🌧️ RAINING NOW" : "☀️ NO RAIN"}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {weather.precip.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">mm / hour</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                  <span>Rain Probability:</span>
                  <span className="font-bold text-blue-300 font-mono">{weather.precipProb}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Wind Speed</span>
                <p className="text-sm font-bold text-slate-200 font-mono">
                  {weather.windSpeed} kt <span className="text-[10px] text-slate-400">({(weather.windSpeed * 1.852).toFixed(0)} km/h)</span>
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Humidity</span>
                <p className="text-sm font-bold text-cyan-300 font-mono">{weather.humidity}%</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Pressure</span>
                <p className="text-sm font-bold text-purple-300 font-mono">{weather.pressure} hPa</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Cloud Cover</span>
                <p className="text-sm font-bold text-amber-300 font-mono">{weather.cloudCover}%</p>
              </div>
            </div>
          </div>

          {/* 12-Hour Hourly Rain Timeline */}
          {weather.hourly && weather.hourly.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Upcoming 12-Hour Rain &amp; Temperature Forecast:
                </span>
                <span className="text-[10px] text-slate-500">Hourly Telemetry</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {weather.hourly.map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-between p-2 rounded-xl min-w-[68px] border text-center transition-all ${
                      h.precip > 0
                        ? "bg-blue-900/30 border-blue-500/40 text-blue-200"
                        : "bg-slate-900/80 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono">{h.time}</span>
                    <span className="text-base my-1">
                      {h.precip > 1.5 ? "🌧️" : h.precip > 0 ? "🌦️" : "⛅"}
                    </span>
                    <span className="text-xs font-bold font-mono">{h.temp}°C</span>
                    <span
                      className={`text-[9px] font-mono mt-1 px-1.5 py-0.5 rounded ${
                        h.precip > 0
                          ? "bg-blue-500/20 text-blue-300 font-bold"
                          : "text-slate-500"
                      }`}
                    >
                      {h.precip > 0 ? `${h.precip}mm` : "0 mm"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
