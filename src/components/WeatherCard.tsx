import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeather, getWeatherInfo } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';

const WeatherCard = () => {
  const { data, isLoading, error } = useWeather();

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to load weather data</p>
        </CardContent>
      </Card>
    );
  }

  const { current, forecast } = data;
  const currentWeather = getWeatherInfo(current.weatherCode);

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          Naval, Biliran Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentWeather.icon}</span>
            <div>
              <p className="text-2xl font-bold">{Math.round(current.temperature)}°C</p>
              <p className="text-xs text-muted-foreground">{currentWeather.description}</p>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-500" />
            <span>{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-gray-500" />
            <span>{current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-500" />
            <span>{current.precipitation} mm</span>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="pt-2 border-t">
          <p className="text-xs font-medium mb-2">5-Day Forecast</p>
          <div className="flex justify-between">
            {forecast.slice(0, 5).map((day, index) => {
              const dayWeather = getWeatherInfo(day.weatherCode);
              const date = new Date(day.date);
              const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <div key={day.date} className="flex flex-col items-center text-xs">
                  <span className="text-muted-foreground">{dayName}</span>
                  <span className="text-lg my-1">{dayWeather.icon}</span>
                  <span className="font-medium">{Math.round(day.tempMax)}°</span>
                  <span className="text-muted-foreground">{Math.round(day.tempMin)}°</span>
                  {day.precipitationProbability > 30 && (
                    <span className="text-blue-500 text-[10px]">
                      {day.precipitationProbability}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weather Warning for high precipitation */}
        {current.precipitation > 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
            <span className="font-medium text-yellow-800">⚠️ Heavy rainfall detected</span>
            <p className="text-yellow-700">Be cautious of potential flooding in low-lying areas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherCard;
