
import { useState } from "react";
import { Event, EventCategory, InsertEvent, eventCategories, InsertNotification } from "@shared/schema";  
import { useEvents } from "@/store/events";
import { useNotifications } from "@/store/notifications"; 
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateForInput, combineDateTime } from "@/lib/date-utils"; 

interface EventModalProps {
    event?: Event;
    onClose: () => void;
    onSaved?: () => void;
}

export default function EventModal({ event, onClose, onSaved }: EventModalProps) {
    const { createEvent, updateEvent } = useEvents();
    const { createNotification } = useNotifications(); 
    const { toast } = useToast();

    const [title, setTitle] = useState(event?.title || '');
    const [category, setCategory] = useState<EventCategory>(event?.category as EventCategory || 'other');
    const [date, setDate] = useState(event?.date || formatDateForInput(new Date()));
    const [time, setTime] = useState(event?.time || '09:00');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [sendNotification, setSendNotification] = useState(false); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!event;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const eventData: Omit<InsertEvent, 'createdById'> = {
            title,
            category,
            date,
            time,
            description,
            location: location || undefined,
        };

        try {
            let savedEvent: Event | null = null; 

            if (isEditing && event) {
                savedEvent = await updateEvent(event.id, eventData); 
                toast({
                    title: "Event updated",
                    description: "Event has been updated successfully",
                });
            } else {
                savedEvent = await createEvent(eventData);
                toast({
                    title: "Event created",
                    description: "Event has been created successfully",
                });
            }

            if (savedEvent && sendNotification) {
                const notificationData: InsertNotification = {
                    eventId: savedEvent.id, 
                    notifyAt: combineDateTime(savedEvent.date, savedEvent.time),
                    message: `New Event${savedEvent.category !== 'other' ? ` (${savedEvent.category})` : ''}: ${savedEvent.title}`,
                };

                try {
                    await createNotification(notificationData);
                    toast({
                        title: "Notification Sent",
                        description: "Notification for the event has been scheduled.",
                    });
                } catch (notificationError) {
                    console.error("Failed to create notification:", notificationError);
                    toast({
                        title: "Notification Error",
                        description: notificationError instanceof Error ? notificationError.message : "Failed to send notification for the event.",
                        variant: "destructive",
                    });
                }
            }

            if (onSaved) {
                onSaved();
            } else {
                onClose(); 
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save event",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <Label htmlFor="event-title">Title</Label>
                        <Input
                          id="event-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter event title"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="event-category">Category</Label>
                        <Select
                          value={category}
                          onValueChange={(value) => setCategory(value as EventCategory)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="event-date">Date</Label>
                          <Input
                            id="event-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="event-time">Time</Label>
                          <Input
                            id="event-time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="event-description">Description</Label>
                        <Textarea
                          id="event-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter event description"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="event-location">Location (optional)</Label>
                        <Input
                          id="event-location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter location"
                        />
                      </div>

                    {!isEditing && ( 
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="send-notification"
                                checked={sendNotification}
                                onCheckedChange={(checked) => setSendNotification(!!checked)}
                            />
                            <Label htmlFor="send-notification" className="text-sm">
                                Send notification to all students
                            </Label>
                        </div>
                    )}

                    <DialogFooter className="sm:justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Event' : 'Save Event')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export function combineDateTime(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}`);
}