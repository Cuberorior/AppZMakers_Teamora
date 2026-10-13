import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY || 'AIzaSyBgKbRFlKWNWt6wi9YoiAxm5DEnsieSsoQ';

const COUNTRY_CALENDARS = {
  'Sri Lanka': 'en.lk#holiday@group.v.calendar.google.com',
  'United States': 'en.usa#holiday@group.v.calendar.google.com',
  'USA': 'en.usa#holiday@group.v.calendar.google.com',
  'United Kingdom': 'en.uk#holiday@group.v.calendar.google.com',
  'UK': 'en.uk#holiday@group.v.calendar.google.com',
  'Australia': 'en.australian#holiday@group.v.calendar.google.com',
  'Canada': 'en.canadian#holiday@group.v.calendar.google.com',
};

const holidayCache = {};

/**
 * Fetch official holidays from public Google Calendars
 */
export const fetchHolidaysFromGoogle = async (countryName) => {
  const rawCountry = String(countryName || 'Sri Lanka').trim();
  let normalized = rawCountry.toLowerCase();

  const currentYear = new Date().getFullYear();
  const cacheKey = `${normalized}_${currentYear}`;

  if (holidayCache[cacheKey]) {
    return holidayCache[cacheKey];
  }

  // Map common aliases
  if (normalized === 'us' || normalized === 'united states of america') {
    normalized = 'usa';
  } else if (normalized === 'united states') {
    normalized = 'usa';
  } else if (normalized === 'gb' || normalized === 'united kingdom of great britain and northern ireland') {
    normalized = 'uk';
  } else if (normalized === 'united kingdom') {
    normalized = 'uk';
  } else if (normalized === 'lk') {
    normalized = 'sri lanka';
  } else if (normalized === 'ca') {
    normalized = 'canada';
  }

  // Find key in COUNTRY_CALENDARS case-insensitively
  const matchedKey = Object.keys(COUNTRY_CALENDARS).find(
    (k) => k.toLowerCase() === normalized
  );

  const calendarId = matchedKey ? COUNTRY_CALENDARS[matchedKey] : COUNTRY_CALENDARS['Sri Lanka'];
  
  if (!calendarId) {
    throw new Error(`No public holiday calendar mapped for country: ${countryName}`);
  }

  const timeMin = `${currentYear - 1}-01-01T00:00:00Z`;
  const timeMax = `${currentYear + 1}-12-31T23:59:59Z`;

  const encodedCalendarId = encodeURIComponent(calendarId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?key=${GOOGLE_API_KEY}&maxResults=250&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar API Error: ${errorText}`);
  }

  const data = await res.json();
  const holidays = (data.items || []).map((item) => {
    const start = item.start?.date || item.start?.dateTime?.split('T')[0];
    let end = item.end?.date || item.end?.dateTime?.split('T')[0];

    // Subtract 1 day from end date for all-day events since Google API's end date is exclusive
    if (item.start?.date && item.end?.date) {
      try {
        const endDateObj = new Date(item.end.date);
        endDateObj.setDate(endDateObj.getDate() - 1);
        end = endDateObj.toISOString().split('T')[0];
      } catch (e) {
        console.error('Failed to parse holiday end date:', e);
      }
    }

    return {
      title: item.summary,
      description: item.description || 'Official Holiday',
      start,
      end: end || start,
      type: 'holiday',
      googleEventId: item.id,
    };
  });

  holidayCache[cacheKey] = holidays;
  return holidays;
};

/**
 * Creates an event in Google Calendar (Requires OAuth or Service Account).
 * If not fully configured, it mocks the response and returns a generated Google Event ID.
 */
export const createGoogleCalendarEvent = async (eventData, calendarName = 'Global') => {
  try {
    // If you have a Google Workspace Service Account or OAuth client, you'd request an access token here.
    // Since we only have the public API key, we mock the write request.
    // If process.env.GOOGLE_OAUTH_ACCESS_TOKEN exists, we would make the POST request.
    if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
      const calendarId = COUNTRY_CALENDARS[calendarName] || 'primary';
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GOOGLE_OAUTH_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: { date: eventData.start },
          end: { date: eventData.end },
        }),
      });
      if (res.ok) {
        const item = await res.json();
        return item.id;
      }
    }
  } catch (err) {
    console.error('Failed to sync event to Google Calendar API:', err.message);
  }

  // Fallback / Mock Event ID
  return `mock_g_event_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

/**
 * Updates an event in Google Calendar
 */
export const updateGoogleCalendarEvent = async (googleEventId, eventData, calendarName = 'Global') => {
  if (!googleEventId || googleEventId.startsWith('mock_')) return;
  try {
    if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
      const calendarId = COUNTRY_CALENDARS[calendarName] || 'primary';
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.GOOGLE_OAUTH_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: { date: eventData.start },
          end: { date: eventData.end },
        }),
      });
    }
  } catch (err) {
    console.error('Failed to update event in Google Calendar API:', err.message);
  }
};

/**
 * Deletes an event from Google Calendar
 */
export const deleteGoogleCalendarEvent = async (googleEventId, calendarName = 'Global') => {
  if (!googleEventId || googleEventId.startsWith('mock_')) return;
  try {
    if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
      const calendarId = COUNTRY_CALENDARS[calendarName] || 'primary';
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.GOOGLE_OAUTH_ACCESS_TOKEN}`,
        },
      });
    }
  } catch (err) {
    console.error('Failed to delete event from Google Calendar API:', err.message);
  }
};
