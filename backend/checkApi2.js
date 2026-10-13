import axios from 'axios';

async function run() {
  try {
    const res = await axios.get('http://localhost:5001/api/calendar');
    const events = res.data;
    const juneEvents = events.filter(e => e.start && e.start.startsWith('2026-06'));
    console.log(juneEvents.map(e => ({ title: e.title, start: e.start })));
  } catch (err) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
  }
}

run();
