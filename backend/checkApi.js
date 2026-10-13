import http from 'http';

http.get('http://localhost:5001/api/calendar', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const events = JSON.parse(data);
    const juneEvents = events.filter(e => e.start && e.start.startsWith('2026-06'));
    console.log(juneEvents.map(e => ({ title: e.title, start: e.start })));
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
