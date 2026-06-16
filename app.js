// ===== FLOATING DECORATIONS =====
(function createFloaties() {
  const emojis = ['🐴','🐎','🏇','🌸','⭐','🌟','🍀','🌺','🦄','🌈'];
  const container = document.getElementById('floaties');
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'floatie';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (15 + Math.random() * 20) + 's';
    el.style.animationDelay = (Math.random() * 20) + 's';
    el.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    container.appendChild(el);
  }
})();

// ===== CLOCK =====
const DAYS_NL  = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('time').textContent = `${hh}:${mm}:${ss}`;
  const day   = DAYS_NL[now.getDay()];
  const date  = now.getDate();
  const month = MONTHS_NL[now.getMonth()];
  const year  = now.getFullYear();
  document.getElementById('date').textContent = `${day} ${date} ${month} ${year}`;
}
setInterval(updateClock, 1000);
updateClock();

// ===== AUTO-REFRESH / RESYNC =====
// Op een Home Assistant kiosk/tablet of in een achtergrond-tab knijpt de browser
// setInterval-timers af (of pauzeert ze) tijdens slaapstand. Daardoor blijft de
// klok hangen tot je handmatig ververst. We synchroniseren daarom alles opnieuw
// zodra de pagina weer zichtbaar/actief wordt, plus periodiek als vangnet.
function resyncDashboard() {
  updateClock();
  updateCountdown();
  renderHolidayCalendar();
  fetchWeather();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resyncDashboard();
});
window.addEventListener('focus', resyncDashboard);
window.addEventListener('pageshow', resyncDashboard);

// Vangnet: dwing elke minuut een volledige resync af, zodat de tijd ook bij
// langdurig afgeknepen timers nooit ver wegloopt.
setInterval(resyncDashboard, 60000);

// ===== SCHOOL HOLIDAYS — School de Vaart, Ter Aar (Zuid-Holland) =====
// Official Dutch school holidays for region Zuid-Holland 2025-2026
const HOLIDAYS = [
  { name: 'Herfstvakantie',    emoji: '🍂', start: new Date('2025-10-25'), end: new Date('2025-11-02'), year: '2025-2026' },
  { name: 'Kerstvakantie',     emoji: '🎄', start: new Date('2025-12-20'), end: new Date('2026-01-04'), year: '2025-2026' },
  { name: 'Voorjaarsvakantie', emoji: '🌷', start: new Date('2026-02-28'), end: new Date('2026-03-08'), year: '2025-2026' },
  { name: 'Meivakantie',       emoji: '🌸', start: new Date('2026-04-25'), end: new Date('2026-05-10'), year: '2025-2026' },
  { name: 'Zomervakantie',     emoji: '☀️',  start: new Date('2026-07-11'), end: new Date('2026-08-23'), year: '2025-2026' },
];

function formatDate(d) {
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}
function formatDateFull(d) {
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

function getHolidayStatus(holiday, now) {
  const startDay = new Date(holiday.start); startDay.setHours(0,0,0,0);
  const endDay   = new Date(holiday.end);   endDay.setHours(23,59,59,999);
  if (now >= startDay && now <= endDay) return 'current';
  if (now < startDay) return 'upcoming';
  return 'past';
}

function renderHolidayCalendar() {
  const now = new Date();
  const grid = document.getElementById('holidays-grid');
  let nextFound = false;
  grid.innerHTML = '';
  HOLIDAYS.forEach(h => {
    const status = getHolidayStatus(h, now);
    const isNext = (status === 'upcoming' && !nextFound);
    if (isNext) nextFound = true;

    const div = document.createElement('div');
    div.className = 'holiday-item ' + (isNext ? 'next' : status);

    let badge = '';
    if (status === 'current') badge = '<div class="hi-badge">🎉 NU VAKANTIE!</div>';
    else if (isNext) badge = '<div class="hi-badge next-badge">⬅ Volgende vakantie!</div>';
    else if (status === 'past') badge = '<div class="hi-badge">✓ Geweest</div>';

    div.innerHTML = `
      <div class="hi-emoji">${h.emoji}</div>
      <div class="hi-name">${h.name}</div>
      <div class="hi-dates">${formatDate(h.start)} t/m ${formatDateFull(h.end)}</div>
      ${badge}
    `;
    grid.appendChild(div);
  });
}
renderHolidayCalendar();

// ===== COUNTDOWN to next holiday =====
function getNextHoliday() {
  const now = new Date();
  for (const h of HOLIDAYS) {
    const startDay = new Date(h.start); startDay.setHours(0,0,0,0);
    const endDay   = new Date(h.end);   endDay.setHours(23,59,59,999);
    if (now <= endDay) return h;
  }
  return HOLIDAYS[HOLIDAYS.length - 1];
}

function updateCountdown() {
  const now  = new Date();
  const next = getNextHoliday();
  const startDay = new Date(next.start); startDay.setHours(0,0,0,0);
  const endDay   = new Date(next.end);   endDay.setHours(23,59,59,999);

  document.getElementById('holiday-name').textContent = next.emoji + ' ' + next.name;
  document.getElementById('holiday-date').textContent =
    formatDate(next.start) + ' t/m ' + formatDateFull(next.end);

  let target = startDay;
  let isCurrent = (now >= startDay && now <= endDay);
  if (isCurrent) target = new Date(endDay.getTime() + 1); // count down to end

  if (isCurrent) {
    document.getElementById('holiday-name').textContent = '🎉 NU VAKANTIE! 🎉';
  }

  const diff = target - now;
  if (diff <= 0) {
    document.getElementById('cd-days').textContent = '0';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent = '00';
    document.getElementById('cd-secs').textContent = '00';
    return;
  }

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  document.getElementById('cd-days').textContent  = days;
  document.getElementById('cd-hours').textContent = String(hours).padStart(2,'0');
  document.getElementById('cd-mins').textContent  = String(mins).padStart(2,'0');
  document.getElementById('cd-secs').textContent  = String(secs).padStart(2,'0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ===== HORSE FACTS =====
const HORSE_FACTS = [
  "🐴 Paarden slapen zowel staand als liggend! Ze kunnen zelfs staand dutten.",
  "👁️ Paarden hebben de grootste ogen van alle landdieren.",
  "❤️ Het hart van een paard weegt gemiddeld 4,5 kilo!",
  "👃 Paarden kunnen niet door hun mond ademen, alleen door hun neus.",
  "🏃 Het snelste paard ooit reed 88 km/u — sneller dan een auto in de stad!",
  "🦷 Je kunt de leeftijd van een paard raden door naar zijn tanden te kijken.",
  "🧠 Paarden herkennen menselijke gezichtsuitdrukkingen en emoties.",
  "💤 Paarden hebben maar 2-3 uur slaap per dag nodig.",
  "🌍 Er zijn meer dan 350 verschillende paardenrassen op de wereld.",
  "👂 Paarden kunnen hun oren 180 graden draaien om geluiden te horen.",
  "🍎 Een volwassen paard eet elke dag 7-11 kilo gras of hooi.",
  "🐣 Een veulen kan al na een uur lopen en rennen!",
  "🌈 Schimmels zijn paarden die van kleur veranderen naarmate ze ouder worden.",
  "🏇 De Arabier is een van de oudste paardenrassen — al 4.500 jaar oud!",
  "💨 Een paard kan per dag wel 60 liter water drinken.",
  "🎵 Paarden communiceren via geluid, lichaamstaal en geur.",
  "🦴 Paarden hebben slechts één teen per hoof — hun hoef is eigenlijk een teen!",
  "🌙 Paarden die overdag buiten lopen worden 's nachts rustiger en slaperiger.",
  "📏 Het kleinste paard ter wereld is de Falabella, amper 76 cm groot!",
  "💪 Paarden zijn zo sterk dat ze wel 900 kg kunnen trekken.",
];

let lastFactIndex = -1;
function newFact() {
  let idx;
  do { idx = Math.floor(Math.random() * HORSE_FACTS.length); } while (idx === lastFactIndex);
  lastFactIndex = idx;
  document.getElementById('horse-fact').textContent = HORSE_FACTS[idx];
}
newFact();

// ===== WEATHER (Open-Meteo, gratis, geen API-key nodig) =====
// Ter Aar coördinaten: 52.1667° N, 4.7167° E
async function fetchWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.1667&longitude=4.7167&current=temperature_2m,weathercode,windspeed_10m,precipitation_probability&timezone=Europe/Amsterdam&wind_speed_unit=kmh';
    const res  = await fetch(url);
    const data = await res.json();
    const c = data.current;

    const temp  = Math.round(c.temperature_2m);
    const wind  = Math.round(c.windspeed_10m);
    const rain  = c.precipitation_probability ?? 0;
    const code  = c.weathercode;

    document.getElementById('weather-temp').textContent = temp + '°C';
    document.getElementById('weather-wind').textContent = wind + ' km/h';
    document.getElementById('weather-rain').textContent = rain + '%';
    document.getElementById('weather-icon').textContent  = weatherCodeToEmoji(code);
    document.getElementById('weather-desc').textContent  = weatherCodeToDesc(code);

    const ridingDiv = document.getElementById('weather-riding');
    if (temp >= 5 && wind < 40 && rain < 60 && code < 60) {
      ridingDiv.className = 'weather-riding riding-yes';
      ridingDiv.textContent = '🐴 Goed rijweer vandaag!';
    } else {
      ridingDiv.className = 'weather-riding riding-no';
      ridingDiv.textContent = '🧥 Pas op met rijden vandaag!';
    }
  } catch (e) {
    document.getElementById('weather-desc').textContent = 'Kan weer niet laden';
  }
}

function weatherCodeToEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 2)  return '🌤️';
  if (code <= 3)  return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 59) return '🌦️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 84) return '🌨️';
  if (code <= 94) return '⛈️';
  return '🌩️';
}
function weatherCodeToDesc(code) {
  if (code === 0)  return 'Heldere hemel';
  if (code === 1)  return 'Overwegend helder';
  if (code === 2)  return 'Gedeeltelijk bewolkt';
  if (code === 3)  return 'Bewolkt';
  if (code <= 49)  return 'Mistig';
  if (code <= 59)  return 'Lichte motregen';
  if (code <= 69)  return 'Regen';
  if (code <= 79)  return 'Sneeuw';
  if (code <= 84)  return 'Sneeuwbuien';
  if (code <= 94)  return 'Onweer';
  return 'Zwaar onweer';
}
fetchWeather();
setInterval(fetchWeather, 600000); // refresh elke 10 min

// ===== NEWS via RSS2JSON proxy =====
const NEWS_FEEDS = {
  hoefslag: {
    url: 'https://www.hoefslag.nl/feed/',
    color: '#ff6eb4',
  },
  horses: {
    url: 'https://www.horses.nl/feed/',
    color: '#b96fd4',
  },
  knhs: {
    url: 'https://www.knhs.nl/feed/',
    color: '#3fc9c9',
  },
};

let currentTab = 'hoefslag';

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  loadNews(tab);
}

async function loadNews(feedKey) {
  const list = document.getElementById('news-list');
  list.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  const feed = NEWS_FEEDS[feedKey];
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=8`;

  try {
    const res  = await fetch(apiUrl);
    const data = await res.json();
    if (data.status !== 'ok' || !data.items?.length) throw new Error('no items');

    list.innerHTML = '';
    data.items.forEach(item => {
      const a = document.createElement('a');
      a.className = 'news-item';
      a.href   = item.link;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
      a.style.borderLeftColor = feed.color;

      const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      a.innerHTML = `
        <div class="news-item-title">${escapeHtml(item.title)}</div>
        ${pubDate ? `<div class="news-item-date">📅 ${pubDate}</div>` : ''}
      `;
      list.appendChild(a);
    });
  } catch (e) {
    list.innerHTML = `<div class="news-error">📡 Nieuws even niet beschikbaar.<br>Probeer een andere bron of kom later terug!</div>`;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadNews('hoefslag');

// ===== HORSE QUIZ =====
const QUIZ_QUESTIONS = [
  { q: "Hoe oud kan een paard worden?", options: ["10-15 jaar","25-35 jaar","50-60 jaar","5-8 jaar"], answer: 1 },
  { q: "Hoe noem je een vrouwelijk paard?", options: ["Hengst","Veulen","Merrie","Ruin"], answer: 2 },
  { q: "Hoe heet het jonkie van een paard?", options: ["Lam","Kalf","Veulen","Welp"], answer: 2 },
  { q: "Welk ras is het snelste paard ter wereld?", options: ["Friesian","Arabier","Thoroughbred","Shetlander"], answer: 2 },
  { q: "Hoeveel tanden heeft een volwassen hengst?", options: ["24","36","40","44"], answer: 2 },
  { q: "Wat eet een paard NIET?", options: ["Hooi","Wortelen","Appels","Vlees"], answer: 3 },
  { q: "Welk land heeft de meeste paarden?", options: ["Nederland","Amerika","China","Australië"], answer: 1 },
  { q: "Hoe heet de loopstijl tussen stap en galop?", options: ["Sprint","Draf","Ren","Trot"], answer: 1 },
  { q: "Wat zijn paardenhoeven gemaakt van?", options: ["Bot","Hout","Keratine","Ijzer"], answer: 2 },
  { q: "Welk paardenras is afkomstig uit Nederland?", options: ["Mustang","KWPN","Lipizzaner","Appaloosa"], answer: 1 },
  { q: "Hoeveel kilo weegt een gemiddeld paard?", options: ["100-200 kg","300-400 kg","400-600 kg","700-900 kg"], answer: 2 },
  { q: "Wat noem je een gecastreerde hengst?", options: ["Merrie","Veulen","Ruin","Schimmel"], answer: 2 },
  { q: "Welke kleur is een Fries paard?", options: ["Wit","Zwart","Bruin","Gevlekt"], answer: 1 },
  { q: "Hoe heet het eten dat paarden 's winters krijgen?", options: ["Stro","Hooi","Brokken","Mash"], answer: 1 },
  { q: "Hoeveel uur slaapt een paard per dag?", options: ["2-3 uur","8 uur","12 uur","6 uur"], answer: 0 },
];

let quizScore = 0;
let quizIndex = 0;
let quizAnswered = false;
let shuffledQuestions = [];

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function startQuiz() {
  shuffledQuestions = shuffleArray(QUIZ_QUESTIONS);
  quizIndex = 0;
  quizScore = 0;
  document.getElementById('quiz-score').textContent = quizScore;
  loadQuestion();
}

function loadQuestion() {
  if (quizIndex >= shuffledQuestions.length) {
    quizIndex = 0;
    shuffledQuestions = shuffleArray(QUIZ_QUESTIONS);
  }
  quizAnswered = false;
  const q = shuffledQuestions[quizIndex];
  document.getElementById('quiz-question').textContent = '❓ ' + q.q;
  document.getElementById('quiz-result').textContent = '';

  const opts = document.getElementById('quiz-options');
  opts.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-btn';
    btn.textContent = opt;
    btn.onclick = () => answerQuiz(i, q.answer, btn);
    opts.appendChild(btn);
  });
}

function answerQuiz(chosen, correct, btn) {
  if (quizAnswered) return;
  quizAnswered = true;

  const btns = document.querySelectorAll('.quiz-btn');
  btns.forEach(b => b.disabled = true);
  btns[correct].classList.add('correct');

  if (chosen === correct) {
    quizScore++;
    document.getElementById('quiz-score').textContent = quizScore;
    document.getElementById('quiz-result').textContent = '🎉 Super goed! Dat klopt!';
  } else {
    btn.classList.add('wrong');
    document.getElementById('quiz-result').textContent = '😅 Bijna! Het juiste antwoord staat groen.';
  }

  quizIndex++;
  setTimeout(loadQuestion, 2000);
}

startQuiz();

// ===== HORSE BREEDS =====
const BREEDS = [
  {
    name: 'Fries Paard',
    emoji: '🖤',
    info: 'Het Friese paard is een prachtig zwart paard uit Friesland. Ze hebben een lange, golvende manen en een hoge knieactie. Ze zijn vriendelijk en intelligent!',
  },
  {
    name: 'KWPN (Dutch Warmblood)',
    emoji: '🇳🇱',
    info: 'Het KWPN is het Nederlandse rijpaard bij uitstek! Heel populair bij dressuur en springen. Veel Nederlandse olympische ruiters rijden op een KWPN!',
  },
  {
    name: 'Arabier',
    emoji: '🌙',
    info: 'Een van de oudste paardenrassen ter wereld, al meer dan 4.500 jaar! Ze zijn heel snel en hebben een uniek gewelfd hoofd. Ze komen oorspronkelijk uit Arabië.',
  },
  {
    name: 'Shetlander',
    emoji: '🐾',
    info: 'Het kleinste paardenras van het Britse eiland Shetland. Ze zijn klein maar heel sterk voor hun grootte. Super schattig met hun dikke manen!',
  },
  {
    name: 'Appaloosa',
    emoji: '🎨',
    info: 'De Appaloosa heeft een prachtig gevlekt vacht in allerlei kleuren. Dit ras komt van de Nez Perce Indianen uit Amerika. Elk paard heeft een uniek patroon!',
  },
  {
    name: 'Lipizzaner',
    emoji: '⚪',
    info: 'De Lipizzaner staat bekend om de "Haute École" dressuur in Wenen. Ze worden als veulen donker geboren maar worden wit als ze ouder worden!',
  },
  {
    name: 'Haflinger',
    emoji: '🌼',
    info: 'De Haflinger is een prachtig goudgeel paard met witte manen uit de Alpen. Ze zijn super vriendelijk en geschikt voor kinderen. Altijd vrolijk!',
  },
  {
    name: 'Mustang',
    emoji: '🏜️',
    info: 'De Mustang is een wild paard dat vrij rondloopt in Amerika. Ze leven in kuddes in de woestijn en berggebieden. Heel stoer en vrijheidslievend!',
  },
  {
    name: 'Andalusiër',
    emoji: '💃',
    info: 'De Andalusiër komt uit Spanje en is een van de mooiste paardenrassen. Ze zijn beroemd om hun elegante bewegingen in de dressuur. Heel trots en gracieus!',
  },
  {
    name: 'Thoroughbred',
    emoji: '🏆',
    info: 'De Thoroughbred is het snelste paardenras ter wereld en wordt gebruikt voor renpaardenraces. Ze kunnen wel 70 km/u rennen!',
  },
];

let currentBreed = 0;

function newBreed() {
  let idx;
  do { idx = Math.floor(Math.random() * BREEDS.length); } while (idx === currentBreed);
  currentBreed = idx;
  const b = BREEDS[idx];
  document.getElementById('breed-name').textContent = b.name;
  document.getElementById('breed-emoji').textContent = b.emoji;
  document.getElementById('breed-info').textContent  = b.info;
}
newBreed();

// ===== FUN QUOTES rotation =====
const QUOTES = [
  '"Een dag zonder paard rijden is een dag niet geleefd!"',
  '"Paarden zijn de engelen van de aarde."',
  '"Het buitenleven begint bij de stal."',
  '"Er is niets beters dan de geur van een stal!"',
  '"Een paard is een vriend voor het leven."',
  '"Paarden begrijpen je altijd, ook als je niks zegt."',
  '"Rijden is niet alleen een sport, het is een passie!"',
  '"Wie paarden liefheeft, heeft altijd vrienden."',
];
let quoteIdx = 0;
function rotateQuote() {
  quoteIdx = (quoteIdx + 1) % QUOTES.length;
  document.getElementById('fun-quote').textContent = QUOTES[quoteIdx];
}
setInterval(rotateQuote, 8000);
