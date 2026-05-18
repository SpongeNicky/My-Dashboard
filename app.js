// ========================
// WEATHER
// ========================
const API_KEY = 'abc077c8a51025d5a113bd45e7a6d497';
const CITY = 'Melbourne,AU';

async function getWeather() {
    const weatherContent = document.getElementById('weather-content');
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&cnt=8`;
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = await response.json();
        const current     = data.list[0];
        const temp        = Math.round(current.main.temp);
        const feelsLike   = Math.round(current.main.feels_like);
        const description = current.weather[0].description;
        const humidity    = current.main.humidity;
        const wind        = Math.round(current.wind.speed * 3.6);
        const minTemp     = Math.round(Math.min(...data.list.map(e => e.main.temp_min)));
        const maxTemp     = Math.round(Math.max(...data.list.map(e => e.main.temp_max)));
        const rainChance  = Math.round(Math.max(...data.list.map(e => e.pop || 0)) * 100);
        weatherContent.innerHTML = `
            <div class="weather-temp">${temp}°C</div>
            <div class="weather-description">${description}</div>
            <div class="weather-minmax">↓ ${minTemp}°C &nbsp;&nbsp; ↑ ${maxTemp}°C</div>
            <div class="weather-details">
                <div class="weather-detail-item">Feels like: <span>${feelsLike}°C</span></div>
                <div class="weather-detail-item">Humidity: <span>${humidity}%</span></div>
                <div class="weather-detail-item">Wind: <span>${wind} km/h</span></div>
                <div class="weather-detail-item">Rain: <span>${rainChance}%</span></div>
            </div>
        `;
    } catch (error) {
        weatherContent.innerHTML = `<p class="error">Could not load weather.</p>`;
    }
}

// ========================
// MANCHESTER UNITED
// ========================
const MANUTD_KEY   = '66';
const MANUTD_BADGE = 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg';

async function getManUtd() {
    const content = document.getElementById('manutd-content');
    try {
        const today    = new Date().toISOString().split('T')[0];
        const response = await fetch(
            `https://api.football-data.org/v4/teams/66/matches?dateFrom=${today}&limit=3`,
            { headers: { 'X-Auth-Token': MANUTD_KEY } }
        );
        const data = await response.json();

        const badgeHTML = `
            <div class="manutd-badge-row">
                <img src="${MANUTD_BADGE}" alt="Manchester United Badge" class="team-badge">
            </div>
        `;

        if (!data.matches || data.matches.length === 0) {
            content.innerHTML = `
                ${badgeHTML}
                <div class="match-section">
                    <div class="match-label">NEXT MATCH</div>
                    <div class="match-tbc">No fixtures scheduled yet — check back soon</div>
                </div>
            `;
            return;
        }

        const match  = data.matches[0];
        const home   = match.homeTeam.name;
        const away   = match.awayTeam.name;
        const league = match.competition.name;
        const dt     = new Date(match.utcDate);
        const melbourneTime = dt.toLocaleString('en-AU', {
            timeZone: 'Australia/Melbourne',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        content.innerHTML = `
            ${badgeHTML}
            <div class="match-section">
                <div class="match-label">NEXT MATCH</div>
                <div class="match-league">${league}</div>
                <div class="match-teams">${home} vs ${away}</div>
                <div class="match-time">🕐 ${melbourneTime} (Melb time)</div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<p class="error">Could not load Man United fixtures.</p>`;
    }
}

// ========================
// FINANCE HELPERS
// ========================
const AV_KEY = 'Z7JLBIQRL23AJ2AT';

// Cache resets automatically each new day — no manual clearing needed
const TODAY = new Date().toDateString();

function getCache(key) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const { date, data } = JSON.parse(item);
        if (date !== TODAY) return null; // New day = fetch fresh data
        return data;
    } catch { return null; }
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ date: TODAY, data }));
    } catch {}
}

function filterDays(entries, days = 130) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter(([date]) => new Date(date) >= cutoff);
}

function createChart(canvasId, labels, values) {
    const step        = Math.max(1, Math.floor(labels.length / 26));
    const chartLabels = labels.filter((_, i) => i % step === 0 || i === labels.length - 1);
    const chartValues = values.filter((_, i) => i % step === 0 || i === values.length - 1);

    // Track shown months to prevent duplicates like "Jan Jan"
    const shownMonths = new Set();

    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartValues,
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        color: '#c9a227',
                        font: { size: 10 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 7,
                        callback: function(value) {
                            const label     = this.getLabelForValue(value);
                            const monthName = new Date(label).toLocaleString('default', { month: 'short' });
                            if (shownMonths.has(monthName)) return null;
                            shownMonths.add(monthName);
                            return monthName;
                        }
                    },
                    grid: { display: false }
                },
                y: {
                    display: true,
                    position: 'right',
                    ticks: {
                        color: '#c9a227',
                        font: { size: 10 },
                        maxTicksLimit: 4,
                        callback: value => value.toFixed(2)
                    },
                    grid: { color: 'rgba(255, 215, 0, 0.08)' }
                }
            },
            animation: false
        }
    });
}

function changeTag(latest, prev) {
    const change = ((latest - prev) / prev * 100).toFixed(2);
    const cls  = change >= 0 ? 'change-up' : 'change-down';
    const sign = change >= 0 ? '+' : '';
    return `<span class="${cls}">${sign}${change}%</span>`;
}

// ========================
// S&P 500
// ========================
function displaySPY(labels, values) {
    const latest = values[values.length - 1];
    const prev   = values[values.length - 2];
    document.getElementById('spy-value').innerHTML = `$${latest.toFixed(2)} ${changeTag(latest, prev)}`;
    createChart('spy-chart', labels, values);
}

async function getSPY() {
    const cached = getCache('spy');
    if (cached) { displaySPY(cached.labels, cached.values); return; }
    try {
        const res  = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=compact&apikey=${AV_KEY}`);
        const data = await res.json();
        if (!data['Time Series (Daily)']) throw new Error();
        let entries = Object.entries(data['Time Series (Daily)']).sort(([a], [b]) => new Date(a) - new Date(b));
        entries = filterDays(entries);
        const labels = entries.map(([d]) => d);
        const values = entries.map(([, v]) => parseFloat(v['4. close']));
        setCache('spy', { labels, values });
        displaySPY(labels, values);
    } catch {
        document.getElementById('spy-value').innerHTML = `<span class="error">Error loading</span>`;
    }
}

// ========================
// AUD / USD
// ========================
function displayAUDUSD(labels, values) {
    const latest = values[values.length - 1];
    const prev   = values[values.length - 2];
    document.getElementById('audusd-value').innerHTML = `${latest.toFixed(4)} ${changeTag(latest, prev)}`;
    createChart('audusd-chart', labels, values);
}

async function getAUDUSD() {
    const cached = getCache('audusd');
    if (cached) { displayAUDUSD(cached.labels, cached.values); return; }
    try {
        const res  = await fetch(`https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=AUD&to_symbol=USD&outputsize=compact&apikey=${AV_KEY}`);
        const data = await res.json();
        if (!data['Time Series FX (Daily)']) throw new Error();
        let entries = Object.entries(data['Time Series FX (Daily)']).sort(([a], [b]) => new Date(a) - new Date(b));
        entries = filterDays(entries);
        const labels = entries.map(([d]) => d);
        const values = entries.map(([, v]) => parseFloat(v['4. close']));
        setCache('audusd', { labels, values });
        displayAUDUSD(labels, values);
    } catch {
        document.getElementById('audusd-value').innerHTML = `<span class="error">Error loading</span>`;
    }
}

// ========================
// BRENT CRUDE
// ========================
function displayBrent(labels, values) {
    const latest = values[values.length - 1];
    const prev   = values[values.length - 2];
    document.getElementById('brent-value').innerHTML = `$${latest.toFixed(2)} ${changeTag(latest, prev)}`;
    createChart('brent-chart', labels, values);
}

async function getBrent() {
    const cached = getCache('brent');
    if (cached) { displayBrent(cached.labels, cached.values); return; }
    try {
        const res  = await fetch(`https://www.alphavantage.co/query?function=BRENT&interval=daily&apikey=${AV_KEY}`);
        const data = await res.json();
        if (!data.data) throw new Error();
        let entries = data.data
            .filter(d => d.value !== '.')
            .map(d => [d.date, d.value])
            .sort(([a], [b]) => new Date(a) - new Date(b));
        entries = filterDays(entries);
        const labels = entries.map(([d]) => d);
        const values = entries.map(([, v]) => parseFloat(v));
        setCache('brent', { labels, values });
        displayBrent(labels, values);
    } catch {
        document.getElementById('brent-value').innerHTML = `<span class="error">Error loading</span>`;
    }
}

// ========================
// RUN EVERYTHING
// ========================
getWeather();
getManUtd();

const spyCached   = !!getCache('spy');
const audCached   = !!getCache('audusd');
const brentCached = !!getCache('brent');

getSPY();
let nextDelay = spyCached ? 0 : 13000;
setTimeout(getAUDUSD, audCached   ? 0 : nextDelay);
nextDelay += audCached ? 0 : 13000;
setTimeout(getBrent,  brentCached ? 0 : nextDelay);