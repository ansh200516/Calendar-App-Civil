import { useMemo } from "react";
import { useEvents } from "@/store/events";
import { formatDate, formatTime } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function UpcomingEvents() {
  const { events, setSelectedEvent } = useEvents();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; 
    
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date < b.date ? -1 : 1;
        }
        return a.time < b.time ? -1 : 1;
      })
      .slice(0, 3); 
  }, [events]);
      
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'deadline':
        return <span className="text-sm text-white px-2 py-1 rounded bg-red-500">Deadline</span>;
      case 'quiz':
        return <span className="text-sm text-white px-2 py-1 rounded bg-amber-500">Quiz</span>;
      case 'other':
        return <span className="text-sm text-white px-2 py-1 rounded bg-emerald-500">Other</span>;
      default:
        return <span className="text-sm text-white px-2 py-1 rounded bg-gray-500">Event</span>;
    }
  };

  const handleEventClick = (event: typeof events[0]) => {
    setSelectedEvent(event);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <Card 
              key={event.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEventClick(event)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {getCategoryBadge(event.category)}
                  <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                </div>
                <h4 className="font-medium text-gray-900 mt-2">{event.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(event.time)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
}
