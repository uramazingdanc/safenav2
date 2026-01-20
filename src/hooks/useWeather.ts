import { useQuery } from '@tanstack/react-query';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isDay: boolean;
}

interface WeatherForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationProbability: number;
}

interface WeatherResponse {
  current: WeatherData;
  forecast: WeatherForecast[];
}

// Naval, Biliran coordinates
const BILIRAN_LAT = 11.5669;
const BILIRAN_LNG = 124.3989;

const weatherCodeDescriptions: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  56: { description: 'Light freezing drizzle', icon: '🌧️' },
  57: { description: 'Dense freezing drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  66: { description: 'Light freezing rain', icon: '🌨️' },
  67: { description: 'Heavy freezing rain', icon: '🌨️' },
  71: { description: 'Slight snow fall', icon: '❄️' },
  73: { description: 'Moderate snow fall', icon: '❄️' },
  75: { description: 'Heavy snow fall', icon: '❄️' },
  77: { description: 'Snow grains', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '🌨️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

export const getWeatherInfo = (code: number) => {
  return weatherCodeDescriptions[code] || { description: 'Unknown', icon: '❓' };
};

const fetchWeather = async (): Promise<WeatherResponse> => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${BILIRAN_LAT}&longitude=${BILIRAN_LNG}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FManila&forecast_days=5`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();

  const current: WeatherData = {
    temperature: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    precipitation: data.current.precipitation,
    isDay: data.current.is_day === 1,
  };

  const forecast: WeatherForecast[] = data.daily.time.map((date: string, index: number) => ({
    date,
    tempMax: data.daily.temperature_2m_max[index],
    tempMin: data.daily.temperature_2m_min[index],
    weatherCode: data.daily.weather_code[index],
    precipitationProbability: data.daily.precipitation_probability_max[index],
  }));

  return { current, forecast };
};

export const useWeather = () => {
  return useQuery({
    queryKey: ['weather', 'biliran'],
    queryFn: fetchWeather,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });
};
