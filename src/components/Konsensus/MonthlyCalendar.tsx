import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Meeting, IST_TZ } from './types';
import {
    MONTH_NAMES,
    getDaysInMonth,
    getFirstDayOfMonth,
    dateKeyInTz
} from './utils';

interface MonthlyCalendarProps {
    meetings: Meeting[];
    onDayClick?: (date: string) => void;
}

export function MonthlyCalendar({ meetings, onDayClick }: MonthlyCalendarProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayKey = dateKeyInTz(today, IST_TZ);

    const meetingsByDay = useMemo(() => {
        const map: Record<string, Meeting[]> = {};
        meetings.forEach(m => {
            if (!m.date) return;
            if (!map[m.date]) map[m.date] = [];
            map[m.date].push(m);
        });
        return map;
    }, [meetings]);

    const handlePrevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    const calendarFooter = (
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-gray-600">Toplantı</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200 shadow-sm" />
                <span className="text-gray-600">Hafta Sonu</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
                <span className="text-gray-600">Bugün</span>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    Takvim
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-600"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 min-w-[120px] text-center">
                        <span className="text-sm font-black text-gray-900">
                            {MONTH_NAMES[month]} {year}
                        </span>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-600"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {['Pt', 'Sa', 'Çr', 'Pr', 'Cu', 'Ct', 'Pz'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase pb-2">
                        {day}
                    </div>
                ))}

                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayOfWeek = (firstDay + i) % 7;
                    const isWeekend = dayOfWeek >= 5;
                    const isToday = dateStr === todayKey;
                    const hasMeetings = !!meetingsByDay[dateStr];

                    return (
                        <button
                            key={day}
                            onClick={() => hasMeetings && onDayClick?.(dateStr)}
                            disabled={!hasMeetings}
                            className={`
                                relative aspect-square rounded-xl flex items-center justify-center text-xs font-black transition
                                ${hasMeetings
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10 hover:bg-blue-700 active:scale-95 cursor-pointer'
                                    : isToday
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                                        : isWeekend
                                            ? 'bg-red-50 text-red-400 border border-red-100'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }
                            `}
                        >
                            {day}
                            {hasMeetings && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-blue-600 rounded-full text-[8px] flex items-center justify-center shadow-sm border border-blue-100">
                                    {meetingsByDay[dateStr].length}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {calendarFooter}
        </div>
    );
}
