import { useMemo } from "react";
import { Event } from "@shared/schema";
import { useEvents } from "@/store/events";
import { formatDate, formatTime, generateCalendarDays } from "@/lib/date-utils";

interface CalendarViewProps {
  events: Event[];
  currentDate: Date;
  currentView: 'month' | 'week' | 'day';
}

export default function CalendarView({ events, currentDate, currentView }: CalendarViewProps) {
  const { setSelectedEvent } = useEvents();

  const { year, month, calendarDays } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const calendarDays = generateCalendarDays(year, month);
    
    return { year, month, calendarDays };
  }, [currentDate]);

  // Group events by date for easier lookup
  const eventsByDate = useMemo(() => {
    const eventMap = new Map<string, Event[]>();
    
    events.forEach(event => {
      const dateKey = event.date;
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, []);
      }
      eventMap.get(dateKey)!.push(event);
    });
    
    return eventMap;
  }, [events]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  // Get CSS class based on event category
  const getEventClassName = (category: string) => {
    switch (category) {
      case 'deadline':
        return 'event-deadline';
      case 'quiz':
        return 'event-quiz';
      case 'other':
        return 'event-other';
      default:
        return 'event-other';
    }
  };

  // Check if the day is today
  const isToday = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  // Render month view
  if (currentView === 'month') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-center text-gray-500 bg-gray-50 border-b border-gray-200 py-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-gray-200 divide-x divide-gray-200">
          {calendarDays.map((day, i) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
            const dayEvents = eventsByDate.get(dateStr) || [];
            const todayClass = isToday(day.day, day.currentMonth) ? 'bg-primary-50 ring-1 ring-inset ring-primary-600' : '';
            
            return (
              <div 
                key={i}
                className={`border-r border-b border-gray-200 p-1 min-h-[100px] ${
                  !day.currentMonth ? 'bg-gray-100' : todayClass
                }`}
              >
                <div className={`text-sm p-1 ${
                  day.currentMonth 
                    ? isToday(day.day, day.currentMonth)
                      ? 'text-primary-700 font-semibold'
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.day}
                </div>
                
                {day.currentMonth && dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`px-1 py-0.5 mb-1 text-xs rounded ${getEventClassName(event.category)}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <p className="truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 truncate">{formatTime(event.time)}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render week view or day view with a placeholder for now
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden p-8 text-center">
      <p className="text-gray-500">{currentView === 'week' ? 'Week view' : 'Day view'} coming soon!</p>
      <p className="text-sm text-gray-500 mt-2">This view is currently under development.</p>
    </div>
  );
}
