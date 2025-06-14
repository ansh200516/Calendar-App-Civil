import { useEffect, useState } from "react";
import { useNotifications } from "@/store/notifications";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTimeAgo } from "@/lib/date-utils";
import { Bell, Check, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
const getSetting = (key: string, defaultValue: boolean): boolean => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? defaultValue : JSON.parse(value);
  } catch {
    return defaultValue;
  }
};
const setSetting = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving setting to localStorage:", error);
  }
};


export default function Notifications() {
  const { notifications, fetchNotifications, markAllAsRead, unreadCount } = useNotifications();
  const { toast } = useToast();
  const [emailEnabled, setEmailEnabled] = useState(() => getSetting('notif-emailEnabled', true));
  const [browserEnabled, setBrowserEnabled] = useState(() => getSetting('notif-browserEnabled', false));
  const [deadlineReminders, setDeadlineReminders] = useState(() => getSetting('notif-deadlineReminders', true));
  const [quizReminders, setQuizReminders] = useState(() => getSetting('notif-quizReminders', true));
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(Notification.permission);

  const [customMessage, setCustomMessage] = useState('');
  const [sendCustomEmail, setSendCustomEmail] = useState(true);
  const [isSendingCustom, setIsSendingCustom] = useState(false);


  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

   useEffect(() => {
    const updatePermission = () => setBrowserPermission(Notification.permission);
    updatePermission();
   }, []);
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

  const handleBrowserSwitchChange = async (checked: boolean) => {
    setBrowserEnabled(checked);
    setSetting('notif-browserEnabled', checked);

    if (checked && browserPermission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setBrowserPermission(permission);
        if (permission === 'granted') {
          toast({ title: "Browser notifications enabled" });
        } else if (permission === 'denied') {
           setBrowserEnabled(false);
           setSetting('notif-browserEnabled', false);
           toast({ title: "Browser notifications denied", description: "Please allow notifications in your browser settings.", variant: "warning" });
        }
      } catch (error) {
         console.error("Error requesting notification permission:", error);
         setBrowserEnabled(false);
         setSetting('notif-browserEnabled', false);
         toast({ title: "Error", description: "Could not request notification permission.", variant: "destructive" });
      }
    } else if (checked && browserPermission === 'denied') {
        setBrowserEnabled(false);
        setSetting('notif-browserEnabled', false);
        toast({ title: "Permission Denied", description: "Browser notifications are blocked. Please update your browser settings.", variant: "warning" });
    } else if (!checked) {
        toast({ title: "Browser notifications disabled" });
    }
  };

  const handleSettingChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, key: string) => (checked: boolean) => {
      setter(checked);
      setSetting(key, checked);
  };
  const handleSendCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) {
        toast({ title: "Error", description: "Message cannot be empty.", variant: "destructive"});
        return;
    }
    if (!sendCustomEmail) {
         toast({ title: "Error", description: "Select at least one delivery method (Email).", variant: "warning"});
        return;
    }

    setIsSendingCustom(true);
    try {
        const response = await apiRequest('POST', '/api/notifications/send-now', {
            message: customMessage,
            sendEmail: sendCustomEmail,
        });

        toast({
            title: "Announcement Sent",
            description: "Your custom notification has been processed.",
        });

        if (browserEnabled && browserPermission === 'granted') {
           new Notification("Admin Announcement", { body: customMessage });
        }

        setCustomMessage('');

    } catch (error) {
         toast({
            title: "Error Sending Announcement",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
        });
    } finally {
        setIsSendingCustom(false);
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-heading font-bold text-gray-800">Notifications</h2>
          <p className="text-sm text-gray-600">View recent notifications and manage settings</p>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0 || isSendingCustom}>
          <Check className="h-5 w-5 mr-2 text-gray-400" />
          Mark All Read ({unreadCount})
        </Button>
      </div>

      <Card className="mb-6">
          <CardHeader>
              <CardTitle>Send Custom Announcement</CardTitle>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSendCustomNotification} className="space-y-4">
                  <div>
                      <Label htmlFor="custom-message">Message</Label>
                      <Textarea
                          id="custom-message"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Enter your announcement message..."
                          rows={3}
                          required
                          disabled={isSendingCustom}
                      />
                  </div>
                   <div className="flex items-center space-x-4">
                       <div className="flex items-center space-x-2">
                           <Switch
                               id="send-custom-email"
                               checked={sendCustomEmail}
                               onCheckedChange={setSendCustomEmail}
                               disabled={isSendingCustom}
                           />
                           <Label htmlFor="send-custom-email">Send Email</Label>
                       </div>
                       {/* <div className="flex items-center space-x-2">
                           <Switch
                               id="send-custom-browser"
                               checked={sendCustomBrowser && browserEnabled && browserPermission === 'granted'}
                               onCheckedChange={(checked) => setSendCustomBrowser(checked && browserEnabled && browserPermission === 'granted')}
                               disabled={isSendingCustom || !browserEnabled || browserPermission !== 'granted'}
                           />
                           <Label htmlFor="send-custom-browser" className={!browserEnabled || browserPermission !== 'granted' ? 'text-gray-400' : ''}>
                               Send Browser Notification {browserPermission !== 'granted' ? `(${browserPermission})` : ''}
                            </Label>
                       </div> */}
                   </div>
                  <Button type="submit" disabled={isSendingCustom}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingCustom ? 'Sending...' : 'Send Now'}
                  </Button>
              </form>
          </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto"> 
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              return (
                <div key={notification.id} className={`p-4 ${!notification.sent ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}> {/* Use sent status */}
                  <div className="flex">
                    <div className="flex-shrink-0 pt-0.5">
                      <Bell className={`h-5 w-5 ${!notification.sent ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${!notification.sent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                          {/* Simplify title if event details aren't easily available */}
                          Notification
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap pl-3">
                          {getTimeAgo(notification.notifyAt)}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <p>{notification.message || 'You have a notification.'}</p>
                      </div>
                      {/* <div className="mt-2 text-xs">
                        {event && (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => handleViewEvent(event.id)}
                          >
                            View Event
                          </Button>
                        )}
                      </div> */}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No notifications to display.
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
           <p className="text-sm text-gray-500 dark:text-gray-400">Changes are saved locally in your browser.</p>
        </CardHeader>
        <CardContent className="space-y-6"> 
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive important notifications via email.</p>
               <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                 (Backend sending enabled: {process.env.NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED === 'true' ? 'Yes' : 'No - requires server config'})
               </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailEnabled}
              onCheckedChange={handleSettingChange(setEmailEnabled, 'notif-emailEnabled')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="browser-notifications" className="text-sm font-medium text-gray-900 dark:text-gray-100">Browser Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {browserPermission === 'granted' ? 'Receive notifications in this browser.' :
                   browserPermission === 'denied' ? 'Blocked. Check browser settings.' :
                   'Allow notifications in your browser.'}
                </p>
                 <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    (For immediate announcements only in this version)
                 </p>
            </div>
            <Switch
              id="browser-notifications"
              checked={browserEnabled && browserPermission === 'granted'} // Switch reflects permission state
              onCheckedChange={handleBrowserSwitchChange}
              disabled={browserPermission === 'denied'} // Disable if permanently denied
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
             <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Notification Types (Future)</h4>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">These settings will control which scheduled notifications generate emails/pushes in future updates.</p>
             <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="deadline-reminders" className="text-sm font-medium text-gray-900 dark:text-gray-100">Deadline Reminders</Label>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Get reminders for upcoming deadlines.</p>
                   </div>
                   <Switch
                     id="deadline-reminders"
                     checked={deadlineReminders}
                     onCheckedChange={handleSettingChange(setDeadlineReminders, 'notif-deadlineReminders')}
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="quiz-notifications" className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiz Notifications</Label>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about upcoming quizzes.</p>
                   </div>
                   <Switch
                     id="quiz-notifications"
                     checked={quizReminders}
                     onCheckedChange={handleSettingChange(setQuizReminders, 'notif-quizReminders')}
                   />
                 </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}