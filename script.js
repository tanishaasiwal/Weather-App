// Open-Meteo API - No API Key Required

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// ===============================
// DOM ELEMENTS
// ===============================

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const weatherInfo = document.getElementById("weather-Info");

// ===============================
// WEATHER EMOJIS
// ===============================

const weatherEmojis = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Fog: "🌫️",
  Mist: "🌫️",
  Haze: "🌫️",
};

// ===============================
// EVENT LISTENERS
// ===============================

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    handleSearch();
  }
});

// ===============================
// SEARCH CITY
// ===============================

function handleSearch() {
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  fetchWeather(city);
}

// ===============================
// FETCH WEATHER
// ===============================

async function fetchWeather(city) {
  showLoading(true);
  hideError();

  try {
    // -------------------------------
    // STEP 1: FIND CITY
    // -------------------------------

    const geoUrl = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error("Unable to find the city.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please check the spelling.");
    }

    const location = geoData.results[0];

    const latitude = location.latitude;
    const longitude = location.longitude;

    // -------------------------------
    // STEP 2: GET WEATHER
    // -------------------------------

    const weatherUrl =
      `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure` +
      `&wind_speed_unit=kmh` +
      `&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error("Unable to get weather data.");
    }

    const data = await weatherResponse.json();

    // Add city information

    data.cityName = location.name;
    data.country = location.country_code;

    // Display weather

    displayWeather(data);
  } catch (error) {
    showError(error.message);

    weatherInfo.classList.add("hidden");
  } finally {
    showLoading(false);
  }
}

// ===============================
// WEATHER CONDITION
// ===============================

function getWeatherCondition(code) {
  // Clear sky
  if (code === 0) {
    return "Clear";
  }

  // Mainly clear / partly cloudy / overcast
  if ([1, 2, 3].includes(code)) {
    return "Clouds";
  }

  // Fog
  if ([45, 48].includes(code)) {
    return "Fog";
  }

  // Drizzle
  if ([51, 53, 55, 56, 57].includes(code)) {
    return "Drizzle";
  }

  // Rain
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Rain";
  }

  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "Snow";
  }

  // Thunderstorm
  if ([95, 96, 99].includes(code)) {
    return "Thunderstorm";
  }

  return "Clear";
}

// ===============================
// DISPLAY WEATHER
// ===============================

function displayWeather(data) {
  const current = data.current;

  const condition = getWeatherCondition(current.weather_code);

  // City name

  document.getElementById("cityName").textContent =
    `${data.cityName}, ${data.country}`;

  // Weather icon

  document.getElementById("weatherIcon").textContent =
    weatherEmojis[condition] || "🌡️";

  // Temperature

  document.getElementById("temparature").textContent =
    `${Math.round(current.temperature_2m)}°C`;

  // Description

  document.getElementById("description").textContent = condition;

  // Feels like

  document.getElementById("feelsLike").textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  // Humidity

  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;

  // Wind speed

  document.getElementById("windSpeed").textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  // Pressure

  document.getElementById("pressure").textContent =
    `${Math.round(current.surface_pressure)} hPa`;

  // AI Advice

  updateAiAdvice(data);

  // Show weather section

  weatherInfo.classList.remove("hidden");
}

// ===============================
// AI WEATHER ADVICE
// ===============================

function updateAiAdvice(data) {
  const current = data.current;

  const condition = getWeatherCondition(current.weather_code);

  const temperature = Math.round(current.temperature_2m);

  const windSpeed = current.wind_speed_10m;

  let title = "A comfortable day";

  let advice =
    "The weather looks balanced. A light layer and water bottle should keep you comfortable.";

  // Rain

  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) {
    title = "Keep an umbrella close";

    advice =
      "Wet weather is expected. Carry an umbrella, choose shoes with grip, and leave extra travel time.";
  }

  // Fog / Snow
  else if (["Snow", "Fog"].includes(condition)) {
    title = "Take it slow outside";

    advice =
      "Visibility or road conditions may be affected. Dress warmly and be extra careful while travelling.";
  }

  // Hot weather
  else if (temperature >= 32) {
    title = "Plan around the heat";

    advice =
      "It is hot today. Prefer shade, drink water regularly, and schedule outdoor plans for cooler hours.";
  }

  // Cold weather
  else if (temperature <= 10) {
    title = "Layer up today";

    advice =
      "The air is chilly. A warm outer layer will make your day more comfortable.";
  }

  // Strong wind
  else if (windSpeed >= 30) {
    title = "A breezy forecast";

    advice =
      "Strong wind is likely. Secure loose items and choose a wind-resistant layer for outdoor plans.";
  }

  // Clear weather
  else if (condition === "Clear") {
    title = "Great time to get outside";

    advice =
      "Clear skies are on your side. Sunglasses, sunscreen, and a short outdoor break would be a good call.";
  }

  // Update AI section

  document.getElementById("aiTitle").textContent = title;

  document.getElementById("aiAdvice").textContent = advice;
}

// ===============================
// LOADING
// ===============================

function showLoading(show) {
  loading.classList.toggle("hidden", !show);
}

// ===============================
// ERROR
// ===============================

function showError(message) {
  errorDiv.textContent = message;

  errorDiv.classList.remove("hidden");
}

// ===============================
// HIDE ERROR
// ===============================

function hideError() {
  errorDiv.classList.add("hidden");
}
