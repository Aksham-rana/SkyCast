// script.js (debug-friendly, simple)
const apiKey = "e24956f794eccdaef8913b7e3f548a50";

const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const cityInput = document.getElementById("cityInput");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");
const weatherContent = document.getElementById("weatherContent");
const initial = document.getElementById("initial");

const temp = document.getElementById("temp");
const cityName = document.getElementById("cityName");
const desc = document.getElementById("desc");
const wIcon = document.getElementById("wIcon");
const feels = document.getElementById("feels");
const hum = document.getElementById("hum");
const wind = document.getElementById("wind");
const press = document.getElementById("press");
const updatedAt = document.getElementById("updatedAt");
const timezone = document.getElementById("timezone");
const forecast = document.getElementById("forecast");

function showLoading(show) {
  loading.style.display = show ? "block" : "none";
}
function showError(msg) {
  errorBox.style.display = "block";
  errorBox.textContent = msg;
  console.error("Weather App error:", msg);
}
function clearError() {
  errorBox.style.display = "none";
}

function displayWeather(data) {
  initial.style.display = "none";
  weatherContent.style.display = "block";

  temp.textContent = Math.round(data.main.temp) + "°C";
  cityName.textContent = data.name + ", " + data.sys.country;
  desc.textContent = data.weather[0].description;
  wIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  feels.textContent = Math.round(data.main.feels_like) + "°C";
  hum.textContent = data.main.humidity + "%";
  wind.textContent = data.wind.speed + " m/s";
  press.textContent = data.main.pressure + " hPa";

  updatedAt.textContent = "Last updated: " + new Date().toLocaleTimeString();
  timezone.textContent = "Timezone: GMT" + (data.timezone / 3600);
}

function displayForecast(list) {
  forecast.innerHTML = "";
  list.slice(0, 6).forEach(item => {
    let div = document.createElement("div");
    div.className = "forecast-item";
    let time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div>${time}</div>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="icon" />
      <div>${Math.round(item.main.temp)}°C</div>
    `;
    forecast.appendChild(div);
  });
}

async function getWeather(city) {
  try {
    showLoading(true);
    clearError();

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    // If not OK, read API message (OpenWeatherMap returns JSON with 'message')
    if (!res.ok) {
      const text = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const json = JSON.parse(text);
        msg = json.message || msg;
      } catch (e) {
        // keep msg as HTTP status if not JSON
      }
      throw new Error(msg);
    }
    const data = await res.json();
    displayWeather(data);

    // forecast
    const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
    if (fRes.ok) {
      const fData = await fRes.json();
      displayForecast(fData.list);
    }
  } catch (err) {
    showError(err.message || "Something went wrong");
  } finally {
    showLoading(false);
  }
}

function getWeatherByLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      showLoading(true);
      clearError();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(text).message || msg; } catch(e){}
        throw new Error(msg);
      }
      const data = await res.json();
      displayWeather(data);

      const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
      if (fRes.ok) {
        const fData = await fRes.json();
        displayForecast(fData.list);
      }
    } catch (err) {
      showError(err.message || "Something went wrong");
    } finally {
      showLoading(false);
    }
  }, () => showError("Unable to get location"));
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});
locBtn.addEventListener("click", getWeatherByLocation);
cityInput.addEventListener("keypress", e => { if (e.key === "Enter") searchBtn.click(); });
