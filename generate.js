const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const SITE_URL = ''; // e.g. 'https://nuruwire.news' (enables canonical + share URLs)
const SOCIALS = [ // <-- replace with your real profile URLs
  { n: 'X', u: 'https://x.com/nuruwire' },
  { n: 'Facebook', u: 'https://facebook.com/nuruwire' },
  { n: 'Instagram', u: 'https://instagram.com/nuruwire' },
  { n: 'LinkedIn', u: 'https://linkedin.com/company/nuruwire' },
  { n: 'YouTube', u: 'https://youtube.com/@nuruwire' },
  { n: 'WhatsApp', u: 'https://whatsapp.com/channel/nuruwire' }
];
const ICONS = {
  X: '<path fill="currentColor" stroke="none" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
  Facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  Instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
  LinkedIn: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  YouTube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><path d="M9.75 15.02 15.5 11.75 9.75 8.48z"/>',
  WhatsApp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>'
};
const PULSE = "<path d='M8 34h12l6-16 10 30 7-22 4 8h9' fill='none' stroke='#fff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/>";
const FAVICON_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#8b0000'/>${PULSE}</svg>`;

const TOPICS = {
  'Technology': /\btech|startup|\bAI\b|digital|fintech|software|mobile|cyber|innovation|app\b/i,
  'Energy & Climate': /energy|\boil\b|power|solar|climate|electric|fuel|mining|\bgas\b/i,
  'Agriculture': /farm|agric|crop|coffee|harvest|livestock|food/i,
  'Health': /health|hospital|disease|vaccine|malaria|medical/i,
  'Business': /business|econom|bank|invest|trade|market|\bsme|revenue|shilling|naira|cedi|inflation|budget|tax|finance/i,
  'Politics': /president|parliament|election|minister|government|court|police|opposition/i
};
function topicOf(a) {
  const t = a.title + ' ' + a.snippet;
  for (const [k, r] of Object.entries(TOPICS)) if (r.test(t)) return k;
  return ['Business', 'Technology'].includes(a.category) ? a.category : 'General';
}

const parser = new Parser({
  timeout: 15000,
  customFields: { item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumb']] },
  headers: { 'User-Agent': 'NuruWire/6.0 (Development News Aggregator)' }
});

// ============================================================
// FEEDS: Expanded with Uganda Business
// ============================================================
const FEEDS = [
  // SMEs & Business Focus
  { url: 'https://www.premiumtimesng.com/feed', name: 'Premium Times', category: 'Business', country: 'Nigeria' },
  { url: 'https://disruptafrica.com/feed/', name: 'Disrupt Africa', category: 'Technology', country: 'Pan-African' },
  { url: 'https://www.ghanabusinessnews.com/feed/', name: 'Ghana Business News', category: 'Business', country: 'Ghana' },
  { url: 'https://www.pmldaily.com/feed/', name: 'PM Live Daily', category: 'Business', country: 'Uganda' },
  
  // Country Specific News
  { url: 'https://www.kenyanews.go.ke/feed/', name: 'Kenya News Agency', category: 'Kenya', country: 'Kenya' },
  { url: 'https://capitalfm.africa/news/feed/', name: 'Capital News', category: 'Kenya', country: 'Kenya' },
  { url: 'https://www.independent.co.ug/feed/', name: 'The Independent Uganda', category: 'Uganda', country: 'Uganda' },
  { url: 'https://guardian.ng/feed/', name: 'Guardian Nigeria', category: 'Nigeria', country: 'Nigeria' },
  
  // General Pan-African Business
  { url: 'https://www.theeastafrican.co.ke/service/rss/tea/1289142/feed.rss', name: 'The East African', category: 'Business', country: 'East Africa' },
  { url: 'https://techcabal.com/feed/', name: 'TechCabal', category: 'Technology', country: 'Pan-African' },
  { url: 'https://techpoint.africa/feed/', name: 'Techpoint Africa', category: 'Technology', country: 'Nigeria' },
  { url: 'https://punchng.com/feed/', name: 'Punch', category: 'Nigeria', country: 'Nigeria' },
  { url: 'https://citinewsroom.com/feed/', name: 'Citi Newsroom', category: 'Ghana', country: 'Ghana' },
  { url: 'https://nilepost.co.ug/feed', name: 'Nile Post', category: 'Uganda', country: 'Uganda' },
  { url: 'https://www.standardmedia.co.ke/rss/headlines.php', name: 'The Standard', category: 'Kenya', country: 'Kenya' },
  { url: 'https://www.theafricareport.com/feed/', name: 'The Africa Report', category: 'Business', country: 'Pan-African' },

  // Ethiopia (feed addresses not verified from here; any that fail are skipped)
  { url: 'https://addisstandard.com/feed/', name: 'Addis Standard', category: 'Ethiopia', country: 'Ethiopia' },
  { url: 'https://www.thereporterethiopia.com/feed/', name: 'The Reporter Ethiopia', category: 'Ethiopia', country: 'Ethiopia' },
  { url: 'https://borkena.com/feed/', name: 'Borkena', category: 'Ethiopia', country: 'Ethiopia' },
  { url: 'https://www.ethiopianmonitor.com/feed/', name: 'Ethiopian Monitor', category: 'Ethiopia', country: 'Ethiopia' },

  // Somalia (same caveat)
  { url: 'https://www.hiiraan.com/rss_news.php', name: 'Hiiraan Online', category: 'Somalia', country: 'Somalia' },
  { url: 'https://horseedmedia.net/feed/', name: 'Horseed Media', category: 'Somalia', country: 'Somalia' },
  { url: 'https://www.somaliguardian.com/feed/', name: 'Somali Guardian', category: 'Somalia', country: 'Somalia' },
  { url: 'https://halqabsi.com/feed/', name: 'Halqabsi', category: 'Somalia', country: 'Somalia' }
];

const AFRICAN_CURRENCIES = [
  { code: 'kes', label: 'KES', country: 'Kenya' },
  { code: 'ngn', label: 'NGN', country: 'Nigeria' },
  { code: 'ghs', label: 'GHS', country: 'Ghana' },
  { code: 'ugx', label: 'UGX', country: 'Uganda' },
  { code: 'zar', label: 'ZAR', country: 'South Africa' },
  { code: 'etb', label: 'ETB', country: 'Ethiopia' }
];

let FX = {}; // units of each currency per 1 USD (lowercase codes); also used to convert share prices

// Live market quote for USD/XXX (the same interbank rates Google shows, via Yahoo Finance)
async function marketRate(code) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/USD${code.toUpperCase()}=X?range=1d&interval=1d`,
    { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  return (await r.json()).chart.result[0].meta.regularMarketPrice;
}

async function fetchExchangeRates() {
  let backupP = null; // daily backup rates, only fetched if a live quote fails
  const backup = () => (backupP ||= fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(8000) }).then(r => r.json()));
  FX = {};
  await Promise.all([...AFRICAN_CURRENCIES.map(c => c.code), 'gbp'].map(async code => {
    let v = 0;
    try { v = await marketRate(code); } catch {}
    if (!(v > 0)) { try { v = (await backup()).rates[code.toUpperCase()]; } catch {} }
    if (v > 0) FX[code] = v;
  }));
  return AFRICAN_CURRENCIES.filter(c => FX[c.code]).map(c => ({ label: c.label, country: c.country, rate: FX[c.code] }));
}

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeAgo(pubDate) {
  if (!pubDate) return 'recently';
  const diff = Math.max(0, Date.now() - new Date(pubDate).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const BAD_IMG = /logo|favicon|placeholder|default|avatar|gravatar|blank|pixel|spacer|feedburner|1x1|sprite/i;
function getImage(item) {
  const pick = o => o && o.$ && o.$.url;
  const enc = item.enclosure && /image/.test(item.enclosure.type || 'image') ? item.enclosure.url : '';
  const html = item['content:encoded'] || item.content || item.summary || '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return [pick(item.mediaContent), pick(item.mediaThumb), enc, m && m[1]]
    .find(u => u && /^https?:/.test(u) && !BAD_IMG.test(u)) || '';
}

async function fetchAllFeeds() {
  const articles = [];
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      parsed.items.slice(0, 10).forEach(item => {
        if (!item.title || !item.link) return;
        articles.push({
          title: item.title.trim(),
          link: item.link,
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          snippet: (t => t ? t + '...' : '')((item.contentSnippet || item.summary || '').replace(/\s+/g, ' ').trim().slice(0, 180)),
          source: feed.name,
          category: feed.category,
          country: feed.country,
          image: getImage(item, feed.category)
        });
      });
    } catch (err) {
      console.error(`Failed ${feed.name}: ${err.message}`);
    }
  }
  const seen = new Set();
  return articles
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .filter(a => { const k = a.link.split('?')[0]; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(a => ({ ...a, topic: topicOf(a) }));
}

// ============================================================
// HTML BUILDER
// ============================================================
// Share prices come from Yahoo Finance's public chart endpoint (delayed); each company is skipped if its lookup fails.
const STOCKS = [
  ['Safaricom', 'SCOM.NR'], ['MTN Group', 'MTN.JO'], ['Naspers', 'NPN.JO'], ['Standard Bank', 'SBK.JO'],
  ['Dangote Cement', 'DANGCEM.LG'], ['Equity Group', 'EQTY.NR'], ['Airtel Africa', 'AAF.L'], ['Gold Fields', 'GFI'], ['Sasol', 'SSL']
];
async function fetchStocks() {
  const out = await Promise.all(STOCKS.map(async ([name, symbol]) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0' } });
      const m = (await r.json()).chart.result[0].meta;
      let cur = m.currency, div = 1;
      const sub = { ZAc: 'ZAR', GBp: 'GBP' };
      if (sub[cur]) { cur = sub[cur]; div = 100; }
      const per = cur === 'USD' ? 1 : 1 / FX[cur.toLowerCase()];
      const prev = m.previousClose ?? m.chartPreviousClose;
      if (!m.regularMarketPrice || !prev || !isFinite(per)) return null;
      return { name, symbol, cur: m.currency, usd: m.regularMarketPrice / div * per, pct: (m.regularMarketPrice / prev - 1) * 100 };
    } catch { return null; }
  }));
  return out.filter(Boolean);
}

async function ogImage(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { 'User-Agent': 'Mozilla/5.0 NuruWire/6.0' } });
    const h = (await r.text()).slice(0, 80000);
    const m = h.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i)
      || h.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    return m && /^https?:/.test(m[1]) && !BAD_IMG.test(m[1]) ? m[1].replace(/&amp;/g, '&') : '';
  } catch { return ''; }
}

// An image used by more than one story is a logo or stock fallback, not the story's picture.
function dropSharedImages(arts) {
  const n = {};
  arts.forEach(a => { if (a.image) n[a.image] = (n[a.image] || 0) + 1; });
  arts.forEach(a => { if (a.image && n[a.image] > 1) a.image = ''; });
}

function placeholder(a) {
  const hue = { Technology: 215, Business: 150, 'Energy & Climate': 35, Agriculture: 95, Health: 175, Politics: 275 }[a.topic] ?? 0;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},45%,28%)'/><stop offset='1' stop-color='hsl(${hue},55%,15%)'/></linearGradient></defs><rect width='800' height='500' fill='url(#g)'/><path d='M60 300h160l80-200 130 380 90-280 50 100h170' fill='none' stroke='white' stroke-opacity='.18' stroke-width='14' stroke-linecap='round' stroke-linejoin='round'/><text x='60' y='440' font-family='Georgia,serif' font-size='56' font-weight='700' fill='white' fill-opacity='.9'>${escapeHtml(a.source)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

async function fixImages(arts) {
  dropSharedImages(arts);
  const todo = arts.filter(a => !a.image);
  for (let i = 0; i < todo.length; i += 8) {
    await Promise.all(todo.slice(i, i + 8).map(async a => { a.image = await ogImage(a.link); }));
  }
  dropSharedImages(arts);
  arts.forEach(a => { if (!a.image) a.image = placeholder(a); });
}

function buildHTML(articles, rates, stocks = []) {
  const lead = articles[0];
  const topStories = articles.slice(1, 9);
  
  // Talk of Town
  const smeKeywords = ['SME', 'entrepreneur', 'startup', 'business', 'founder', 'CEO', 'investment', 'capital'];
  const talkOfTown = articles.filter(a => 
    smeKeywords.some(k => a.title.toLowerCase().includes(k) || a.category.toLowerCase().includes(k))
  ).slice(0, 3);
  const finalTalkOfTown = talkOfTown.length >= 3 ? talkOfTown : articles.filter(a => ['Business', 'Technology'].includes(a.category)).slice(0, 3);

  // Regional
  const kenyaNews = articles.filter(a => a.country === 'Kenya').slice(0, 4);
  const nigeriaNews = articles.filter(a => a.country === 'Nigeria').slice(0, 4);
  const ghanaNews = articles.filter(a => a.country === 'Ghana').slice(0, 4);
  const ugandaNews = articles.filter(a => a.country === 'Uganda').slice(0, 4);
  
  // Widgets
  const mostRead = articles.slice(0, 5);
  const trending = articles.slice(5, 10); // Next 5 for trending
  const businessNews = articles.filter(a => a.category === 'Business').slice(0, 4);

  const ugandaAll = articles.filter(a => a.country === 'Uganda').slice(0, 8);
  const kenyaAll = articles.filter(a => a.country === 'Kenya').slice(0, 8);
  const nigeriaAll = articles.filter(a => a.country === 'Nigeria').slice(0, 8);
  const ghanaAll = articles.filter(a => a.country === 'Ghana').slice(0, 8);
  const somaliaAll = articles.filter(a => a.country === 'Somalia').slice(0, 8);
  const ethiopiaAll = articles.filter(a => a.country === 'Ethiopia').slice(0, 8);
  const techAll = articles.filter(a => a.topic === 'Technology').slice(0, 6);
  const bizAll = articles.filter(a => a.topic === 'Business').slice(0, 6);
  const shareHTML = a => {
    const u = encodeURIComponent(a.link), t = encodeURIComponent(a.title), label = escapeHtml(a.title);
    return `<div class="share"><span>Share</span>
          <a href="https://x.com/intent/post?text=${t}&url=${u}" target="_blank" rel="noopener noreferrer" aria-label="Share on X: ${label}" title="Share on X"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.X}</svg></a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook: ${label}" title="Share on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.Facebook}</svg></a>
        </div>`;
  };
  const stockItem = x => `<span class="stk" title="${escapeHtml(x.name)} (${escapeHtml(x.symbol)}), converted from ${escapeHtml(x.cur)}"><b>${escapeHtml(x.name)}</b> $${x.usd < 1 ? x.usd.toFixed(3) : x.usd.toFixed(2)} <i class="${x.pct >= 0 ? 'up' : 'down'}">${x.pct >= 0 ? '▲' : '▼'} ${Math.abs(x.pct).toFixed(2)}%</i></span>`;
  const stocksHTML = stocks.length ? `<div class="ticker stocks" aria-label="African company share prices in US dollars"><span class="ticker-label">Markets · USD</span><div class="ticker-track-container"><div class="ticker-track">${stocks.map(stockItem).join('') + stocks.map(stockItem).join('')}</div></div></div>` : '';
  const socialHTML = SOCIALS.map(x => `<a href="${x.u}" target="_blank" rel="noopener noreferrer" aria-label="Nuru Wire on ${x.n}" title="${x.n}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[x.n]}</svg></a>`).join('');
  const tickerItems = articles.slice(0, 8);
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const favicon = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG);

  // Builders
  const buildStoryHTML = (a) => `
    <article class="story" data-country="${escapeHtml(a.country)}" data-q="${escapeHtml((a.title + ' ' + a.source + ' ' + a.topic).toLowerCase())}">
      <div class="story-img"><img src="${escapeHtml(a.image)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('noimg');this.remove()" /></div>
      <div class="story-body">
        <div class="story-cat">${escapeHtml(a.country)} · ${escapeHtml(a.topic)}</div>
        <h3 class="story-title"><a href="${escapeHtml(a.link)}" target="_blank">${escapeHtml(a.title)}</a></h3>
        <p class="story-snip">${escapeHtml(a.snippet)}</p>
        <div class="story-meta"><span class="source">${escapeHtml(a.source)}</span> · ${timeAgo(a.pubDate)}</div>
        ${shareHTML(a)}
      </div>
    </article>`;

  const buildCardHTML = (a) => `
    <article class="card" data-country="${escapeHtml(a.country)}" data-q="${escapeHtml((a.title + ' ' + a.source + ' ' + a.topic).toLowerCase())}">
      <div class="card-img"><img src="${escapeHtml(a.image)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('noimg');this.remove()" /></div>
      <div class="card-cat">${escapeHtml(a.country)} · ${escapeHtml(a.category)}</div>
      <h3 class="card-title"><a href="${escapeHtml(a.link)}" target="_blank">${escapeHtml(a.title)}</a></h3>
      <div class="card-meta"><span class="source">${escapeHtml(a.source)}</span> · ${timeAgo(a.pubDate)}</div>
      ${shareHTML(a)}
    </article>`;

  const leadHTML = lead ? `
    <article class="lead">
      <div class="lead-img"><img src="${escapeHtml(lead.image)}" alt="${escapeHtml(lead.category)}" /></div>
      <div class="lead-body">
        <span class="kicker">${escapeHtml(lead.country)} · Top Story</span>
        <h1 class="lead-title"><a href="${escapeHtml(lead.link)}" target="_blank">${escapeHtml(lead.title)}</a></h1>
        <p class="lead-dek">${escapeHtml(lead.snippet)}</p>
        <div class="byline"><span class="source">${escapeHtml(lead.source)}</span> <span class="sep">•</span> <span>${timeAgo(lead.pubDate)}</span></div>
        ${shareHTML(lead)}
      </div>
    </article>` : '';

  const tickerDoubled = tickerItems.map(a => `<span>${escapeHtml(a.title)}</span>`).join('') + tickerItems.map(a => `<span>${escapeHtml(a.title)}</span>`).join('');

  const ratesHTML = rates.length > 0 ? rates.map(r => `
    <div class="rate-row${r.label === 'UGX' ? ' hl' : ''}">
      <span class="rate-label">${escapeHtml(r.label)}</span>
      <span class="rate-country">${escapeHtml(r.country)}</span>
      <span class="rate-value">${r.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>`).join('') : '<p>Rates unavailable.</p>';

  const trendingHTML = trending.map((a, i) => `
    <li>
      <span class="trend-num">${i + 1}</span>
      <a href="${escapeHtml(a.link)}" target="_blank">${escapeHtml(a.title)}</a>
    </li>`).join('');

  const businessWidgetHTML = businessNews.map(a => `
    <div class="biz-item">
      <a href="${escapeHtml(a.link)}" target="_blank" class="biz-title">${escapeHtml(a.title)}</a>
      <div class="biz-meta">${escapeHtml(a.source)} · ${timeAgo(a.pubDate)}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuru Wire — Development News from Africa</title>
  <link rel="icon" type="image/svg+xml" href="${favicon}" />
  <meta name="theme-color" content="#8b0000" />
  <meta name="description" content="Nuru Wire: daily business, technology and development news from Uganda, Kenya, Somalia, Ethiopia, Nigeria and Ghana, with live USD exchange rates." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Nuru Wire: Development News from Africa" />
  <meta property="og:description" content="${articles.length} fresh stories from ${new Set(articles.map(a => a.source)).size} African news sources, updated ${now}." />
  ${lead && lead.image.startsWith('http') ? `<meta property="og:image" content="${escapeHtml(lead.image)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  ${SITE_URL ? `<link rel="canonical" href="${SITE_URL}" />` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #ffffff; 
      --bg-alt: #f7f5f2; 
      --border: #e3ded7; 
      --border-strong: #cfc8be;
      --text: #1a1a1a; 
      --text-soft: #4a4a4a; 
      --muted: #7a746c;
      /* Dark Red Theme */
      --accent: #8b0000; 
      --accent-dark: #5c0000; 
      --radius: 4px; 
      --green: #1e7d4f;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
    a { color: inherit; text-decoration: none; }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
    
    /* Header & Nav */
    .topbar { background: var(--bg-alt); border-bottom: 1px solid var(--border); font-size: 0.78rem; color: var(--muted); }
    .topbar-inner { max-width: 1280px; margin: 0 auto; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; }
    .masthead { border-bottom: 3px double var(--border-strong); }
    .masthead-inner { max-width: 1280px; margin: 0 auto; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark { width: 44px; height: 44px; border-radius: 50%; background: var(--accent); display: grid; place-items: center; color: #fff; font-size: 1.3rem; }
    .brand-text .name { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 2.2rem; line-height: 1; color: var(--accent); }
    
    .mainnav { border-bottom: 1px solid var(--border); position: sticky; top: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(8px); z-index: 40; }
    .mainnav-inner { max-width: 1280px; margin: 0 auto; padding: 0 20px; display: flex; gap: 4px; overflow-x: auto; }
    .mainnav a { font-size: 0.85rem; font-weight: 600; padding: 14px 12px; border-bottom: 3px solid transparent; white-space: nowrap; color: var(--text-soft); transition: color 0.2s; }
    .mainnav a:hover, .mainnav a.active { color: var(--accent); border-bottom-color: var(--accent); }
    
    /* Ticker Fix */
    .ticker { background: var(--accent); color: #fff; display: flex; align-items: center; height: 40px; overflow: hidden; width: 100%; }
    .ticker-label { background: var(--accent-dark); padding: 0 20px; height: 100%; display: flex; align-items: center; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; flex-shrink: 0; z-index: 2; position: relative; }
    .ticker-track-container { flex: 1; overflow: hidden; display: flex; align-items: center; }
    .ticker-track { display: flex; gap: 48px; font-size: 0.84rem; white-space: nowrap; animation: scroll 50s linear infinite; padding-left: 20px; }
    @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    
    /* Layout */
    .layout { max-width: 1280px; margin: 0 auto; padding: 28px 20px; display: grid; grid-template-columns: 1fr 320px; gap: 40px; align-items: start; }
    @media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
    
    /* Lead */
    .lead { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; border-bottom: 2px solid var(--text); padding-bottom: 28px; margin-bottom: 28px; }
    @media (max-width: 720px) { .lead { grid-template-columns: 1fr; } }
    .lead-img { aspect-ratio: 16/10; border-radius: var(--radius); overflow: hidden; }
    .lead-body { display: flex; flex-direction: column; justify-content: center; }
    .kicker { color: var(--accent); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
    .lead-title { font-family: 'Playfair Display', serif; font-size: 2.1rem; line-height: 1.12; margin-bottom: 12px; }
    .lead-dek { color: var(--text-soft); margin-bottom: 16px; font-size: 0.95rem; }
    .byline { font-size: 0.78rem; color: var(--muted); }
    .byline .source { color: var(--accent); font-weight: 600; }
    
    /* Sections */
    .section-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--text); padding-bottom: 8px; margin-bottom: 20px; margin-top: 35px; }
    .section-head h2 { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; }
    .section-head a { font-size: 0.72rem; font-weight: 600; color: var(--accent); text-transform: uppercase; }
    
    .story-list { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 620px) { .story-list { grid-template-columns: 1fr; } }
    .story { display: grid; grid-template-columns: 100px 1fr; gap: 14px; border-bottom: 1px solid var(--border); padding-bottom: 14px; }
    .story-img { width: 100px; height: 75px; border-radius: var(--radius); overflow: hidden; }
    .story-cat { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 3px; }
    .story-title { font-family: 'Playfair Display', serif; font-size: 0.98rem; line-height: 1.3; margin-bottom: 5px; }
    .story-meta { font-size: 0.7rem; color: var(--muted); }
    
    .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media (max-width: 800px) { .card-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 500px) { .card-grid { grid-template-columns: 1fr; } }
    .card { display: flex; flex-direction: column; }
    .card-img { aspect-ratio: 16/10; border-radius: var(--radius); overflow: hidden; margin-bottom: 12px; }
    .card-cat { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 3px; }
    .card-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; line-height: 1.3; margin-bottom: 6px; }
    
    /* Sidebar */
    .sidebar { display: flex; flex-direction: column; gap: 24px; }
    .widget { background: var(--bg-alt); padding: 18px; border-radius: var(--radius); border: 1px solid var(--border); }
    .widget-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; border-bottom: 2px solid var(--accent); padding-bottom: 7px; margin-bottom: 14px; color: var(--accent); }
    
    /* Rates */
    .rate-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
    .rate-row:last-child { border-bottom: none; }
    .rate-label { font-weight: 700; }
    .rate-country { color: var(--muted); font-size: 0.78rem; flex: 1; padding-left: 10px; }
    .rate-value { font-weight: 600; color: var(--green); }
    
    /* Most Read & Trending */
    .widget-list { list-style: none; }
    .widget-list li { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .widget-list li:last-child { border-bottom: none; padding-bottom: 0; }
    .widget-list a { font-size: 0.85rem; font-weight: 600; line-height: 1.35; }
    .widget-list a:hover { color: var(--accent); }
    .trend-num { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 800; color: var(--accent); opacity: 0.4; line-height: 1; }

    /* Top Business Widget */
    .biz-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
    .biz-item:last-child { border-bottom: none; padding-bottom: 0; }
    .biz-title { font-size: 0.85rem; font-weight: 600; line-height: 1.35; display: block; margin-bottom: 4px; }
    .biz-title:hover { color: var(--accent); }
    .biz-meta { font-size: 0.7rem; color: var(--muted); }

    /* Footer */
    footer { background: #111; color: #888; padding: 50px 20px 20px; margin-top: 40px; }
    .footer-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; border-bottom: 1px solid #333; padding-bottom: 30px; margin-bottom: 20px; }
    @media (max-width: 768px) { .footer-inner { grid-template-columns: 1fr 1fr; } }
    .footer-brand .name { font-family: 'Playfair Display', serif; font-size: 1.6rem; color: #fff; font-weight: 800; margin-bottom: 10px; }
    .footer-brand p { font-size: 0.85rem; max-width: 300px; }
    .footer-col h4 { color: #fff; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
    .footer-col a { display: block; font-size: 0.85rem; padding: 5px 0; transition: color 0.2s; }
    .footer-col a:hover { color: var(--accent); }
    .footer-bottom { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; font-size: 0.75rem; flex-wrap: wrap; gap: 10px; }

    .story-snip:empty { display: none; }
    .stocks { background: #14110f; }
    .stocks .ticker-label { background: #000; }
    .stocks .ticker-track { gap: 40px; animation-duration: 60s; }
    .stk b { font-weight: 600; margin-right: 6px; }
    .stk i { font-style: normal; font-weight: 700; margin-left: 4px; }
    .stk .up { color: #4ade80; }
    .stk .down { color: #ff7b7b; }
    .share { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 0.7rem; color: var(--muted); }
    .share span { margin-right: 2px; }
    .share a { width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--border-strong); border-radius: 50%; color: var(--text-soft); transition: background 0.2s, color 0.2s, border-color 0.2s; }
    .share a:hover { background: var(--accent); border-color: var(--accent); color: #fff; }
    .share svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    @media (max-width: 700px) { .share a { width: 36px; height: 36px; } .share svg { width: 16px; height: 16px; } }
    [hidden] { display: none !important; }
    a:hover { color: var(--accent); }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .noimg { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); }
    .lead-title { font-size: clamp(1.7rem, 3.4vw, 2.5rem); }
    .lead-dek { font-size: 1.02rem; }
    .stats { background: var(--accent-dark); color: #f3dcdc; }
    .stats-inner { max-width: 1280px; margin: 0 auto; padding: 10px 20px; display: flex; gap: 28px; flex-wrap: wrap; font-size: 0.8rem; }
    .stats b { color: #fff; font-size: 1.05rem; margin-right: 4px; }
    .toolbar { max-width: 1280px; margin: 0 auto; padding: 18px 20px 0; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
    .toolbar input { flex: 1 1 240px; padding: 10px 14px; border: 1px solid var(--border-strong); border-radius: 999px; font: inherit; font-size: 0.9rem; background: #fff; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { border: 1px solid var(--border-strong); background: #fff; border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: var(--text-soft); }
    .chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
    .count { font-size: 0.75rem; color: var(--muted); }
    .story-snip { font-size: 0.8rem; color: var(--text-soft); line-height: 1.45; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .story-title a:hover, .card-title a:hover { text-decoration: underline; text-underline-offset: 3px; }
    .section-head h2 { border-left: 4px solid var(--accent); padding-left: 10px; }
    #empty { padding: 40px 0; text-align: center; color: var(--muted); }
    .social { display: flex; gap: 10px; margin-top: 18px; }
    .social a { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #333; border-radius: 50%; color: #bbb; padding: 0; transition: background 0.2s, color 0.2s, border-color 0.2s; }
    .social a:hover { background: var(--accent); border-color: var(--accent); color: #fff; }
    .social svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .widget-follow .social { margin-top: 0; flex-wrap: wrap; }
    .widget-follow .social a { border-color: var(--border-strong); color: var(--text-soft); }
    .rate-row.hl { background: #fff; margin: 0 -8px; padding: 8px; border-radius: var(--radius); }
    .ticker-track:hover { animation-play-state: paused; }
    @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none; } }

    /* ---------- Tablet and phone ---------- */
    html { -webkit-text-size-adjust: 100%; }
    .story-title, .card-title, .lead-title, .biz-title { overflow-wrap: anywhere; }
    .mainnav-inner, .chips { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    .mainnav-inner::-webkit-scrollbar, .chips::-webkit-scrollbar { display: none; }
    @media (max-width: 1000px) {
      .layout { gap: 28px; }
      .sidebar { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
    }
    @media (min-width: 601px) and (max-width: 800px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 700px) {
      .topbar-inner { padding: 6px 14px; font-size: 0.7rem; gap: 8px; }
      .masthead-inner { padding: 14px; }
      .brand { gap: 10px; }
      .brand-mark { width: 38px; height: 38px; flex: none; }
      .brand-mark svg { width: 26px; height: 26px; }
      .brand-text .name { font-size: 1.7rem; }
      .brand-text > div:nth-child(2) { letter-spacing: 0.04em !important; font-size: 0.6rem !important; }
      .mainnav-inner { padding: 0 6px; }
      .mainnav a { padding: 14px 12px; }
      .ticker { height: 38px; }
      .ticker-label { padding: 0 12px; font-size: 0.62rem; }
      .ticker-track { font-size: 0.8rem; gap: 32px; }
      .toolbar { padding: 14px 14px 0; gap: 10px; }
      .toolbar input { font-size: 16px; padding: 12px 16px; } /* 16px stops iOS zooming in on focus */
      .chips { flex-wrap: nowrap; overflow-x: auto; width: calc(100% + 28px); margin: 0 -14px; padding: 0 14px 4px; }
      .chip { flex: none; min-height: 40px; }
      .layout { padding: 20px 14px; }
      .lead { gap: 14px; padding-bottom: 20px; margin-bottom: 20px; }
      .lead-title { font-size: 1.55rem; }
      .section-head { margin-top: 28px; margin-bottom: 16px; }
      .section-head h2 { font-size: 1.15rem; }
      .story { grid-template-columns: 96px 1fr; gap: 12px; }
      .story-img { width: 96px; height: 72px; }
      .sidebar { grid-template-columns: 1fr; }
      .widget { padding: 16px; }
      footer { padding: 36px 14px 18px; }
      .footer-inner { gap: 28px; }
      .footer-brand { grid-column: 1 / -1; }
      .footer-bottom { flex-direction: column; }
      .footer-col a { padding: 8px 0; }
      .social a { width: 44px; height: 44px; }
    }
    @media (max-width: 380px) {
      .brand-text .name { font-size: 1.45rem; }
      .story { grid-template-columns: 80px 1fr; }
      .story-img { width: 80px; height: 60px; }
    }
  </style>
</head>
<body>

  <div class="topbar">
    <div class="topbar-inner">
      <span style="color: var(--accent); font-weight: 600;">● DEVELOPMENT BRIEFING</span>
      <span>${now} · ${nowTime} GMT</span>
    </div>
  </div>

  <header class="masthead">
    <div class="masthead-inner">
      <a href="#" class="brand">
        <div class="brand-mark"><svg viewBox="0 0 64 64" width="30" height="30">${PULSE}</svg></div>
        <div class="brand-text">
          <div class="name">Nuru Wire</div>
          <div style="font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); margin-top:2px;">Development News · Africa</div>
        </div>
      </a>
    </div>
  </header>

  <nav class="mainnav">
    <div class="mainnav-inner">
      <a href="#" class="active">Home</a>
      <a href="#talk-of-town">Talk of Town</a>
      <a href="#uganda">Uganda</a>
      <a href="#kenya">Kenya</a>
      <a href="#somalia">Somalia</a>
      <a href="#ethiopia">Ethiopia</a>
      <a href="#nigeria">Nigeria</a>
      <a href="#ghana">Ghana</a>
      <a href="#technology">Technology</a>
      <a href="#business">Business</a>
    </div>
  </nav>

  ${stocksHTML}

  <!-- Fixed Ticker -->
  <div class="ticker">
    <span class="ticker-label">Briefing</span>
    <div class="ticker-track-container">
      <div class="ticker-track">${tickerDoubled}</div>
    </div>
  </div>

  <div class="toolbar">
    <input id="q" type="search" placeholder="Search headlines, sources or topics" aria-label="Search stories" />
    <div class="chips">
      ${['All', ...new Set(articles.map(a => a.country))].map((c, i) => `<button class="chip" type="button" aria-pressed="${i === 0}">${escapeHtml(c)}</button>`).join('')}
    </div>
  </div>

  <div class="layout">
    <main>
      ${leadHTML}
      
      <div class="section-head" id="talk-of-town">
        <h2>Talk of Town</h2>
        <span class="count">Business and tech</span>
      </div>
      <div class="card-grid">
        ${finalTalkOfTown.map(buildCardHTML).join('')}
      </div>

      <div class="section-head">
        <h2>Top Development Stories</h2>
        <span class="count">Latest across the continent</span>
      </div>
      <div class="story-list">
        ${topStories.map(buildStoryHTML).join('')}
      </div>

      ${[['uganda', 'News from Uganda', ugandaAll], ['kenya', 'News from Kenya', kenyaAll], ['somalia', 'News from Somalia', somaliaAll], ['ethiopia', 'News from Ethiopia', ethiopiaAll], ['nigeria', 'News from Nigeria', nigeriaAll], ['ghana', 'News from Ghana', ghanaAll], ['technology', 'Technology and Startups', techAll], ['business', 'Business and Economy', bizAll]].map(([id, t, l]) => l.length ? `<div class="section-head" id="${id}"><h2>${t}</h2><span class="count">${l.length} stories</span></div><div class="story-list">${l.map(buildStoryHTML).join('')}</div>` : '').join('')}
      <p id="empty" hidden>No stories match. Try another country or keyword.</p>
    </main>

    <aside class="sidebar">
      <div class="widget widget-follow">
        <h3 class="widget-title">Follow Nuru Wire</h3>
        <div class="social">${socialHTML}</div>
      </div>

      <div class="widget">
        <h3 class="widget-title">💱 USD Exchange Rates</h3>
        <p style="font-size:0.7rem; color:var(--muted); margin-bottom:10px;">1 USD equals · market rates at ${nowTime} GMT</p>
        ${ratesHTML}
      </div>

      <div class="widget">
        <h3 class="widget-title">Top Business Stories</h3>
        ${businessWidgetHTML}
      </div>

      <div class="widget most-read">
        <h3 class="widget-title">Most Read</h3>
        <ul class="widget-list">
          ${mostRead.map(a => `<li><a href="${escapeHtml(a.link)}" target="_blank">${escapeHtml(a.title)}</a></li>`).join('')}
        </ul>
      </div>

      <div class="widget trending">
        <h3 class="widget-title">Trending Now</h3>
        <ul class="widget-list">
          ${trendingHTML}
        </ul>
      </div>
    </aside>
  </div>

  <footer>
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="name">Nuru Wire</div>
        <p>Connecting you to the pulse of development, business, and innovation across Africa.</p>
        <div class="social">${socialHTML}</div>
      </div>
      <div class="footer-col">
        <h4>Regions</h4>
        <a href="#somalia">Somalia</a>
        <a href="#ethiopia">Ethiopia</a>
        <a href="#kenya">Kenya</a>
        <a href="#nigeria">Nigeria</a>
        <a href="#ghana">Ghana</a>
        <a href="#uganda">Uganda</a>
      </div>
      <div class="footer-col">
        <h4>Sections</h4>
        <a href="#talk-of-town">Talk of Town</a>
        <a href="#business">Business</a>
        <a href="#technology">Technology</a>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        <a href="#">Our Mission</a>
        <a href="#">Sources</a>
        <a href="#">Contact</a>
        <a href="#">Privacy Policy</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Nuru Wire. All rights reserved.</span>
      <span>Share prices are delayed and for information only. Last updated: ${now} at ${nowTime} GMT</span>
    </div>
  </footer>

<script>
    const q = document.getElementById('q'), chips = [...document.querySelectorAll('.chip')]; let c = 'All';
    function run() {
      const s = q.value.trim().toLowerCase();
      document.querySelectorAll('.story, .card').forEach(e => { e.hidden = !((c === 'All' || e.dataset.country === c) && (!s || e.dataset.q.includes(s))); });
      document.querySelectorAll('.story-list, .card-grid').forEach(l => { const any = !!l.querySelector(':scope > :not([hidden])'); l.hidden = !any; l.previousElementSibling.hidden = !any; });
      document.getElementById('empty').hidden = !!document.querySelector('.story:not([hidden]), .card:not([hidden])');
    }
    q.addEventListener('input', run);
    setInterval(() => { if (!q.value && !document.hidden) location.reload(); }, 600000); // pick up the 10-minute rebuild
    chips.forEach(b => b.addEventListener('click', () => { c = b.textContent; chips.forEach(x => x.setAttribute('aria-pressed', x === b)); run(); }));
  </script>
</body>
</html>`;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Nuru Wire Generator v6 ===');
  const articles = await fetchAllFeeds();
  await fixImages(articles);
  
  if (articles.length === 0) {
    console.error('No articles fetched. Aborting.');
    process.exitCode = 1;
    return;
  }
  
  const rates = await fetchExchangeRates();
  const stocks = await fetchStocks();
  const html = buildHTML(articles, rates, stocks);
  
  const out = path.join(__dirname, 'index.html');
  fs.writeFileSync(out + '.tmp', html, 'utf-8');
  fs.renameSync(out + '.tmp', out); // swap in whole file so visitors never see a half-written page
  console.log('✅ index.html rebuilt successfully.');
}

// Run once, or keep rebuilding every 10 minutes with: node generate.js --watch
const EVERY_MS = 10 * 60 * 1000;
if (process.argv.includes('--watch')) {
  (async function loop() {
    await main().catch(console.error); // a failed cycle keeps the previous index.html
    setTimeout(loop, EVERY_MS);
  })();
} else {
  main().catch(console.error);
}
