import { create } from 'zustand';
import { Event, EventCategory, InsertEvent } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface EventsState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  currentView: 'month' | 'week' | 'day';
  selectedEvent: Event | null;
  fetchEvents: () => Promise<void>;
  createEvent: (event: Omit<InsertEvent, 'createdById'>) => Promise<Event>;
  updateEvent: (id: number, event: Partial<InsertEvent>) => Promise<Event>;
  deleteEvent: (id: number) => Promise<void>;
  setCurrentDate: (date: Date) => void;
  setCurrentView: (view: 'month' | 'week' | 'day') => void;
  setSelectedEvent: (event: Event | null) => void;
  getEventsByDay: (year: number, month: number, day: number) => Event[];
  getUpcomingEvents: (count?: number) => Event[];
}

export const useEvents = create<EventsState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  currentDate: new Date(),
  currentView: 'month',
  selectedEvent: null,
  
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/events', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const events = await res.json();
      set({ events, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events' 
      });
    }
  },
  
  createEvent: async (event) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest('POST', '/api/events', event);
      const newEvent = await res.json();
      
      set(state => ({ 
        events: [...state.events, newEvent],
        isLoading: false 
      }));
      
      return newEvent;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create event' 
      });
      throw error;
    }
  },
  
  updateEvent: async (id, event) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest('PUT', `/api/events/${id}`, event);
      const updatedEvent = await res.json();
      
      set(state => ({
        events: state.events.map(e => e.id === id ? updatedEvent : e),
        isLoading: false
      }));
      
      return updatedEvent;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update event' 
      });
      throw error;
    }
  },
  
  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest('DELETE', `/api/events/${id}`);
      
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete event' 
      });
      throw error;
    }
  },
  
  setCurrentDate: (date) => {
    set({ currentDate: date });
  },
  
  setCurrentView: (view) => {
    set({ currentView: view });
  },
  
  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },
  
  getEventsByDay: (year, month, day) => {
    const { events } = get();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => event.date === dateStr);
  },
  
  getUpcomingEvents: (count = 3) => {
    const { events } = get();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => {
        // Sort by date first
        if (a.date !== b.date) {
          return a.date < b.date ? -1 : 1;
        }
        // If same date, sort by time
        return a.time < b.time ? -1 : 1;
      })
      .slice(0, count);
  }
}));
