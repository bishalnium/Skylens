# 🌤️ Sky Lens — Weather Dashboard

A modern, responsive meteorological web application powered by the free Open-Meteo REST & Geocoding APIs.

## Features
- **Global Search & Autocomplete**: Search any city worldwide with instant geocoding suggestions.
- **GPS Location Detection**: One-click local weather retrieval via the browser's Geolocation API.
- **24-Hour Forecast Curve**: Interactive Chart.js spline line chart toggleable between Temperature (°C / °F) and Precipitation Probability (%).
- **7-Day Extended Outlook**: Daily forecasts with high/low temperature ranges and condition icons.
- **Comprehensive Climate Metrics**: Wind speed and direction, relative humidity percentage, UV index scale, and atmospheric pressure.
- **Unit Toggle**: Instant switching between Metric (°C, km/h) and Imperial (°F, mph).

## Technologies Used
- HTML5 / CSS3 (Responsive Grid & Flexbox)
- Vanilla JavaScript (ES6+ Fetch API)
- [Chart.js](https://www.chartjs.org/) for interactive trend charts
- [Lucide Icons](https://lucide.dev/) for weather icons
- [Open-Meteo API](https://open-meteo.com/) (100% free, zero API key required)

## How to Run
Open `index.html` directly in any modern web browser or serve locally:
```bash
python -m http.server 3000
```
