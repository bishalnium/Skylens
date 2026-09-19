// app.js
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    initApp();
});

/**
 * Core Application Configuration and WMO Weather Interpretation Codes
 * @constant {Object}
 */
const CONSTANTS = {
    DEFAULT_CITY: { name: "London", lat: 51.5085, lon: -0.1257, country: "United Kingdom", timezone: "Europe/London" },
    WMO_CODES: {
        0: { desc: 'Clear Sky', icon: 'sun' },
        1: { desc: 'Mainly Clear', icon: 'sun' },
        2: { desc: 'Partly Cloudy', icon: 'cloud-sun' },
        3: { desc: 'Overcast', icon: 'cloud' },
        45: { desc: 'Fog', icon: 'cloud-fog' },
        48: { desc: 'Depositing Rime Fog', icon: 'cloud-fog' },
        51: { desc: 'Light Drizzle', icon: 'cloud-drizzle' },
        53: { desc: 'Moderate Drizzle', icon: 'cloud-drizzle' },
        55: { desc: 'Dense Drizzle', icon: 'cloud-drizzle' },
        56: { desc: 'Light Freezing Drizzle', icon: 'cloud-snow' },
        57: { desc: 'Dense Freezing Drizzle', icon: 'cloud-snow' },
        61: { desc: 'Slight Rain', icon: 'cloud-rain' },
        63: { desc: 'Moderate Rain', icon: 'cloud-rain' },
        65: { desc: 'Heavy Rain', icon: 'cloud-rain' },
        66: { desc: 'Light Freezing Rain', icon: 'cloud-snow' },
        67: { desc: 'Heavy Freezing Rain', icon: 'cloud-snow' },
        71: { desc: 'Slight Snow', icon: 'snowflake' },
        73: { desc: 'Moderate Snow', icon: 'snowflake' },
        75: { desc: 'Heavy Snow', icon: 'snowflake' },
        77: { desc: 'Snow Grains', icon: 'snowflake' },
        80: { desc: 'Slight Rain Showers', icon: 'cloud-rain' },
        81: { desc: 'Moderate Rain Showers', icon: 'cloud-rain' },
        82: { desc: 'Violent Rain Showers', icon: 'cloud-lightning' },
        85: { desc: 'Slight Snow Showers', icon: 'cloud-snow' },
        86: { desc: 'Heavy Snow Showers', icon: 'cloud-snow' },
        95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
        96: { desc: 'Thunderstorm with Slight Hail', icon: 'cloud-lightning' },
        99: { desc: 'Thunderstorm with Heavy Hail', icon: 'cloud-lightning' },
    }
};

let currentCity = CONSTANTS.DEFAULT_CITY;
let isMetric = true;
let weatherData = null;
let chartInstance = null;
let currentChartMode = 'temp'; // 'temp' or 'rain'

const els = {
    citySearch: document.getElementById('citySearch'),
    searchResults: document.getElementById('searchResults'),
    geoBtn: document.getElementById('geoBtn'),
    metricBtn: document.getElementById('metricBtn'),
    imperialBtn: document.getElementById('imperialBtn'),
    mainContent: document.getElementById('mainContent'),
    
    cityName: document.getElementById('cityName'),
    currentDate: document.getElementById('currentDate'),
    currentTemp: document.getElementById('currentTemp'),
    conditionIcon: document.getElementById('conditionIcon'),
    conditionText: document.getElementById('conditionText'),
    feelsLike: document.getElementById('feelsLike'),
    tempMin: document.getElementById('tempMin'),
    tempMax: document.getElementById('tempMax'),
    
    windSpeed: document.getElementById('windSpeed'),
    windUnit: document.getElementById('windUnit'),
    windDir: document.getElementById('windDir'),
    humidity: document.getElementById('humidity'),
    uvIndex: document.getElementById('uvIndex'),
    pressure: document.getElementById('pressure'),
    
    chartTempBtn: document.getElementById('chartTempBtn'),
    chartRainBtn: document.getElementById('chartRainBtn'),
    forecastChart: document.getElementById('forecastChart'),
    forecastList: document.getElementById('forecastList')
};

let searchTimeout;

function initApp() {
    setupEventListeners();
    fetchWeather(currentCity);
}

function setupEventListeners() {
    els.citySearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 2) {
            els.searchResults.classList.add('hidden');
            return;
        }
        searchTimeout = setTimeout(() => searchCities(query), 500);
    });

    els.geoBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const city = { name: "Current Location", lat, lon, country: "", timezone: "auto" };
                    currentCity = city;
                    fetchWeather(city);
                },
                (err) => alert("Could not get location.")
            );
        } else {
            alert("Geolocation not supported.");
        }
    });

    document.addEventListener('click', (e) => {
        if (!els.citySearch.contains(e.target) && !els.searchResults.contains(e.target)) {
            els.searchResults.classList.add('hidden');
        }
    });

    els.metricBtn.addEventListener('click', () => setUnit(true));
    els.imperialBtn.addEventListener('click', () => setUnit(false));

    els.chartTempBtn.addEventListener('click', () => setChartMode('temp'));
    els.chartRainBtn.addEventListener('click', () => setChartMode('rain'));
}

async function searchCities(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await res.json();
        
        els.searchResults.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(city => {
                const li = document.createElement('li');
                li.textContent = `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}`;
                li.addEventListener('click', () => {
                    els.citySearch.value = city.name;
                    els.searchResults.classList.add('hidden');
                    currentCity = {
                        name: city.name,
                        lat: city.latitude,
                        lon: city.longitude,
                        country: city.country,
                        timezone: city.timezone || 'auto'
                    };
                    fetchWeather(currentCity);
                });
                els.searchResults.appendChild(li);
            });
            els.searchResults.classList.remove('hidden');
        } else {
            const li = document.createElement('li');
            li.textContent = "No results found";
            els.searchResults.appendChild(li);
            els.searchResults.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Search error:", err);
    }
}

async function fetchWeather(city) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=${city.timezone}`;
        
        const res = await fetch(url);
        weatherData = await res.json();
        
        updateUI();
        els.mainContent.classList.remove('hidden');
    } catch (err) {
        console.error("Weather fetch error:", err);
        alert("Failed to fetch weather data.");
    }
}

function setUnit(metric) {
    isMetric = metric;
    els.metricBtn.classList.toggle('active', isMetric);
    els.imperialBtn.classList.toggle('active', !isMetric);
    if (weatherData) updateUI();
}

function setChartMode(mode) {
    currentChartMode = mode;
    els.chartTempBtn.classList.toggle('active', mode === 'temp');
    els.chartRainBtn.classList.toggle('active', mode === 'rain');
    renderChart();
}

function formatTemp(tempC) {
    if (isMetric) return Math.round(tempC);
    return Math.round((tempC * 9/5) + 32);
}

function formatSpeed(speedKmh) {
    if (isMetric) return Math.round(speedKmh);
    return Math.round(speedKmh * 0.621371);
}

function getWindDir(degrees) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(degrees / 45) % 8];
}

function updateUI() {
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    // Header
    els.cityName.textContent = currentCity.name;
    const date = new Date(current.time);
    els.currentDate.textContent = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Main Current
    els.currentTemp.textContent = formatTemp(current.temperature_2m);
    
    const weatherInfo = CONSTANTS.WMO_CODES[current.weather_code] || { desc: 'Unknown', icon: 'sun' };
    els.conditionText.textContent = weatherInfo.desc;
    els.conditionIcon.setAttribute('data-lucide', weatherInfo.icon);
    
    // Min Max Feels
    els.feelsLike.textContent = formatTemp(current.apparent_temperature) + 'Â°';
    els.tempMin.textContent = formatTemp(daily.temperature_2m_min[0]) + 'Â°';
    els.tempMax.textContent = formatTemp(daily.temperature_2m_max[0]) + 'Â°';
    
    // Metrics
    els.windSpeed.textContent = formatSpeed(current.wind_speed_10m);
    els.windUnit.textContent = isMetric ? 'km/h' : 'mph';
    els.windDir.textContent = `Direction: ${getWindDir(current.wind_direction_10m)} (${current.wind_direction_10m}Â°)`;
    
    els.humidity.textContent = current.relative_humidity_2m;
    els.uvIndex.textContent = daily.uv_index_max[0];
    els.pressure.textContent = current.surface_pressure;
    
    renderChart();
    renderDailyForecast();
    lucide.createIcons();
}

function renderChart() {
    if (!weatherData) return;
    
    const hourly = weatherData.hourly;
    // Get next 24 hours starting from current hour approx
    const currentHourIndex = hourly.time.findIndex(t => new Date(t) >= new Date());
    const startIndex = currentHourIndex > -1 ? currentHourIndex : 0;
    
    const times = hourly.time.slice(startIndex, startIndex + 24).map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const ctx = els.forecastChart.getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const isTemp = currentChartMode === 'temp';
    const dataArray = isTemp 
        ? hourly.temperature_2m.slice(startIndex, startIndex + 24).map(t => formatTemp(t))
        : hourly.precipitation_probability.slice(startIndex, startIndex + 24);
        
    const label = isTemp ? `Temperature (${isMetric ? 'Â°C' : 'Â°F'})` : 'Precipitation Probability (%)';
    const color = isTemp ? '#f59e0b' : '#3b82f6';
    const bgColor = isTemp ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: label,
                data: dataArray,
                borderColor: color,
                backgroundColor: bgColor,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#a0a0b0', maxTicksLimit: 8 }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#a0a0b0' }
                }
            }
        }
    });
}

function renderDailyForecast() {
    const daily = weatherData.daily;
    els.forecastList.innerHTML = '';
    
    for (let i = 1; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const wmo = CONSTANTS.WMO_CODES[daily.weather_code[i]] || { desc: 'Unknown', icon: 'sun' };
        
        const min = formatTemp(daily.temperature_2m_min[i]);
        const max = formatTemp(daily.temperature_2m_max[i]);
        
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-condition">
                <i data-lucide="${wmo.icon}"></i>
                <span>${wmo.desc}</span>
            </div>
            <div class="forecast-temps">
                <span class="max">${max}Â°</span>
                <span class="min">${min}Â°</span>
            </div>
        `;
        els.forecastList.appendChild(item);
    }
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== els.citySearch) {
        e.preventDefault();
        els.citySearch?.focus();
    } else if (e.key === 'Escape' && document.activeElement === els.citySearch) {
        els.citySearch?.blur();
        els.searchResults?.classList.add('hidden');
    }
});