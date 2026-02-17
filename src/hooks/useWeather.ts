import { useEffect, useState } from 'react';

const CACHE_KEY_WEATHER = 'metinciris_weather_data';
const CACHE_EXPIRY = 3600000; // 1 saat

/* --- HAVA DURUMU TİP VE YARDIMCI FONKSİYONLAR --- */

export type WeatherVariant =
    | 'day'
    | 'night'
    | 'rain'
    | 'storm'
    | 'snow'
    | 'fog'
    | 'cloudy';

export type WeatherState = {
    temp: number | null;
    icon: string;
    variant: WeatherVariant;
};

/** Kod + gündüz/gece bilgisinden tema seç */
function getWeatherVariant(code?: number, isDay?: boolean): WeatherVariant {
    if (code === undefined || code === null) return isDay ? 'day' : 'night';

    if (code === 45 || code === 48) return 'fog';

    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return 'rain';
    }

    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        return 'snow';
    }

    if (code >= 95) {
        return 'storm';
    }

    if (!isDay) return 'night';
    if (code === 3) return 'cloudy';

    return 'day';
}

/** Open-Meteo weather_code + is_day -> emoji */
function getWeatherIcon(code?: number, isDay?: boolean): string {
    if (code === undefined || code === null) {
        return isDay ? '🌤️' : '🌙';
    }

    if (!isDay) {
        if (code === 0 || code === 1 || code === 2) return '🌙';
        if (code === 3) return '☁️';
    }

    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';

    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 56 && code <= 57) return '🌧️';
    if (code >= 61 && code <= 65) return '🌧️';
    if (code >= 66 && code <= 67) return '🌧️';

    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';

    if (code >= 95 && code <= 99) return '⛈️';

    return isDay ? '🌤️' : '🌙';
}

/**
 * Isparta hava durumunu Open-Meteo API'sinden çeken hook.
 * localStorage ile 1 saatlik önbellekleme yapar.
 */
export function useWeather(): WeatherState {
    const [weather, setWeather] = useState<WeatherState>(() => {
        const cached = localStorage.getItem(CACHE_KEY_WEATHER);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    return data;
                }
            } catch (e) {
                console.error('Hava durumu önbellek hatası', e);
            }
        }
        return {
            temp: null,
            icon: '🌤️',
            variant: 'day' as WeatherVariant,
        };
    });

    useEffect(() => {
        const lat = 37.76; // Isparta civarı
        const lon = 30.55;

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,weather_code,is_day` +
            `&timezone=Europe%2FIstanbul`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                const current = data.current || data.current_weather;
                if (!current) return;

                const tempRaw =
                    typeof current.temperature_2m === 'number'
                        ? current.temperature_2m
                        : current.temperature;

                const codeRaw =
                    typeof current.weather_code === 'number'
                        ? current.weather_code
                        : current.weathercode;

                const isDay =
                    current.is_day === 1 ||
                    current.is_day === true ||
                    current.is_day === '1';

                const variant = getWeatherVariant(codeRaw, isDay);
                const icon = getWeatherIcon(codeRaw, isDay);

                const newState: WeatherState = {
                    temp: typeof tempRaw === 'number' ? Math.round(tempRaw) : null,
                    icon,
                    variant,
                };

                setWeather(newState);
                localStorage.setItem(
                    CACHE_KEY_WEATHER,
                    JSON.stringify({ data: newState, timestamp: Date.now() }),
                );
            })
            .catch(() => {
                // Hata olursa mevcut state kalsın
            });
    }, []);

    return weather;
}
