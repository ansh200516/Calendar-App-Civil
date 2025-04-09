import { useState, useEffect } from "react";
import { useEvents } from "@/store/events";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/date-utils";
import EventModal from "@/components/EventModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useLocation } from "wouter";
import { Event } from "@shared/schema";

export default function Admin() {
  const { fetchEvents, events, deleteEvent } = useEvents();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  
  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEdit = (event: Event) => {
    setCurrentEvent(event);
    setEditModalOpen(true);
  };

  const handleDelete = (eventId: number) => {
    setDeleteEventId(eventId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteEventId === null) return;
    
    try {
      await deleteEvent(deleteEventId);
      toast({
        title: "Event deleted",
        description: "Event has been deleted successfully",
      });
      setDeleteModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'deadline':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Deadline</span>;
      case 'quiz':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Quiz</span>;
      case 'other':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Other</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  // If not admin, don't render anything
  if (user && !user.isAdmin) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-heading font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-sm text-gray-600">Manage events and notifications</p>
        </div>
        
        <Button onClick={() => setCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Event
        </Button>
      </div>
      
      {/* Event Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Event Management</CardTitle>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length > 0 ? (
                events.map(event => {
                  const eventDate = new Date(event.date);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const isActive = eventDate >= now;
                  
                  return (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(event.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(event.time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Active' : 'Past'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(event)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No events found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <CardContent className="border-t border-gray-200 bg-gray-50 text-sm text-gray-500 py-4">
          Showing {events.length} events
        </CardContent>
      </Card>
      
      {/* Notification Management */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Management</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="event-select">Event</Label>
              <Select>
                <SelectTrigger id="event-select">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title} ({formatDate(event.date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notification-time">Send Notification</Label>
              <Select defaultValue="0">
                <SelectTrigger id="notification-time">
                  <SelectValue placeholder="Select notification time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">At the time of event</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="120">2 hours before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                  <SelectItem value="2880">2 days before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notification-message">Custom Message (optional)</Label>
              <Textarea 
                id="notification-message" 
                placeholder="Add a custom message for this notification..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="send-to-all" />
              <Label htmlFor="send-to-all">Send to all students</Label>
            </div>
            
            <div>
              <Button type="submit">Schedule Notification</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Modals */}
      {createModalOpen && (
        <EventModal onClose={() => setCreateModalOpen(false)} />
      )}
      
      {editModalOpen && currentEvent && (
        <EventModal 
          event={currentEvent} 
          onClose={() => {
            setEditModalOpen(false);
            setCurrentEvent(null);
          }} 
        />
      )}
      
      {deleteModalOpen && deleteEventId !== null && (
        <DeleteConfirmModal 
          eventId={deleteEventId}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeleteEventId(null);
          }}
          isOpen={deleteModalOpen}
        />
      )}
    </div>
  );
}
