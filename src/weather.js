import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './weather.css';

Chart.register(...registerables);

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState('London');
  const [inputValue, setInputValue] = useState('London');
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedChart, setSelectedChart] = useState('Temperature');
  const apiKey = 'f5ac4be4a19c47d8a3e42522222112';
  const days = 5;

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        if (city.trim() !== '') {
          const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=${days}&aqi=no&alerts=yes`
          );
          const data = await response.json();
          if (data.error) {
            console.error('API error:', data.error.message);
            setWeatherData(null);
            setErrorMessage('Không tìm thấy thành phố. Vui lòng nhập tên thành phố hợp lệ.');
          } else {
            setWeatherData(data);
            setErrorMessage('');
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
        setWeatherData(null);
        setErrorMessage('Đã xảy ra lỗi khi lấy dữ liệu thời tiết.');
      }
    };

    fetchWeatherData();
  }, [apiKey, city, days]);

  // Fetch city suggestions with 1-second debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim() === '') {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${inputValue}`
        );
        const data = await response.json();
        setSuggestions(data.slice(0, 5)); // Giới hạn 5 gợi ý
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý:', error);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 1000); // Đặt debounce thành 1 giây
    return () => clearTimeout(debounce);
  }, [apiKey, inputValue]);

  const handleCityChange = (e) => {
    setInputValue(e.target.value);
    setErrorMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (inputValue.trim() !== '') {
        setCity(inputValue.trim());
        setSuggestions([]);
      } else {
        setErrorMessage('Vui lòng nhập tên thành phố.');
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const selectedCity = suggestion.name;
    setInputValue(selectedCity);
    setCity(selectedCity);
    setSuggestions([]);
    setErrorMessage('');
  };

  const chartData = weatherData && {
    type: 'line',
    data: {
      labels: weatherData.forecast.forecastday.map((day, index) => `Ngày ${index + 1}`),
      datasets: [
        {
          label: selectedChart,
          data: selectedChart === 'Temperature'
            ? weatherData.forecast.forecastday.map(day => day.day.avgtemp_c)
            : selectedChart === 'UV Index'
            ? weatherData.forecast.forecastday.map(day => day.day.uv)
            : weatherData.forecast.forecastday.map(day => day.day.avghumidity),
          borderColor: '#4A90E2',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#4A90E2',
          pointBorderColor: '#4A90E2',
          pointBorderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false
          }
        },
        y: {
          display: false,
          grid: {
            display: false
          },
          beginAtZero: false
        }
      },
      elements: {
        point: {
          hoverRadius: 0
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  };

  const currentWeather = weatherData && weatherData.current;
  const forecast = weatherData && weatherData.forecast.forecastday;

  const getCurrentValue = () => {
    if (!weatherData) return '';
    
    const currentDay = weatherData.forecast.forecastday[0];
    if (selectedChart === 'Temperature') {
      return `${Math.round(currentDay.day.avgtemp_c)}°C`;
    } else if (selectedChart === 'UV Index') {
      return `${currentDay.day.uv}`;
    } else {
      return `${currentDay.day.avghumidity}%`;
    }
  };

  const getWeatherIcon = (conditionText) => {
    if (conditionText.toLowerCase().includes('cloud')) return '☁️';
    if (conditionText.toLowerCase().includes('sun') || conditionText.toLowerCase().includes('clear')) return '☀️';
    if (conditionText.toLowerCase().includes('rain')) return '🌧️';
    if (conditionText.toLowerCase().includes('snow')) return '❄️';
    return '☁️';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = () => {
  if (!weatherData || !weatherData.location || !weatherData.location.localtime) {
    return 'Loading...';
  }
  const localTime = new Date(weatherData.location.localtime);
  const time = localTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  const weekday = localTime.toLocaleDateString('en-US', { weekday: 'short' });
  const month = localTime.toLocaleDateString('en-US', { month: 'short' });
  const day = localTime.getDate();
  const year = localTime.getFullYear();
  return `${time}, ${weekday}, ${month} ${day}, ${year}`;
};

  return (
    <div className="weather-container">
      <div className="city-input-section">
        <label className="city-label">
          Thành phố của bạn
        </label>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={handleCityChange}
            onKeyDown={handleKeyDown}
            className="city-input"
            placeholder="Nhập tên thành phố"
          />
          {suggestions.length > 0 && (
            <div className="suggestions-overlay">
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.name}, {suggestion.region}, {suggestion.country}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="weather-left">
          <div className="current-time">
            {currentWeather ? formatDateTime(currentWeather.last_updated) : 'Đang tải...'}
          </div>

          {currentWeather && (
            <div className="current-weather">
              <div className="weather-display">
                <div className="weather-icon">
                  {getWeatherIcon(currentWeather.condition.text)}
                </div>
                <div className="current-temp">
                  {Math.round(currentWeather.temp_c)}°C
                </div>
              </div>
              
              <div className="weather-condition">
                {currentWeather.condition.text}
              </div>
            </div>
          )}

          <div className="weather-details">
            <div className="detail-item">
              <div className="detail-label">
                Độ ẩm
              </div>
              <div className="detail-value">
                {currentWeather && `${currentWeather.humidity}%`}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                Tốc độ gió
              </div>
              <div className="detail-value">
                {currentWeather && `${Math.round(currentWeather.wind_kph)} km/h`}
              </div>
            </div>
          </div>
        </div>

        <div className="weather-right">
          <div className="chart-section">
            <div className="chart-title">
              {selectedChart === 'Temperature' ? 'Nhiệt độ' : selectedChart === 'UV Index' ? 'Chỉ số UV' : 'Độ ẩm'}
            </div>
            
            <div className="chart-container">
              <div className="chart-value">
                {getCurrentValue()}
              </div>
              
              <div className="chart-canvas">
                {chartData && <Line data={chartData.data} options={chartData.options} />}
              </div>
            </div>
          </div>

          <div className="forecast-container">
            {forecast && forecast.slice(0, 4).map((day, index) => (
              <div key={index} className={`forecast-card ${index === 0 ? 'today' : 'other'}`}>
                <div className={`forecast-date ${index === 0 ? 'today' : 'other'}`}>
                  {index === 0 ? 'Hôm nay' : formatDate(day.date)}
                </div>
                
                <div className="forecast-icon">
                  {getWeatherIcon(day.day.condition.text)}
                </div>
                
                <div className={`forecast-humidity-label ${index === 0 ? 'today' : 'other'}`}>
                  Độ ẩm
                </div>
                <div className="forecast-humidity-value">
                  {day.day.avghumidity}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;



