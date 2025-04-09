import { useEffect, useState } from "react";
import { useEvents } from "@/store/events";
import { useToast } from "@/hooks/use-toast";
import CalendarView from "@/components/CalendarView";
import UpcomingEvents from "@/components/UpcomingEvents";
import EventDetailsModal from "@/components/EventDetailsModal";
import { getCurrentMonthName } from "@/lib/date-utils";

export default function Calendar() {
  const { 
    events, 
    fetchEvents, 
    selectedEvent, 
    setSelectedEvent, 
    currentView,
    setCurrentView, 
    currentDate,
    setCurrentDate 
  } = useEvents();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthName());
  const { toast } = useToast();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        await fetchEvents();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
      }
    };
    
    loadEvents();
  }, [fetchEvents, toast]);

  // Update month display when current date changes
  useEffect(() => {
    setCurrentMonth(currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }, [currentDate]);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (view: 'month' | 'week' | 'day') => {
    setCurrentView(view);
  };

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-heading font-bold text-gray-800">Calendar</h2>
          <p className="text-sm text-gray-600">View and manage academic events</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={handlePreviousMonth}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-medium font-medium px-2">{currentMonth}</span>
          <button 
            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={handleNextMonth}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentView === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => handleViewChange('month')}
          >
            Month
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentView === 'week'
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => handleViewChange('week')}
          >
            Week
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentView === 'day'
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => handleViewChange('day')}
          >
            Day
          </button>
          <button 
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
            onClick={handleToday}
          >
            Today
          </button>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search events..." 
            className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 focus:ring-primary-500 focus:border-primary-500"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      {/* Calendar View */}
      <CalendarView 
        events={events} 
        currentDate={currentDate}
        currentView={currentView}
      />
      
      {/* Upcoming Events */}
      <UpcomingEvents />
      
      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}
