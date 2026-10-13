async function run() {
  try {
    const res = await fetch('http://127.0.0.1:5001/api/calendar');
    const events = await res.json();
    if (res.ok) {
      const juneEvents = events.filter(e => e.start && e.start.startsWith('2026-06'));
      console.log(juneEvents.map(e => ({ title: e.title, start: e.start })));
    } else {
      console.log("Error status:", res.status);
      console.log("Error data:", events);
    }
  } catch (err) {
    console.log("Fetch error:", err.message);
  }
}

run();
