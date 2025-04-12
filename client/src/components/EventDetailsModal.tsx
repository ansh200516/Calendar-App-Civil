import { useState } from "react";
import { Event } from "@shared/schema";
import { formatDate, formatTime } from "@/lib/date-utils";
import { useEvents } from "@/store/events";
import { useAuth } from "@/store/auth";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventModal from "@/components/EventModal";
import ResourceManager from "@/components/ResourceManager";
import { MapPin, Calendar, Clock, FileText } from "lucide-react";

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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full ${getCategoryColor(event.category)} mr-2`}></div>
              <DialogTitle className="text-xl font-heading font-bold text-gray-800">{event.title}</DialogTitle>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(event.date)}</span>
              <span className="mx-1">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatTime(event.time)}</span>
              {event.location && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{event.location}</span>
                </>
              )}
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Description</h3>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Category</h3>
                <div>{getCategoryBadge(event.category)}</div>
              </div>
            </TabsContent>
            
            <TabsContent value="resources">
              <ResourceManager eventId={event.id} />
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sm:justify-end pt-4 border-t">
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
