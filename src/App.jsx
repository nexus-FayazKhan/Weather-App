import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const WeatherApp = () => {
  const mapRef = useRef(null);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [weather, setWeather] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [favoriteLocations, setFavoriteLocations] = useState(JSON.parse(localStorage.getItem("weatherFavorites")) || []);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unitType, setUnitType] = useState(localStorage.getItem("weatherUnits") || "metric");
  const [errorMessage, setErrorMessage] = useState(null);

  const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY;
  
  const WEATHER_KEY = import.meta.env.VITE_WEATHER_KEY;

  useEffect(() => {
    localStorage.setItem("weatherFavorites", JSON.stringify(favoriteLocations));
    localStorage.setItem("weatherUnits", unitType);
    if (!weather && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => getWeather(pos.coords.latitude, pos.coords.longitude),
        () => favoriteLocations.length > 0 && getWeather(favoriteLocations[0].lat, favoriteLocations[0].lon)
      );
    }
  }, [favoriteLocations, unitType]);

  const getWeatherIcon = (description) => {
    const icons = {
      "clear sky": "☀️", "few clouds": "🌤️", "scattered clouds": "⛅", "broken clouds": "☁️",
      "overcast clouds": "☁️", "light rain": "🌦️", "rain": "🌧️", "shower rain": "🌧️",
      "thunderstorm": "⛈️", "snow": "❄️", "mist": "🌫️", "fog": "🌫️"
    };
    const desc = description?.toLowerCase() || "";
    return icons[Object.keys(icons).find(key => desc.includes(key))] || "🌡️";
  };

 
  const getWeather = async (lat, lon) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=${unitType}`);
      const data = await response.json();
      if (data.cod !== 200) throw new Error(data.message);
      setWeather({ ...data, city: data.name, lat, lon });
      getBackgroundImage(data.name, data.weather[0].main);
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const getBackgroundImage = async (city, weatherType) => {
    try {
      const response = await fetch(`https://api.unsplash.com/photos/random?query=${city} ${weatherType} landscape&client_id=${UNSPLASH_KEY}`);
      const data = await response.json();
      setBackgroundImage(data.urls?.regular || "");
    } catch (error) {
      console.error("Background fetch failed:", error);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${searchInput}&appid=${WEATHER_KEY}&units=${unitType}`);
      const data = await response.json();
      if (data.cod === 200) getWeather(data.coord.lat, data.coord.lon);
      else setErrorMessage(`Error: ${data.message}`);
    } catch (error) {
      setErrorMessage("Couldn’t fetch weather data.");
    } finally {
      setIsLoading(false);
      setSearchInput("");
    }
  };

  const switchUnits = () => {
    const newUnit = unitType === "metric" ? "imperial" : "metric";
    setUnitType(newUnit);
    weather && getWeather(weather.lat, weather.lon);
  };

  const addFavorite = () => {
    if (weather && !favoriteLocations.some(fav => fav.city === weather.city)) {
      setFavoriteLocations([{
        city: weather.city,
        country: weather.country,
        temp: weather.main.temp,
        description: weather.weather[0].description,
        icon: getWeatherIcon(weather.weather[0].description),
        lat: weather.lat,
        lon: weather.lon
      }, ...favoriteLocations]);
    }
  };


  const removeFavorite = (city) => setFavoriteLocations(favoriteLocations.filter(fav => fav.city !== city));

  const openMapView = () => {
    setShowMap(true);
    setTimeout(() => {
      if (!mapRef.current) {
        mapRef.current = L.map("map-container").setView(weather ? [weather.lat, weather.lon] : [20.5937, 78.9629], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
        weather && L.marker([weather.lat, weather.lon]).addTo(mapRef.current).bindPopup(`<b>${weather.city}</b><br>${weather.weather[0].description}`).openPopup();
        mapRef.current.on("click", e => { getWeather(e.latlng.lat, e.latlng.lng); setShowMap(false); });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100" style={{ 
      backgroundImage: backgroundImage ? `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url(${backgroundImage})` : "none", 
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" 
    }}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        <header className="mb-8 p-4 rounded-2xl bg-slate-800/70 backdrop-blur-md shadow-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Atmosphere</h1>
            <div className="flex gap-3">
              <button onClick={switchUnits} className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">{unitType === "metric" ? "°C" : "°F"}</button>
              <button onClick={openMapView} className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">Map</button>
            </div>
          </div>
          <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search city..." className="flex-grow p-3 rounded-xl bg-slate-700/70 border border-slate-600 focus:border-indigo-500 focus:outline-none" />
            <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>{isLoading ? "Searching..." : "Search"}</button>
          </form>
        </header>

        <main className="flex-grow">
          {errorMessage && <div className="p-4 mb-6 rounded-xl bg-red-900/70 text-red-100">{errorMessage}</div>}
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>
          ) : weather ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2 rounded-2xl p-8 bg-slate-800/70 border border-slate-700 backdrop-blur-md shadow-xl">
                <div className="flex justify-between items-start">
                  <h2 className="text-3xl font-bold">{weather.city} <span className="text-xl text-slate-400">{weather.country}</span></h2>
                  <button onClick={addFavorite} disabled={favoriteLocations.some(f => f.city === weather.city)} className={`px-4 py-2 rounded-xl ${favoriteLocations.some(f => f.city === weather.city) ? "bg-slate-700 text-slate-400" : "bg-amber-600 hover:bg-amber-500 text-white"}`}>
                    {favoriteLocations.some(f => f.city === weather.city) ? "★ Saved" : "☆ Add"}
                  </button>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-7xl">{getWeatherIcon(weather.weather[0].description)}</span>
                    <div>
                      <span className="text-6xl font-bold">{Math.round(weather.main.temp)}°{unitType === "metric" ? "C" : "F"}</span>
                      <p className="text-xl capitalize">{weather.weather[0].description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-700/70"><p className="text-slate-400">Humidity</p><p className="text-2xl font-semibold">{weather.main.humidity}%</p></div>
                    <div className="p-4 rounded-xl bg-slate-700/70"><p className="text-slate-400">Wind</p><p className="text-2xl font-semibold">{weather.wind.speed} {unitType === "metric" ? "m/s" : "mph"}</p></div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-6 bg-slate-800/70 border border-slate-700 backdrop-blur-md shadow-xl">
                <h3 className="text-2xl font-bold mb-6">Favorites</h3>
                {favoriteLocations.map(fav => (
                  <div key={fav.city} onClick={() => getWeather(fav.lat, fav.lon)} className="p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-700/70 border border-slate-700">
                    <div className="flex items-center gap-3"><span className="text-2xl">{fav.icon}</span><p className="font-medium">{fav.city}</p></div>
                    <div className="flex items-center gap-4"><p className="font-semibold">{Math.round(fav.temp)}°{unitType === "metric" ? "C" : "F"}</p><button onClick={e => { e.stopPropagation(); removeFavorite(fav.city); }} className="text-slate-400 hover:text-red-400">✕</button></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-slate-800/70 backdrop-blur-md shadow-xl">
              <h2 className="text-3xl font-bold mb-4">Welcome to Atmosphere</h2>
              <p className="text-lg">Search a city to start.</p>
            </div>
          )}
        </main>
      </div>

      {showMap && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Pick a Location</h3>
                <button onClick={() => { setShowMap(false); mapRef.current?.remove(); mapRef.current = null; }} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">✕</button>
              </div>
              <div id="map-container" className="h-[60vh] rounded-xl border border-slate-700"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;