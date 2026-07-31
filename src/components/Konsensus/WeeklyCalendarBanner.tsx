import React, { useMemo } from 'react';
import { Meeting, IST_TZ } from './types';
import { dateKeyInTz, parseYMD } from './utils';

interface WeeklyCalendarBannerProps {
  meetings: Meeting[];
  now: Date;
  onDayClick: (dateKey: string) => void;
}

export function WeeklyCalendarBanner({ meetings, now, onDayClick }: WeeklyCalendarBannerProps) {
  const todayKey = useMemo(() => dateKeyInTz(now, IST_TZ), [now]);

  const days = useMemo(() => {
    const { y, m, d } = parseYMD(todayKey);
    // Create safe date for math at noon to avoid timezone shift
    const todayNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    
    // Find Monday of the current week (1 = Monday, 0 = Sunday)
    const dayOfWeek = todayNoon.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const mondayNoon = new Date(todayNoon.getTime() - diffToMonday * 24 * 60 * 60 * 1000);

    const weekDays: Array<{ key: string; dateObj: Date; dayName: string; dayOfMonth: number; count: number; isPast: boolean; isToday: boolean }> = [];
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    for (let i = 0; i < 7; i++) {
        const current = new Date(mondayNoon.getTime() + i * 24 * 60 * 60 * 1000);
        const key = dateKeyInTz(current, 'UTC'); // We constructed it in UTC safely
        
        // Count meetings for this date
        const count = meetings.filter(mtm => mtm.date === key).length;
        
        weekDays.push({
            key,
            dateObj: current,
            dayName: dayNames[i],
            dayOfMonth: current.getUTCDate(),
            count,
            isPast: key < todayKey,
            isToday: key === todayKey,
        });
    }

    return weekDays;
  }, [meetings, todayKey]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 border border-gray-100 flex flex-col items-center">
      <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Bu Hafta</h3>
      <div className="flex gap-2 sm:gap-4 w-full justify-between sm:justify-center overflow-x-auto pb-2 scrollbar-hide">
        {days.map((day) => {
          let bgClass = "bg-gray-50";
          let borderClass = "border border-gray-200";
          let textClass = "text-gray-900";
          let circleClass = "bg-blue-100 text-blue-800";
          
          if (day.isPast) {
            bgClass = "bg-gray-800/5";
            textClass = "text-gray-400";
            circleClass = "bg-gray-200 text-gray-500";
          } else if (day.isToday) {
            bgClass = "bg-blue-50";
            borderClass = "border-2 border-blue-500 shadow-md shadow-blue-100";
            textClass = "text-blue-900";
            circleClass = "bg-blue-500 text-white";
          }

          return (
            <button
              key={day.key}
              onClick={() => onDayClick(day.key)}
              className={`flex-none w-14 sm:w-20 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-3 transition-all hover:scale-105 ${bgClass} ${borderClass}`}
            >
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${textClass} opacity-80 mb-1`}>
                {day.dayName}
              </span>
              <span className={`text-lg sm:text-2xl font-black ${textClass}`}>
                {day.dayOfMonth}
              </span>
              
              <div className="mt-2 h-5 w-full flex justify-center">
                {day.count > 0 && (
                  <span className={`text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${circleClass}`}>
                    {day.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
