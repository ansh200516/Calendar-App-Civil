import { useEffect } from "react";
import { useNotifications } from "@/store/notifications";
import { useEvents } from "@/store/events";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getTimeAgo } from "@/lib/date-utils";
import { Bell, Check } from "lucide-react";

export default function Notifications() {
  const { notifications, fetchNotifications, markAllAsRead, unreadCount } = useNotifications();
  const { events, setSelectedEvent } = useEvents();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const getEventById = (eventId: number) => {
    return events.find(event => event.id === eventId);
  };

  const handleViewEvent = (eventId: number) => {
    const event = getEventById(eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-heading font-bold text-gray-800">Notifications</h2>
          <p className="text-sm text-gray-600">View and manage event notifications</p>
        </div>
        
        <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          <Check className="h-5 w-5 mr-2 text-gray-400" />
          Mark All Read
        </Button>
      </div>
      
      {/* Notification List */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Notifications</CardTitle>
          {unreadCount > 0 && (
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {unreadCount} Unread
              </span>
            </div>
          )}
        </CardHeader>
        
        <div className="divide-y divide-gray-200">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const event = getEventById(notification.eventId);
              
              return (
                <div key={notification.id} className={`p-4 ${!notification.sent ? 'bg-primary-50' : ''}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Bell className={`h-5 w-5 ${!notification.sent ? 'text-primary-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {event ? `${event.category === 'deadline' ? 'Upcoming Deadline' : event.category === 'quiz' ? 'Upcoming Quiz' : 'Upcoming Event'}: ${event.title}` : 'Event Notification'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getTimeAgo(notification.notifyAt)}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>{notification.message || (event ? `Don't forget your upcoming ${event.category} on ${new Date(event.date).toLocaleDateString()}.` : 'You have a new notification.')}</p>
                      </div>
                      <div className="mt-2 text-xs">
                        {event && (
                          <Button
                            variant="link"
                            className="p-0 text-primary-600 hover:text-primary-900 font-medium"
                            onClick={() => handleViewEvent(event.id)}
                          >
                            View Event
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500">
              No notifications to display.
            </div>
          )}
        </div>
        
        {notifications.length > 5 && (
          <CardContent className="border-t border-gray-200 bg-gray-50 flex justify-center py-4">
            <Button variant="link" className="text-sm text-primary-600 hover:text-primary-900 font-medium">
              Load More
            </Button>
          </CardContent>
        )}
      </Card>
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <div className="flex items-center">
              <Switch id="email-notifications" defaultChecked />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Browser Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications in your browser</p>
            </div>
            <div className="flex items-center">
              <Switch id="browser-notifications" defaultChecked />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Deadline Reminders</h4>
              <p className="text-sm text-gray-500">Get reminders for upcoming deadlines</p>
            </div>
            <div className="flex items-center">
              <Switch id="deadline-reminders" defaultChecked />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Quiz Notifications</h4>
              <p className="text-sm text-gray-500">Get notified about upcoming quizzes</p>
            </div>
            <div className="flex items-center">
              <Switch id="quiz-notifications" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
