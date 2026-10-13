export const formatDecimalHours = (hoursDec) => {
  if (hoursDec === null || hoursDec === undefined || hoursDec === '' || isNaN(hoursDec)) return '—';
  const val = Number(hoursDec);
  if (val <= 0) return '—';

  const totalMinutes = Math.round(val * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs} h ${mins} min`;
  } else if (hrs > 0) {
    return `${hrs} h`;
  } else {
    return `${mins} min`;
  }
};

export const formatBreakMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '' || isNaN(minutes)) return '—';
  const val = Number(minutes);
  if (val <= 0) return '—';

  const hrs = Math.floor(val / 60);
  const mins = val % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs} h ${mins} min`;
  } else if (hrs > 0) {
    return `${hrs} h`;
  } else {
    return `${mins} min`;
  }
};
export const getDisplayDate = (baseDate, timeStr, shift = 'morning') => {
  if (!timeStr) return baseDate;
  if (shift !== 'night') return baseDate;
  const hours = parseInt(timeStr.split(':')[0], 10);
  if (hours < 12) {
    const [y, m, d] = baseDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }
  return baseDate;
};
