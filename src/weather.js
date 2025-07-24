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
  const [selectedDay, setSelectedDay] = useState(0); // 0: Today, 1: Day 2, 2: Day 3
  const apiKey = 'f5ac4be4a19c47d8a3e42522222112';
  const days = 3; // Lấy dữ liệu cho 3 ngày

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

    const debounce = setTimeout(fetchSuggestions, 1000);
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
        setSelectedDay(0); // Reset về ngày hiện tại khi thay đổi thành phố
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
    setSelectedDay(0); // Reset về ngày hiện tại khi chọn gợi ý
  };

  // Lấy dữ liệu cho các mốc giờ cố định: 6 AM, 12 PM, 6 PM, 12 AM
  const getHourlyData = (type) => {
    if (!weatherData || !weatherData.forecast || !weatherData.forecast.forecastday[selectedDay]) return [];
    
    const hours = weatherData.forecast.forecastday[selectedDay].hour;
    const targetHours = [6, 12, 18, 0]; // 6 AM, 12 PM, 6 PM, 12 AM
    const data = targetHours.map(targetHour => {
      const hourData = hours.find(hour => new Date(hour.time).getHours() === targetHour);
      if (!hourData) return null;
      return type === 'Temperature' ? hourData.temp_c :
             type === 'UV Index' ? hourData.uv :
             hourData.humidity;
    });
    return data.filter(val => val !== null);
  };

  const chartData = weatherData && {
    type: 'line',
    data: {
      labels: ['6 AM', '12 PM', '6 PM', '12 AM'],
      datasets: [
        {
          label: selectedChart,
          data: getHourlyData(selectedChart),
          borderColor: selectedChart === 'Temperature'
            ? '#FF5733'
            : selectedChart === 'UV Index'
            ? '#B19CD9'
            : '#00A6B5',
          backgroundColor: selectedChart === 'Temperature'
            ? 'rgba(255, 87, 51, 0.1)'
            : selectedChart === 'UV Index'
            ? 'rgba(177, 156, 217, 0.1)'
            : 'rgba(0, 166, 181, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 6,
          pointBackgroundColor: selectedChart === 'Temperature'
            ? '#FF5733'
            : selectedChart === 'UV Index'
            ? '#B19CD9'
            : '#00A6B5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHitRadius: 10,
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
          enabled: true
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          display: true,
          grid: {
            display: true
          },
          beginAtZero: true
        }
      },
      elements: {
        point: {
          hoverRadius: 8
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      }
    }
  };

  const currentWeather = weatherData && weatherData.current;
  const forecast = weatherData && weatherData.forecast.forecastday;

  const getCurrentValue = () => {
    if (!weatherData || !weatherData.forecast || !weatherData.forecast.forecastday[selectedDay]) return '';
    
    const currentHour = weatherData.forecast.forecastday[selectedDay].hour.find(
      hour => new Date(hour.time).getHours() === new Date(weatherData.location.localtime).getHours()
    );
    
    if (!currentHour) return '';
    
    if (selectedChart === 'Temperature') {
      return `${Math.round(currentHour.temp_c)}°C`;
    } else if (selectedChart === 'UV Index') {
      return `${currentHour.uv}`;
    } else {
      return `${currentHour.humidity}%`;
    }
  };

  const getForecastValue = (day) => {
    if (selectedChart === 'Temperature') {
      return `${Math.round(day.day.avgtemp_c)}°C`;
    } else if (selectedChart === 'UV Index') {
      return `${day.day.uv}`;
    } else {
      return `${day.day.avghumidity}%`;
    }
  };

  const getForecastLabel = () => {
    if (selectedChart === 'Temperature') {
      return 'Nhiệt độ';
    } else if (selectedChart === 'UV Index') {
      return 'Chỉ số UV';
    } else {
      return 'Độ ẩm';
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
      return 'Đang tải...';
    }
    const localTime = new Date(weatherData.location.localtime);
    const time = localTime.toLocaleTimeString('vi-VN', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const weekday = localTime.toLocaleDateString('vi-VN', { weekday: 'short' });
    const month = localTime.toLocaleDateString('vi-VN', { month: 'short' });
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
                  {Math.round(weatherData.forecast.forecastday[0].day.avgtemp_c)}°C
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
            
            <div className="chart-selector-buttons">
              <button 
                className={`chart-button ${selectedChart === 'Temperature' ? 'active' : ''}`}
                onClick={() => setSelectedChart('Temperature')}
              >
                Nhiệt độ
              </button>
              <button 
                className={`chart-button ${selectedChart === 'UV Index' ? 'active' : ''}`}
                onClick={() => setSelectedChart('UV Index')}
              >
                Chỉ số UV
              </button>
              <button 
                className={`chart-button ${selectedChart === 'Humidity' ? 'active' : ''}`}
                onClick={() => setSelectedChart('Humidity')}
              >
                Độ ẩm
              </button>
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
            {forecast && forecast.slice(0, 3).map((day, index) => (
              <div 
                key={index} 
                className={`forecast-card ${index === selectedDay ? 'today' : 'other'}`}
                onClick={() => setSelectedDay(index)}
              >
                <div className={`forecast-date ${index === selectedDay ? 'today' : 'other'}`}>
                  {index === 0 ? 'Hôm nay' : formatDate(day.date)}
                </div>
                
                <div className="forecast-icon">
                  {getWeatherIcon(day.day.condition.text)}
                </div>
                
                <div className={`forecast-value-label ${index === selectedDay ? 'today' : 'other'}`}>
                  {getForecastLabel()}
                </div>
                <div className="forecast-value">
                  {getForecastValue(day)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
