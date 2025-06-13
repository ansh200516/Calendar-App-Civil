import { useEffect } from "react";
import { useNotifications } from "@/store/notifications";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTimeAgo } from "@/lib/date-utils";
import { Bell, Check } from "lucide-react";

export default function StudentNotifications() {
  const { notifications, fetchNotifications, markAllAsRead, unreadCount } = useNotifications();
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-heading font-bold text-gray-800">Notifications</h2>
          <p className="text-sm text-gray-600">Your notifications</p>
        </div>

        <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          <Check className="h-5 w-5 mr-2 text-gray-400" />
          Mark All Read
        </Button>
      </div>

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
            notifications.map((notification) => (
              <div key={notification.id} className={`p-4 ${!notification.sent ? 'bg-primary-50' : ''}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Bell className={`h-5 w-5 ${!notification.sent ? 'text-primary-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        Notification
                      </p>
                      <p className="text-sm text-gray-500">
                        {getTimeAgo(notification.notifyAt)}
                      </p>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>{notification.message || 'You have a new notification.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No notifications to display.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}