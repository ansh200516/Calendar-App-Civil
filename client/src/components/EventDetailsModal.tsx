import { useState } from "react";
import { Event } from "@shared/schema";
import { formatDate, formatTime } from "@/lib/date-utils";
import { useEvents } from "@/store/events";
import { useAuth } from "@/store/auth";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EventModal from "@/components/EventModal";
import { MapPin, Calendar, Clock } from "lucide-react";

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
}

export default function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { user } = useAuth();
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'deadline':
        return 'bg-red-500';
      case 'quiz':
        return 'bg-amber-500';
      case 'other':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'deadline':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Deadline</span>;
      case 'quiz':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Quiz</span>;
      case 'other':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Other</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Event</span>;
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${getCategoryColor(event.category)} mr-2`}></div>
              <h2 className="text-xl font-heading font-bold text-gray-800">{event.title}</h2>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{formatDate(event.date)}</span>
              <span className="mx-2">•</span>
              <Clock className="h-5 w-5 mr-2" />
              <span>{formatTime(event.time)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center text-gray-500">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{event.location}</span>
              </div>
            )}
            
            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <p className="mt-1 text-sm text-gray-600">{event.description}</p>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-900">Category</h3>
              <div className="mt-1">
                {getCategoryBadge(event.category)}
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            
            {user?.isAdmin && (
              <Button
                onClick={() => setEditModalOpen(true)}
              >
                Edit Event
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editModalOpen && (
        <EventModal 
          event={event} 
          onClose={() => setEditModalOpen(false)}
          onSaved={() => {
            setEditModalOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
