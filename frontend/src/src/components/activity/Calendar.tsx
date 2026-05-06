import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  /** Dates ISO des activités (ex: "2026-03-15T10:00:00") */
  activityDates?: string[];
}

/**
 * Composant Calendrier
 * Affiche un calendrier mensuel avec points indicateurs pour les jours avec activités
 */
export const Calendar: React.FC<CalendarProps> = ({ onDateSelect, selectedDate, activityDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Jours du mois affiché qui ont au moins une activité
  const daysWithActivity = new Set(
    activityDates
      .map(iso => new Date(iso))
      .filter(d => d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth())
      .map(d => d.getDate())
  );

  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentMonth.getMonth() &&
    today.getFullYear() === currentMonth.getFullYear();

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 md:h-12"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const hasActivity = daysWithActivity.has(day);
      const selected = isSelectedDay(day);
      const todayDay = isToday(day);
      
      days.push(
        <div
          key={day}
          className={`h-10 md:h-12 flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer relative
            ${ selected
                ? 'bg-[#f59f24] text-white font-bold'
                : hasActivity
                  ? 'hover:bg-orange-50 text-gray-700'
                  : 'hover:bg-gray-50 text-gray-500'
            }
            ${ todayDay && !selected ? 'ring-2 ring-[#172d45]' : '' }
          `}
          onClick={() => onDateSelect?.(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
        >
          <span className="text-sm">{day}</span>
          {hasActivity && (
            <span className={`block w-1.5 h-1.5 rounded-full mt-0.5 ${selected ? 'bg-white' : 'bg-[#f59f24]'}`}></span>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-lg md:text-xl font-semibold text-[#172d45]">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
};