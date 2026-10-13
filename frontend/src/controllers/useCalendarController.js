import { useState, useEffect } from 'react';

import { BACKEND_URL } from '../config';

export function useCalendarController(role, employeeId, companyId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const mergeKssSessions = (calendarEvents, kssSessions) => {
    const kssEvents = kssSessions.map((s) => ({
      _id: s._id,
      id: s._id,
      title: `🎥 ${s.title}`,
      description: `Conducted by: ${s.conductor}`,
      start: s.date,
      end: s.date,
      type: 'knowledge-session',
      targetLocation: 'all',
      targetValue: '',
      conductor: s.conductor,
      meetingLink: s.meetingLink,
      time: s.time,
      rawTitle: s.title,
    }));
    return [...calendarEvents, ...kssEvents];
  };

  const fetchEvents = async () => {
    if (role === 'employee' && !employeeId) return;
    if (role === 'company' && !companyId) return;
    try {
      setLoading(true);
      let url = `${BACKEND_URL}/calendar`;
      if (role === 'employee' && employeeId) {
        url += `?employeeId=${employeeId}`;
      } else if (role === 'company' && companyId) {
        url += `?companyId=${companyId}`;
      }
      const res = await fetch(url);
      let calendarEvents = [];
      if (res.ok) {
        calendarEvents = await res.json();
      }

      if (role === 'employee' && employeeId) {
        try {
          const kssRes = await fetch(`${BACKEND_URL}/employees/${employeeId}/knowledge-sessions`);
          if (kssRes.ok) {
            const kssSessions = await kssRes.json();
            calendarEvents = mergeKssSessions(calendarEvents, kssSessions);
          }
        } catch (err) {
          console.error('Failed to fetch knowledge sessions:', err);
        }
      } else if (role === 'superadmin' || role === 'hr') {
        try {
          const kssRes = await fetch(`${BACKEND_URL}/admin/knowledge-sessions`);
          if (kssRes.ok) {
            const kssSessions = await kssRes.json();
            calendarEvents = mergeKssSessions(calendarEvents, kssSessions);
          }
        } catch (err) {
          console.error('Failed to fetch all knowledge sessions:', err);
        }
      }

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        fetchEvents();
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/calendar/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        fetchEvents();
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/calendar/${eventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchEvents();
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, employeeId, companyId]);

  return {
    events,
    loading,
    currentDate,
    setCurrentDate,
    fetchEvents,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
  };
}
