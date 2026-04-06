import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SessionType = 'budget' | 'tracking';
export type SessionStatus = 'active' | 'paused' | 'completed';
export type Currency = '£' | '€' | '$' | 'ARS';
export type EventType = 'booking' | 'expense' | 'itinerary';

export interface Session {
  id: string;
  name: string;
  type: SessionType;
  totalBudget?: number;
  currency: Currency;
  status: SessionStatus;
  createdAt: number;
}

export interface TripEvent {
  id: string;
  sessionId: string;
  type: EventType;
  amount: number;
  category: string; // e.g., 'Flight', 'Hotel', 'Food', 'Car Rental'
  title: string;    // e.g., 'Ryanair FR123', 'Hotel Agroturismo', 'Lunch at Seaside'
  note: string;     // Detailed memories or constraints (e.g., "Weak WiFi")
  date: string;     // ISO date string YYYY-MM-DD
  time?: string;    // Optional time HH:mm
  address?: string; // Optional Google Maps location/address
  attachment?: string; // Optional Base64 image
  timestamp: number;
  isHighlight?: boolean;
  metadata?: {
    startTime?: string;
    location?: string;
    rating?: number;
    wifiRating?: number;
    requiresCar?: boolean;
  };
}

interface AppState {
  sessions: Session[];
  events: TripEvent[];
  
  // Session Actions
  addSession: (session: Omit<Session, 'id' | 'createdAt' | 'status'>) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  completeSession: (id: string) => void;
  
  // Event Actions
  addEvent: (event: Omit<TripEvent, 'id' | 'timestamp'>) => void;
  updateEvent: (id: string, updates: Partial<TripEvent>) => void;
  deleteEvent: (id: string) => void;
  restoreEvent: () => void;
  lastDeletedEvent: TripEvent | null;
  
  // Helpers
  getSessionStats: (sessionId: string) => {
    spent: number;
    remaining: number;
    percentage: number;
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessions: [],
      events: [],
      lastDeletedEvent: null,

      addSession: (session) => {
        const newSession: Session = {
          ...session,
          id: crypto.randomUUID(),
          status: 'active',
          createdAt: Date.now(),
        };
        set((state) => ({ sessions: [newSession, ...state.sessions] }));
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          events: state.events.filter((e) => e.sessionId !== id),
        }));
      },

      completeSession: (id) => {
        set((state) => ({
          sessions: state.sessions.map((s) => 
            s.id === id ? { ...s, status: 'completed' } : s
          ),
        }));
      },

      addEvent: (event) => {
        const newEvent: TripEvent = {
          ...event,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          title: event.title.trim(),
          category: event.category.trim().toUpperCase(),
          note: event.note.trim()
        };
        set((state) => ({ events: [newEvent, ...state.events] }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { 
            ...e, 
            ...updates,
            title: updates.title ? updates.title.trim() : e.title,
            category: updates.category ? updates.category.trim().toUpperCase() : e.category,
            note: updates.note !== undefined ? (updates.note || '').trim() : e.note
          } : e)),
        }));
      },

      deleteEvent: (id) => {
        const item = get().events.find((e) => e.id === id);
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          lastDeletedEvent: item || null,
        }));
      },

      restoreEvent: () => {
        const last = get().lastDeletedEvent;
        if (last) {
          set((state) => ({
            events: [last, ...state.events],
            lastDeletedEvent: null,
          }));
        }
      },

      getSessionStats: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        const sessionEvents = get().events.filter((e) => e.sessionId === sessionId);
        const spent = sessionEvents.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        
        if (!session || session.type === 'tracking' || !session.totalBudget) {
          return { spent, remaining: 0, percentage: 0 };
        }

        const remaining = session.totalBudget - spent;
        const percentage = (spent / session.totalBudget) * 100;
        
        return { spent, remaining, percentage };
      },
    }),
    {
      name: 'trip-tracker-engine-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
