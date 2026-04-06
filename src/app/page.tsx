'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore, Currency, Session, TripEvent, EventType } from '@/store/useStore';
import styles from './page.module.css';
import { WelcomeView } from '../components/WelcomeView';

type ViewMode = 'welcome' | 'active' | 'archive';

export default function Home() {
  const { 
    sessions, 
    events, 
    addSession, 
    addEvent, 
    completeSession, 
    updateSession, 
    updateEvent, 
    deleteEvent, 
    restoreEvent, 
    lastDeletedEvent, 
    getSessionStats 
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // New Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // New/Edit Session State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'budget' | 'tracking'>('budget');
  const [newBudget, setNewBudget] = useState('');
  const [newCurrency, setNewCurrency] = useState<Currency>('£');

  // New/Edit Event State
  const [eventAmount, setEventAmount] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('expense');
  const [eventCategory, setEventCategory] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('');
  const [eventAttachment, setEventAttachment] = useState<string | null>(null);

  // UI State for deleting
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Hydration & Initial View
  useEffect(() => {
    setMounted(true);
    if (sessions.length === 0) {
      setViewMode('welcome');
    }
  }, [sessions.length]);

  const resetSessionForm = (session?: Session) => {
    setNewName(session?.name || '');
    setNewType(session?.type || 'budget');
    setNewBudget(session?.totalBudget?.toString() || '');
    setNewCurrency(session?.currency || '£');
  };

  const resetEventForm = (event?: TripEvent) => {
    setEventAmount(event?.amount?.toString() || '');
    setEventTitle(event?.title || '');
    setEventType(event?.type || 'expense');
    setEventCategory(event?.category || '');
    setEventNote(event?.note || '');
    setEventAddress(event?.address || '');
    setEventDate(event?.date || new Date().toISOString().split('T')[0]);
    setEventTime(event?.time || '');
    setEventAttachment(event?.attachment || null);
  };

  const handleCreateOrUpdateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const data = {
      name: newName,
      type: newType,
      totalBudget: newType === 'budget' && newBudget ? parseFloat(newBudget) : undefined,
      currency: newCurrency,
    };
    if (isEditingSession && viewingSessionId) {
      updateSession(viewingSessionId, data);
      setIsEditingSession(false);
    } else {
      addSession(data);
      setIsAddingSession(false);
      setViewMode('active');
    }
    resetSessionForm();
  };

  const handleCreateOrUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle) return;
    const data = {
      amount: parseFloat(eventAmount) || 0,
      title: eventTitle,
      type: eventType,
      category: eventCategory,
      note: eventNote,
      address: eventAddress || undefined,
      date: eventDate,
      time: eventTime || undefined,
      attachment: eventAttachment || undefined,
    };
    if (editingEventId) {
      updateEvent(editingEventId, data);
      setEditingEventId(null);
    } else if (selectedSessionId) {
      addEvent({ ...data, sessionId: selectedSessionId });
      setIsAddingEvent(true); 
      resetEventForm();
      return; 
    }
    resetEventForm();
    setIsAddingEvent(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEventAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Improved Action Handlers
  const handleMapClick = (addr: string) => {
    if (!addr) return;
    // Check if it's already a URL
    if (addr.startsWith('http') || addr.startsWith('https://maps')) {
      window.open(addr, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
    }
  };

  const handleTicketClick = (attachment: string) => {
    if (!attachment) return;
    const win = window.open();
    if (win) {
      win.document.title = "Ticket View";
      win.document.body.style.margin = "0";
      win.document.body.style.display = "flex";
      win.document.body.style.justifyContent = "center";
      win.document.body.style.alignItems = "center";
      win.document.body.style.backgroundColor = "#121212";
      win.document.body.innerHTML = `<img src="${attachment}" style="max-width:100%; max-height:100%; object-fit: contain;" />`;
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const archivedSessions = sessions.filter(s => s.status === 'completed');

  const currentViewingSession = sessions.find(s => s.id === viewingSessionId);
  
  // ITINERARY GROUPING LOGIC
  const currentEvents = useMemo(() => {
    return events
      .filter(e => e.sessionId === viewingSessionId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.timestamp - a.timestamp);
  }, [events, viewingSessionId]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, TripEvent[]> = {};
    currentEvents.forEach(event => {
      if (!groups[event.date]) groups[event.date] = [];
      groups[event.date].push(event);
    });
    
    // Sort days descending, but events WITHIN days ascending by time
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, evs]) => {
        const sortedEvs = [...evs].sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
        return [date, sortedEvs] as [string, TripEvent[]];
      });
  }, [currentEvents]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedEvents;
    return groupedEvents.map(([date, evs]) => {
      const filtered = evs.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.note.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return [date, filtered] as [string, TripEvent[]];
    }).filter(([_, evs]) => evs.length > 0);
  }, [groupedEvents, searchQuery]);

  const categoryTotals = currentEvents.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const uniqueTitlesForSuggestions = Array.from(new Set(events.map(e => e.title))).sort();
  const uniqueCategoriesForSuggestions = Array.from(new Set(events.map(e => e.category))).sort();

  const getEventIcon = (type: EventType, category: string) => {
    const cat = category.toLowerCase();
    if (type === 'booking') {
      if (cat.includes('flight') || cat.includes('plane')) return '✈️';
      if (cat.includes('hotel') || cat.includes('stay') || cat.includes('airbnb')) return '🏨';
      if (cat.includes('train')) return '🚆';
      if (cat.includes('car') && cat.includes('rental')) return '🚗';
      return '📅';
    }
    if (type === 'itinerary') {
       if (cat.includes('fuel') || cat.includes('petrol') || cat.includes('gas')) return '⛽';
       if (cat.includes('car') || (cat.includes('shuttle') && !cat.includes('bus'))) return '🚗';
       return '📍';
    }
    
    // Expense defaults
    if (cat.includes('food') || cat.includes('eat') || cat.includes('rest')) return '🍴';
    if (cat.includes('fuel') || cat.includes('petrol') || cat.includes('gas')) return '⛽';
    if (cat.includes('grocery')) return '🛒';
    if (cat.includes('memory') || cat.includes('thought')) return '✨';
    return '💰';
  };

  if (!mounted) return null;

  return (
    <main className={styles.appShell}>
      {/* Sidebar for Desktop */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.iconCircle}>🌍</div>
          <h2>Trip Tracker</h2>
        </div>
        <nav className={styles.sidebarNav}>
          <button 
            className={(viewMode === 'active' && viewingSessionId === null) ? `${styles.navItem} ${styles.navActive}` : styles.navItem}
            onClick={() => { setViewMode('active'); setViewingSessionId(null); }}
          >
            Active Trips
          </button>
          <button 
            className={(viewMode === 'archive' && viewingSessionId === null) ? `${styles.navItem} ${styles.navActive}` : styles.navItem}
            onClick={() => { setViewMode('archive'); setViewingSessionId(null); }}
          >
            Archive
          </button>
        </nav>
      </aside>

      <section className={styles.content}>
        
        {viewMode === 'welcome' && (
          <WelcomeView onStart={() => { setIsAddingSession(true); setViewingSessionId(null); }} />
        )}

        {(viewMode === 'active' || viewMode === 'archive') && viewingSessionId && currentViewingSession ? (
          /* TRIP DETAIL VIEW */
          <div className={styles.detailView}>
            <header className={styles.detailHeader}>
              <button className={styles.backBtn} onClick={() => setViewingSessionId(null)}>← Trips</button>
              <div className={styles.detailTitleArea}>
                <h1>{currentViewingSession.name}</h1>
                <button className={styles.editBtn} onClick={() => { resetSessionForm(currentViewingSession); setIsEditingSession(true); }}>Edit</button>
              </div>
            </header>

            <div className={styles.sectionTitle}>
               <h3>Trip Overview</h3>
            </div>

            <div className={`glass glass-card ${styles.heroStats}`}>
               {(() => {
                 const stats = getSessionStats(currentViewingSession.id);
                 const color = stats.percentage < 70 ? 'var(--status-safe)' : 
                               stats.percentage < 90 ? 'var(--status-warning)' : 
                               'var(--status-critical)';
                 return (
                   <>
                    <div className={styles.mainStatLarge}>
                      <span className={styles.currencyLarge}>{currentViewingSession.currency}</span>
                      <span className={styles.amountLarge}>{stats.spent.toLocaleString()}</span>
                    </div>
                    {currentViewingSession.type === 'budget' && (
                      <>
                        <div className="progress-container" style={{ margin: '1.5rem 0 1rem' }}>
                          <div 
                            className={`progress-fill ${stats.percentage >= 90 ? 'pulse-critical' : ''}`}
                            style={{ 
                              width: `${Math.min(stats.percentage, 100)}%`, 
                              backgroundColor: color 
                            }} 
                          />
                        </div>
                        <div className={styles.budgetMetrics}>
                           <div><p>Left</p><h4 style={{ color }}>{currentViewingSession.currency}{stats.remaining.toLocaleString()}</h4></div>
                           <div><p>Budget</p><h4>{currentViewingSession.currency}{currentViewingSession.totalBudget?.toLocaleString()}</h4></div>
                           <div><p>Usage</p><h4 style={{ color }}>{Math.round(stats.percentage)}%</h4></div>
                        </div>
                      </>
                    )}
                   </>
                 );
               })()}
            </div>

            {/* Insights Section */}
            {currentEvents.length > 0 && (
              <div className={styles.analyticsSection}>
                <p className={styles.navLabel} style={{ margin: '0 0 0.75rem' }}>Top Cost Drivers</p>
                <div className={styles.categoryPills}>
                  {Object.entries(categoryTotals)
                    .sort((a,b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([cat, total]) => (
                    <div key={cat} className={styles.analyticsPill}>
                      <span className={styles.pillLabel}>{cat}</span>
                      <span className={styles.pillValue}>{currentViewingSession.currency}{total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.expenseListTitle}>
               <h3>Flights & Accommodations</h3>
               <button onClick={() => { setSelectedSessionId(currentViewingSession.id); setIsAddingEvent(true); setEventType('booking'); }} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>+ Log Event</button>
            </div>

            <div className={styles.fullExpenseList}>
               {(() => {
                 const bookingEvents = filteredGroups.map(([date, evs]) => [
                   date, 
                   evs.filter(e => e.type === 'booking')
                 ] as [string, TripEvent[]]).filter(([_, evs]) => evs.length > 0);

                 if (bookingEvents.length === 0) return <p className={styles.emptyMsg}>No bookings or reservations logged.</p>;

                 return bookingEvents.map(([date, dayEvents]) => (
                   <div key={`bookings-${date}`} className={styles.timelineDay}>
                     <div className={styles.dateHeader}>
                       {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                     </div>
                     <div className={styles.dayEvents}>
                       {dayEvents.map(e => (
                         <div key={e.id} className={`glass ${styles.fullExpenseItem} ${styles.bookingHighlight}`}>
                            <div className={styles.eventIcon}>{getEventIcon('booking', e.category)}</div>
                            <div className={styles.expenseInfo}>
                               <strong>{e.time && <span style={{ opacity: 0.6, fontSize: '0.9em', marginRight: '0.6rem' }}>{e.time}</span>}{e.title}</strong>
                               <div className={styles.expenseSub}>
                                 <span className={styles.categoryTag}>{e.category}</span>
                                 <span className={styles.bookingBadge}>BOOKING</span>
                                 {e.address && <button className={styles.mapBadge} onClick={(ev) => { ev.stopPropagation(); handleMapClick(e.address || ''); }}>📍 MAP</button>}
                                 {e.attachment && <button className={styles.ticketBadge} onClick={(ev) => { ev.stopPropagation(); handleTicketClick(e.attachment || ''); }}>🎫 TICKET</button>}
                                 {e.note && <span className={styles.noteText}>{e.note}</span>}
                               </div>
                            </div>
                            <div className={styles.expenseValue}>
                               {e.amount > 0 && <span className={styles.rowAmount}>{currentViewingSession.currency}{e.amount.toLocaleString()}</span>}
                               <div className={styles.rowActions}>
                                  <button className={styles.editRowBtn} onClick={() => { resetEventForm(e); setEditingEventId(e.id); setIsAddingEvent(true); }}>Edit</button>
                                  <button className={styles.deleteRowBtn} onClick={() => setDeletingEventId(e.id)} style={{ color: 'var(--status-critical)' }}>✕</button>
                               </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ));
               })()}
            </div>

            <div className={styles.expenseListTitle} style={{ marginTop: '3.5rem' }}>
               <h3>Itinerary</h3>
            </div>

            <div className={styles.fullExpenseList}>
               {(() => {
                 const itineraryEvents = filteredGroups.map(([date, evs]) => [
                   date, 
                   evs.filter(e => e.type === 'itinerary' || (e as any).type === 'logistics')
                 ] as [string, TripEvent[]]).filter(([_, evs]) => evs.length > 0);

                 if (itineraryEvents.length === 0) return <p className={styles.emptyMsg}>No itinerary movements logged.</p>;

                 return itineraryEvents.map(([date, dayEvents]) => (
                   <div key={`itinerary-${date}`} className={styles.timelineDay}>
                     <div className={styles.dateHeader}>
                       {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                     </div>
                     <div className={styles.dayEvents}>
                       {dayEvents.map(e => (
                         <div key={e.id} className={`glass ${styles.fullExpenseItem}`}>
                            <div className={styles.eventIcon}>{getEventIcon('itinerary', e.category)}</div>
                            <div className={styles.expenseInfo}>
                               <strong>{e.time && <span style={{ opacity: 0.6, fontSize: '0.9em', marginRight: '0.6rem' }}>{e.time}</span>}{e.title}</strong>
                               <div className={styles.expenseSub}>
                                 <span className={styles.categoryTag}>{e.category}</span>
                                 {e.address && <button className={styles.mapBadge} onClick={(ev) => { ev.stopPropagation(); handleMapClick(e.address || ''); }}>📍 MAP</button>}
                                 {e.attachment && <button className={styles.ticketBadge} onClick={(ev) => { ev.stopPropagation(); handleTicketClick(e.attachment || ''); }}>🎫 TICKET</button>}
                                 {e.note && <span className={styles.noteText}>{e.note}</span>}
                               </div>
                            </div>
                            <div className={styles.expenseValue}>
                               {e.amount > 0 && <span className={styles.rowAmount}>{currentViewingSession.currency}{e.amount.toLocaleString()}</span>}
                               <div className={styles.rowActions}>
                                  <button className={styles.editRowBtn} onClick={() => { resetEventForm(e); setEditingEventId(e.id); setIsAddingEvent(true); }}>Edit</button>
                                  <button className={styles.deleteRowBtn} onClick={() => setDeletingEventId(e.id)} style={{ color: 'var(--status-critical)' }}>✕</button>
                               </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ));
               })()}
            </div>

            <div className={styles.expenseListTitle} style={{ marginTop: '3.5rem' }}>
               <h3>Expenses</h3>
            </div>

            <div className={styles.fullExpenseList}>
               {(() => {
                 const expenseEvents = filteredGroups.map(([date, evs]) => [
                   date, 
                   evs.filter(e => e.type === 'expense')
                 ] as [string, TripEvent[]]).filter(([_, evs]) => evs.length > 0);

                 if (expenseEvents.length === 0) return <p className={styles.emptyMsg}>No daily expenses logged.</p>;

                 return expenseEvents.map(([date, dayEvents]) => (
                   <div key={`expenses-${date}`} className={styles.timelineDay}>
                     <div className={styles.dateHeader}>
                       {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                     </div>
                     <div className={styles.dayEvents}>
                       {dayEvents.map(e => (
                         <div key={e.id} className={`glass ${styles.fullExpenseItem}`}>
                            <div className={styles.eventIcon}>{getEventIcon(e.type, e.category)}</div>
                            <div className={styles.expenseInfo}>
                               <strong>{e.time && <span style={{ opacity: 0.6, fontSize: '0.9em', marginRight: '0.6rem' }}>{e.time}</span>}{e.title}</strong>
                               <div className={styles.expenseSub}>
                                 <span className={styles.categoryTag}>{e.category}</span>
                                 {e.address && <button className={styles.mapBadge} onClick={(ev) => { ev.stopPropagation(); handleMapClick(e.address || ''); }}>📍 MAP</button>}
                                 {e.attachment && <button className={styles.ticketBadge} onClick={(ev) => { ev.stopPropagation(); handleTicketClick(e.attachment || ''); }}>🎫 TICKET</button>}
                                 {e.note && <span className={styles.noteText}>{e.note}</span>}
                               </div>
                            </div>
                            <div className={styles.expenseValue}>
                               <span className={styles.rowAmount}>{currentViewingSession.currency}{e.amount.toLocaleString()}</span>
                               <div className={styles.rowActions}>
                                  <button className={styles.editRowBtn} onClick={() => { resetEventForm(e); setEditingEventId(e.id); setIsAddingEvent(true); }}>Edit</button>
                                  <button className={styles.deleteRowBtn} onClick={() => setDeletingEventId(e.id)} style={{ color: 'var(--status-critical)' }}>✕</button>
                               </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ));
               })()}
            </div>
            
            {/* Confirmation Modal */}
            {deletingEventId && (
              <div className={styles.modalOverlay}>
                <div className="glass glass-card" style={{ width: '90%', maxWidth: '344px', textAlign: 'center' }}>
                  <h3>Delete Item?</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>Remove this event permanently?</p>
                  <div className={styles.modalActions}>
                    <button onClick={() => setDeletingEventId(null)} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={() => { deleteEvent(deletingEventId); setDeletingEventId(null); }} className="btn-primary" style={{ backgroundColor: 'var(--status-critical)' }}>Confirm</button>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.footerActions}>
                {currentViewingSession.status === 'active' ? (
                   <button className="btn-primary" style={{ backgroundColor: 'var(--surface-2)', width: '100%' }} onClick={() => { completeSession(currentViewingSession.id); setViewingSessionId(null); setViewMode('archive'); }}>Finish & Archive</button>
                ) : (
                  <button className="btn-primary" style={{ backgroundColor: 'var(--surface-2)', width: '100%' }} onClick={() => { updateSession(currentViewingSession.id, { status: 'active' }); setViewMode('active'); }}>Reactivate Trip</button>
                )}
            </div>
          </div>
        ) : (
          /* DASHBOARD VIEW (Grid of Trips) */
          (viewMode === 'active' || viewMode === 'archive') && !viewingSessionId && (
            <div className={styles.dashboardContainer}>
              <header className={styles.header}>
                <h1 className={styles.title}>{viewMode === 'active' ? 'Active Trips' : 'Travel Archive'}</h1>
                <p className={styles.subtitle}>{viewMode === 'active' ? 'Real-time memory and spend engine for your ongoing journeys.' : 'Blueprints from your past adventures.'}</p>
              </header>

              <div className={styles.grid}>
                {(viewMode === 'active' ? activeSessions : archivedSessions).length === 0 ? (
                  <div className="glass glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No {viewMode} trips found.</p>
                    {viewMode === 'active' && <button onClick={() => setIsAddingSession(true)} className="btn-primary" style={{ marginTop: '1.5rem' }}>+ Plan New Trip</button>}
                  </div>
                ) : (
                  (viewMode === 'active' ? activeSessions : archivedSessions).map(session => {
                    const stats = getSessionStats(session.id);
                    const color = stats.percentage < 70 ? 'var(--status-safe)' : 
                                  stats.percentage < 90 ? 'var(--status-warning)' : 
                                  'var(--status-critical)';
                    return (
                      <div key={session.id} className={`glass glass-card ${styles.card}`} onClick={() => setViewingSessionId(session.id)} style={{ cursor: 'pointer' }}>
                        <div className={styles.cardHeader}><h3>{session.name}</h3><div className={styles.cardIndicator} style={{ backgroundColor: color }} /></div>
                        <div className={styles.cardStats}>
                          <div className={styles.mainStat}>
                            <span className={styles.currency}>{session.currency}</span>
                            <span className={styles.amount}>{stats.spent.toLocaleString()}</span>
                          </div>
                          {session.type === 'budget' && <div className={styles.budgetLabel}>{Math.round(stats.percentage)}% used</div>}
                        </div>
                        {session.type === 'budget' && (<div className="progress-container" style={{ marginTop: '0.75rem' }}><div className="progress-fill" style={{ width: `${Math.min(stats.percentage, 100)}%`, backgroundColor: color }} /></div>)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )
        )}
      </section>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileBottomNav}>
        <button 
          className={viewMode === 'active' ? `${styles.mobileNavItem} ${styles.mobileNavActive}` : styles.mobileNavItem}
          onClick={() => { setViewMode('active'); setViewingSessionId(null); }}
        >
          <span className={styles.mobileIcon}>✈️</span>
          <span className={styles.mobileLabel}>Active Trips</span>
        </button>
        <button 
          className={viewMode === 'archive' ? `${styles.mobileNavItem} ${styles.mobileNavActive}` : styles.mobileNavItem}
          onClick={() => { setViewMode('archive'); setViewingSessionId(null); }}
        >
          <span className={styles.mobileIcon}>📁</span>
          <span className={styles.mobileLabel}>Archive</span>
        </button>
        <button 
          className={isAddingSession || isAddingEvent ? `${styles.mobileNavItem} ${styles.mobileNavActive}` : styles.mobileNavItem}
          onClick={() => { viewingSessionId ? setIsAddingEvent(true) : setIsAddingSession(true); }}
        >
          <span className={styles.mobileIcon}>➕</span>
          <span className={styles.mobileLabel}>Log</span>
        </button>
      </nav>

      {/* Undo Toast */}
      {lastDeletedEvent && (
        <div className={styles.undoToast}>
          <span>Deleted.</span>
          <button onClick={restoreEvent}>Undo</button>
        </div>
      )}

      {/* MODALS */}
      {(isAddingSession || isEditingSession) && (
        <div className={styles.modalOverlay}>
          <div className="glass glass-card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2>{isEditingSession ? 'Edit' : 'New'} Trip</h2>
            <form onSubmit={handleCreateOrUpdateSession}>
              <div className={styles.inputGroup}><label>Trip Name</label><input required type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Italy Adventure" /></div>
              <div className={styles.inputGroup}><label>Tracking Mode</label><select value={newType} onChange={e => setNewType(e.target.value as 'budget' | 'tracking')}><option value="budget">Hard Budget (Cap)</option><option value="tracking">Experience Tracker (No Cap)</option></select></div>
              {newType === 'budget' && (<div className={styles.inputGroup}><label>Total Budget</label><input required type="number" step="0.01" value={newBudget} onChange={e => setNewBudget(e.target.value)} /></div>)}
              <div className={styles.inputGroup}><label>Currency</label><select value={newCurrency} onChange={e => setNewCurrency(e.target.value as Currency)}><option value="£">GBP (£)</option><option value="€">EUR (€)</option><option value="$">USD ($)</option><option value="ARS">ARS ($)</option></select></div>
              <div className={styles.modalActions}><button type="button" onClick={() => { setIsAddingSession(false); setIsEditingSession(false); }} className={styles.cancelBtn}>Cancel</button><button type="submit" className="btn-primary">{isEditingSession ? 'Save' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      {(isAddingEvent || editingEventId) && (
        <div className={styles.modalOverlay}>
          <div className="glass glass-card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2>{editingEventId ? 'Edit' : 'Log'} Event</h2>
            <form onSubmit={handleCreateOrUpdateEvent}>
              <div className={styles.inputGroup}>
                <label>Event Type</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {(['booking', 'itinerary', 'expense'] as EventType[]).map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setEventType(t)}
                      className={eventType === t ? 'btn-primary' : styles.cancelBtn}
                      style={{ fontSize: '0.65rem', padding: '0.4rem', flex: 1, textTransform: 'capitalize' }}
                    >
                      {t === 'booking' ? 'Flights & Stays' : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.inputGroup}><label>Title</label><input required list="title-suggestions" type="text" placeholder="e.g. Ryanair FR123" value={eventTitle} onChange={e => setEventTitle(e.target.value)} /></div>
              <div className={styles.inputGroup}><label>Location Address or Maps Link</label><input type="text" placeholder="e.g. Florence Station or Paste Link" value={eventAddress} onChange={e => setEventAddress(e.target.value)} /></div>
              <div className={styles.inputGroup}><label>Amount (Optional)</label><input type="number" step="0.01" value={eventAmount} onChange={e => setEventAmount(e.target.value)} /></div>
              <div className={styles.inputGroup} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Date</label>
                  <input required type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Time (Optional)</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                </div>
              </div>
              <div className={styles.inputGroup}><label>Category</label><input list="category-suggestions" required type="text" placeholder="e.g. FLIGHTS" value={eventCategory} onChange={e => setEventCategory(e.target.value)} /></div>
              <div className={styles.inputGroup}>
                <label>Attachment (Photo/Ticket)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                  <label htmlFor="file-upload" className={styles.cancelBtn} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.1)' }}>
                    {eventAttachment ? '✅ ATTACHED' : '📎 ATTACH TICKET / PIC'}
                  </label>
                  {eventAttachment && <button type="button" onClick={() => setEventAttachment(null)} style={{ background: 'transparent', color: 'var(--status-critical)', border: 'none' }}>✕</button>}
                </div>
              </div>

              <div className={styles.inputGroup}><label>Notes, Context, Memories</label><textarea placeholder="WiFi quality, car needed, trip memories..." value={eventNote} onChange={e => setEventNote(e.target.value)} style={{ width: '100%', minHeight: '100px', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} /></div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => { setIsAddingEvent(false); setEditingEventId(null); resetEventForm(); }} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className="btn-primary">{editingEventId ? 'Save' : 'Log Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <datalist id="title-suggestions">{uniqueTitlesForSuggestions.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="category-suggestions">{uniqueCategoriesForSuggestions.map(c => <option key={c} value={c} />)}</datalist>
    </main>
  );
}
