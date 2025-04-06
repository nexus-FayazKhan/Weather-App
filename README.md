
---
# 🌦️ Weather App

A sleek and responsive weather application built using **React** + **Vite**. It fetches real-time weather data using the **OpenWeatherMap API**.

---

## 🚀 Features

- 🔍 Search weather by city name  
- 🌡️ Display temperature, weather condition, and location info  
- 📱 Dynamic background 

---

## 🛠️ Tech Stack

- ⚛️ React   
- ☁️ OpenWeatherMap API (or other weather APIs)

---

## 📁 Project Structure

```
my-weather-app/
├── public/               # Static assets
├── src/                      
│   └── App.jsx           # Main React component
├── .env                  # Environment variables
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── README.md             # Project documentation
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nexus-FayazKhan/Weather-App.git
cd weather-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Environment Variables

Create a `.env` file in the root directory and add your API keys:

```env
VITE_WEATHER_KEY=your_openweather_api_key
VITE_UNSPLASH_KEY=your_unsplash_api_key
```

### 4. Start the Development Server

```bash
npm run dev
```





---

## 🔑 Using the API Key in Code

To access your weather API key in the app:

```js
const apiKey = import.meta.env.VITE_WEATHER_KEY;
```

---

