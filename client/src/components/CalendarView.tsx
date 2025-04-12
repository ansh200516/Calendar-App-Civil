import { useMemo, useState } from "react";
import { Event } from "@shared/schema";
import { useEvents } from "@/store/events";
import { formatDate, formatTime, generateCalendarDays } from "@/lib/date-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

interface CalendarViewProps {
  events: Event[];
  currentDate: Date;
  currentView: 'month' | 'week' | 'day';
}

export default function CalendarView({ events, currentDate, currentView }: CalendarViewProps) {
  const { setSelectedEvent } = useEvents();
  const [selectedDate, setSelectedDate] = useState<{date: Date, dateStr: string} | null>(null);

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
  
  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    
    const clickedDate = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate.get(dateStr) || [];
    
    if (dayEvents.length === 0) {
      // Only open the "No events" modal when clicked and there are no events
      setSelectedDate({ date: clickedDate, dateStr });
    }
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
      <>
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
                  } ${day.currentMonth ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => day.currentMonth && handleDayClick(day.day, day.currentMonth)}
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
                  
                  {day.currentMonth && (
                    <>
                      {dayEvents.length > 0 ? (
                        dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`px-1 py-0.5 mb-1 text-xs rounded cursor-pointer hover:bg-opacity-90 ${getEventClassName(event.category)}`}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the day click handler from firing
                              handleEventClick(event);
                            }}
                          >
                            <p className="truncate font-medium">{event.title}</p>
                            <p className="text-xs text-gray-600 truncate">{formatTime(event.time)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400 mt-2 italic">
                          {/* Empty placeholder - "No events" message will be shown when clicked */}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Show "No events" dialog when a day with no events is clicked */}
        {selectedDate && (
          <Dialog open={true} onOpenChange={() => setSelectedDate(null)}>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <DialogTitle>
                    {selectedDate.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="py-6 text-center">
                <p className="text-gray-500 mb-2">No events scheduled for this day.</p>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setSelectedDate(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // For day view, show events for the selected day
  if (currentView === 'day') {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayEvents = eventsByDate.get(dateStr) || [];
    
    return (
      <>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>
          
          <div className="p-4">
            {dayEvents.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className="py-3 cursor-pointer hover:bg-gray-50 rounded px-2"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-full mr-3 ${
                        event.category === 'deadline' ? 'bg-red-500' : 
                        event.category === 'quiz' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{formatTime(event.time)}</span>
                          {event.location && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-8 cursor-pointer hover:bg-gray-50 rounded"
                onClick={() => {
                  // Open the "No events" modal even for day view
                  setSelectedDate({ date: currentDate, dateStr });
                }}
              >
                <p className="text-gray-500">No events scheduled for this day.</p>
                <p className="text-sm text-gray-400 mt-1">Click to see details or switch to month view.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Show "No events" dialog when clicked */}
        {selectedDate && (
          <Dialog open={true} onOpenChange={() => setSelectedDate(null)}>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <DialogTitle>
                    {selectedDate.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="py-6 text-center">
                <p className="text-gray-500 mb-2">No events scheduled for this day.</p>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setSelectedDate(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }
  
  // For week view, show events for the entire week
  if (currentView === 'week') {
    // Calculate the first day of the week (Sunday)
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Generate 7 days of the week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(firstDayOfWeek);
      day.setDate(firstDayOfWeek.getDate() + i);
      
      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const dayEvents = eventsByDate.get(dateStr) || [];
      
      return {
        date: day,
        events: dayEvents,
        dateStr: dateStr,
        isToday: day.getDate() === new Date().getDate() && 
                 day.getMonth() === new Date().getMonth() && 
                 day.getFullYear() === new Date().getFullYear()
      };
    });
    
    return (
      <>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 text-center text-gray-500 bg-gray-50 border-b border-gray-200 py-2">
            {weekDays.map((day, i) => (
              <div key={i} className={day.isToday ? 'text-primary-600 font-semibold' : ''}>
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                <div className="text-xs mt-1">
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className={`min-h-[200px] p-2 ${day.isToday ? 'bg-primary-50' : ''} cursor-pointer hover:bg-gray-50`}
                onClick={() => day.events.length === 0 && setSelectedDate({ date: day.date, dateStr: day.dateStr })}
              >
                {day.events.length > 0 ? (
                  day.events.map(event => (
                    <div 
                      key={event.id}
                      className={`px-2 py-1 mb-1 text-xs rounded cursor-pointer hover:bg-opacity-90 ${getEventClassName(event.category)}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent day click handler from firing
                        handleEventClick(event);
                      }}
                    >
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="text-xs text-gray-600 truncate">{formatTime(event.time)}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 mt-2 italic text-center">
                    Click to see details
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Show "No events" dialog when a day with no events is clicked */}
        {selectedDate && (
          <Dialog open={true} onOpenChange={() => setSelectedDate(null)}>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <DialogTitle>
                    {selectedDate.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="py-6 text-center">
                <p className="text-gray-500 mb-2">No events scheduled for this day.</p>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setSelectedDate(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }
  
  // Fallback in case of unsupported view
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden p-8 text-center">
      <p className="text-gray-500">Unknown view type.</p>
    </div>
  );
}


