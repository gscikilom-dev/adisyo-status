/* adisyo Systemstatus
   Daten (22.11.2026): zuerst https://adisyo.de/status.json, das der Server alle 5 Min. von UptimeRobot holt. Ist sie nicht erreichbar
   (dann ist meist der Server selbst gestört) oder älter als 15 Min., die status.json der GitHub Action (läuft nur alle paar Stunden),
   und wenn auch die veraltet ist, fragt die Seite UptimeRobot einmal direkt. So zeigt die Seite nie lange einen alten Stand. */
(function () {
  'use strict';
  var KEY = 'ur3836394-eaef0bbf73b88b4358f99c89';
  var SOURCES = ['https://adisyo.de/status.json', 'https://raw.githubusercontent.com/gscikilom-dev/adisyo-status/data/status.json'];
  var SETUP = 3600;            /* erste Stunde nach dem Anlegen eines Checks = Einrichtung */
  var STALE = 15 * 60;         /* status.json gilt als veraltet nach 15 Min. (Server schreibt alle 5 Min.) */
  var POLL = 120000;           /* alle 2 Min. neu laden, nur wenn der Tab sichtbar ist */

  var ICON = {
    kasse: '<path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7V4h8v3M8 12h3M8 15h5"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 21v-3"/>',
    shop: '<path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    res: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
  };
  /* Zuordnung über die Monitor-ID (Umbenennen in UptimeRobot bricht nichts) */
  var GROUPS = [
    { id: 'kasse', m: [804679921, 804217766], t: { de: ['Kasse und Service', 'Kasse, Kellner-Handy, Küchenmonitor, Anmeldung'], tr: ['Kasa ve servis', 'Kasa, garson telefonu, mutfak ekranı, giriş'], en: ['POS and service', 'Till, waiter phone, kitchen screen, sign-in'] } },
    { id: 'qr', m: [804679927], t: { de: ['QR-Bestellung am Tisch', 'Digitale Speisekarte und Bestellung der Gäste'], tr: ['Masada QR sipariş', 'Dijital menü ve misafir siparişi'], en: ['QR ordering at the table', 'Digital menu and guest orders'] } },
    { id: 'shop', m: [804679931], t: { de: ['Online-Shop', 'Abholung und Lieferung im eigenen Shop'], tr: ['Online mağaza', 'Kendi mağazanızda gel-al ve teslimat'], en: ['Online shop', 'Pickup and delivery in your own shop'] } },
    { id: 'res', m: [804679945], t: { de: ['Reservierung', 'Online-Tischreservierung der Gäste'], tr: ['Rezervasyon', 'Misafirlerin online masa rezervasyonu'], en: ['Reservations', 'Online table booking for guests'] } },
    { id: 'web', m: [804217785], t: { de: ['Website adisyo.de', 'Informationen, Anmeldung und Hilfe'], tr: ['adisyo.de sitesi', 'Bilgi, kayıt ve yardım'], en: ['adisyo.de website', 'Information, sign-up and help'] } }
  ];
  var T = {
    de: { status: 'Systemstatus', loading: 'Status wird geladen', ok: 'Alle Systeme laufen', part: 'Teilweise eingeschränkt', down: 'Störung', unk: 'Status gerade nicht abrufbar', check: 'Wird gerade geprüft',
      sub: 'Zuletzt aktualisiert {a}', now: 'gerade eben', ago: 'vor {x}', min: 'Min.', sec: 'Sek.', hr: 'Std.',
      k90: 'Verfügbar, 90 Tage', k30: 'Verfügbar, 30 Tage', krt: 'Antwortzeit', na: 'k. A.', sys: 'Systeme', d90: 'letzte 90 Tage', d45: 'letzte 45 Tage', incs: 'Störungen',
      none: 'Keine Störungen in den letzten 90 Tagen.', p_ok: 'Läuft', p_warn: 'Eingeschränkt', p_bad: 'Gestört', p_load: 'Wird geprüft', p_unk: 'Unbekannt',
      since: 'Messung seit {d}', today: 'Heute', ago90: 'vor 90 Tagen', ago45: 'vor 45 Tagen', nodata: 'Noch keine Messung', dur: 'Dauer {d}', resolved: 'behoben', ongoing: 'läuft noch', unreach: 'nicht erreichbar',
      bars: '{n}: Verfügbarkeit der letzten 90 Tage {p}',
      err: 'Die Statusdaten sind gerade nicht abrufbar. Das sagt nichts über adisyo selbst aus, wir versuchen es gleich erneut.',
      h1: 'Unabhängig geprüft', h1t: 'Ein externer Dienst prüft adisyo rund um die Uhr alle 5 Minuten, nicht unser eigener Server.',
      h2: 'Echte Funktionen', h2t: 'Geprüft wird nicht nur die Startseite, sondern ob Anmeldung, Speisekarte, Shop und Reservierung im Demo-Restaurant richtig erscheinen.',
      h3: 'Automatisch', h3t: 'Störungen erscheinen hier von selbst, ohne Nachbearbeitung.',
      imp: 'Impressum', dsg: 'Datenschutz', help: 'Hilfe per WhatsApp', upd: 'Die Seite aktualisiert sich von selbst.', uptime: 'Verfügbarkeit', lang: 'Sprache', theme: 'Hell oder dunkel', locale: 'de-DE' },
    tr: { status: 'Sistem durumu', loading: 'Durum yükleniyor', ok: 'Tüm sistemler çalışıyor', part: 'Kısmen kısıtlı', down: 'Arıza', unk: 'Durum şu an alınamıyor', check: 'Şu an kontrol ediliyor',
      sub: 'Son güncelleme {a}', now: 'az önce', ago: '{x} önce', min: 'dk', sec: 'sn', hr: 'sa',
      k90: 'Çalışma, 90 gün', k30: 'Çalışma, 30 gün', krt: 'Yanıt süresi', na: 'yok', sys: 'Sistemler', d90: 'son 90 gün', d45: 'son 45 gün', incs: 'Arızalar',
      none: 'Son 90 günde arıza yok.', p_ok: 'Çalışıyor', p_warn: 'Kısıtlı', p_bad: 'Arızalı', p_load: 'Kontrol ediliyor', p_unk: 'Bilinmiyor',
      since: '{d} tarihinden beri ölçülüyor', today: 'Bugün', ago90: '90 gün önce', ago45: '45 gün önce', nodata: 'Henüz ölçüm yok', dur: 'Süre {d}', resolved: 'giderildi', ongoing: 'devam ediyor', unreach: 'erişilemedi',
      bars: '{n}: son 90 günde çalışma oranı {p}',
      err: 'Durum verileri şu an alınamıyor. Bu adisyo hakkında bir şey söylemez, birazdan tekrar deniyoruz.',
      h1: 'Bağımsız kontrol', h1t: 'Dışarıdaki bir servis adisyo’yu gece gündüz her 5 dakikada bir kontrol eder, kendi sunucumuz değil.',
      h2: 'Gerçek işlevler', h2t: 'Sadece ana sayfaya değil; demo restoranda giriş, menü, mağaza ve rezervasyonun doğru açılıp açılmadığına bakılır.',
      h3: 'Otomatik', h3t: 'Arızalar burada kendiliğinden görünür, sonradan düzeltilmez.',
      imp: 'Künye', dsg: 'Gizlilik', help: 'WhatsApp’tan yardım', upd: 'Sayfa kendiliğinden yenilenir.', uptime: 'Çalışma oranı', lang: 'Dil', theme: 'Açık ya da koyu', locale: 'tr-TR' },
    en: { status: 'System status', loading: 'Loading status', ok: 'All systems operational', part: 'Partially degraded', down: 'Outage', unk: 'Status unavailable right now', check: 'Checking right now',
      sub: 'Last updated {a}', now: 'just now', ago: '{x} ago', min: 'min', sec: 's', hr: 'h',
      k90: 'Uptime, 90 days', k30: 'Uptime, 30 days', krt: 'Response time', na: 'n/a', sys: 'Systems', d90: 'last 90 days', d45: 'last 45 days', incs: 'Incidents',
      none: 'No incidents in the last 90 days.', p_ok: 'Operational', p_warn: 'Degraded', p_bad: 'Outage', p_load: 'Checking', p_unk: 'Unknown',
      since: 'Measured since {d}', today: 'Today', ago90: '90 days ago', ago45: '45 days ago', nodata: 'Not measured yet', dur: 'Duration {d}', resolved: 'resolved', ongoing: 'ongoing', unreach: 'not reachable',
      bars: '{n}: uptime over the last 90 days {p}',
      err: 'Status data is not available right now. This says nothing about adisyo itself, we will retry shortly.',
      h1: 'Independently checked', h1t: 'An external service checks adisyo around the clock every 5 minutes, not our own server.',
      h2: 'Real functions', h2t: 'We check more than the home page: sign-in, menu, shop and reservations in the demo restaurant must load correctly.',
      h3: 'Automatic', h3t: 'Incidents appear here by themselves, without editing.',
      imp: 'Legal notice', dsg: 'Privacy', help: 'Help via WhatsApp', upd: 'This page refreshes itself.', uptime: 'Uptime', lang: 'Language', theme: 'Light or dark', locale: 'en-GB' }
  };

  var L = 'de';
  try { var s = localStorage.getItem('st-lang'); if (s && T[s]) L = s; else { var nl = (navigator.language || 'de').slice(0, 2); if (T[nl]) L = nl; } } catch (e) {}
  var data = null, failed = false, timer = null, backoff = POLL;

  function t(k) { return T[L][k] || T.de[k] || k; }
  function $(id) { return document.getElementById(id); }
  function fmtPct(v) { return (Math.floor(v * 100) / 100).toLocaleString(t('locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDur(s) {
    s = Math.max(1, Math.round(s));
    if (s < 90) return s + ' ' + t('sec');
    var m = Math.round(s / 60); if (m < 90) return m + ' ' + t('min');
    var h = Math.floor(m / 60); return h + ' ' + t('hr') + ' ' + (m % 60) + ' ' + t('min');
  }
  function fmtDate(ts, o) { return new Date(ts * 1000).toLocaleDateString(t('locale'), o || { day: 'numeric', month: 'long', year: 'numeric' }); }
  function rel(sec) { return sec < 45 ? t('now') : t('ago').replace('{x}', fmtDur(sec)); }

  /* 90 Kalendertage (Ortszeit, sommerzeitfest über setDate) */
  function localDays() {
    var now = Math.floor(Date.now() / 1000), out = [];
    for (var i = 89; i >= 0; i--) {
      var a = new Date(); a.setHours(0, 0, 0, 0); a.setDate(a.getDate() - i);
      var b = new Date(a); b.setDate(b.getDate() + 1);
      out.push([Math.floor(a / 1000), Math.min(Math.floor(b / 1000), now)]);
    }
    return out;
  }

  function applyLang() {
    document.documentElement.lang = L;
    [].forEach.call(document.querySelectorAll('[data-t]'), function (n) { n.textContent = t(n.getAttribute('data-t')); });
    [].forEach.call(document.querySelectorAll('.seg button'), function (b) { b.setAttribute('aria-pressed', b.dataset.l === L ? 'true' : 'false'); });
    $('seg').setAttribute('aria-label', t('lang')); $('th').setAttribute('aria-label', t('theme'));
    document.title = 'adisyo ' + t('status');
    render();
  }
  [].forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.onclick = function () { L = b.dataset.l; try { localStorage.setItem('st-lang', L); } catch (e) {} applyLang(); };
  });
  try { var st = localStorage.getItem('st-theme'); if (st) document.documentElement.dataset.theme = st; } catch (e) {}
  function isDark() { var d = document.documentElement.dataset.theme; return d ? d === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
  function themeIcon() {
    $('th').innerHTML = isDark()
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    var c = isDark() ? '#0b0d14' : '#f6f7fb';
    [].forEach.call(document.querySelectorAll('meta[name=theme-color]'), function (m) { m.setAttribute('content', c); });
  }
  $('th').onclick = function () { var n = isDark() ? 'light' : 'dark'; document.documentElement.dataset.theme = n; try { localStorage.setItem('st-theme', n); } catch (e) {} themeIcon(); };
  themeIcon();

  /* ---------- Laden ---------- */
  function direct() {
    var days = localDays();
    var body = 'api_key=' + KEY + '&format=json&custom_uptime_ranges=' + days.map(function (d) { return d[0] + '_' + d[1]; }).join('-') +
      '&response_times=1&response_times_average=30&logs=1&logs_limit=100';
    return fetch('https://api.uptimerobot.com/v2/getMonitors', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body, cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j.stat !== 'ok') throw 0; return { generated: Math.floor(Date.now() / 1000), days: days, monitors: j.monitors }; });
  }
  function fromFile(url) {
    return fetch(url + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (!j.monitors || Date.now() / 1000 - j.generated > STALE) throw 0; return j; });
  }
  function load() {
    fromFile(SOURCES[0])
      .catch(function () { return fromFile(SOURCES[1]); })
      .catch(direct)
      .then(function (j) { data = j; failed = false; backoff = POLL; $('err').classList.remove('on'); render(); })
      .catch(function () { failed = true; backoff = Math.min(backoff * 2, 15 * 60000); $('err').classList.add('on'); render(); })
      .then(schedule);
  }
  function schedule() { clearTimeout(timer); if (!document.hidden) timer = setTimeout(load, backoff); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else load(); });

  /* ---------- Berechnung ---------- */
  function byId() { var o = {}; (data.monitors || []).forEach(function (m) { o[m.id] = m; }); return o; }
  function setupDown(m, a, b) {
    var s = 0, c = m.create_datetime;
    (m.logs || []).forEach(function (l) { if (l.type !== 1 || l.datetime > c + SETUP) return; s += Math.max(0, Math.min(l.datetime + l.duration, b) - Math.max(l.datetime, a)); });
    return s;
  }
  /* echte Ausfälle (ohne Einrichtungsstunde); ein noch offener Ausfall hat Dauer bis jetzt */
  function downs(m) {
    var now = Date.now() / 1000;
    return (m.logs || []).filter(function (l) { return l.type === 1 && l.datetime > m.create_datetime + SETUP; })
      .map(function (l) { var open = (m.status === 8 || m.status === 9) && m.logs[0] === l; return { a: l.datetime, b: open ? now : l.datetime + l.duration, open: open }; });
  }
  function level(m) { return m.status === 9 ? 0 : m.status === 8 ? 1 : m.status === 2 ? 2 : -1; } /* -1 = pausiert / noch nicht geprüft */

  function groupInfo(g, by) {
    var ms = g.m.map(function (id) { return by[id]; }).filter(Boolean);
    if (!ms.length) return { st: 'unk', days: data.days.map(function () { return null; }), since: null, ms: ms };
    var lv = 2, pending = false;
    ms.forEach(function (m) { var l = level(m); if (l < 0) pending = true; else if (l < lv) lv = l; });
    var st = lv === 0 ? 'bad' : lv === 1 ? 'warn' : pending ? 'load' : 'ok';
    var days = data.days.map(function (d, i) {
      var vals = [];
      ms.forEach(function (m) {
        if (m.create_datetime >= d[1]) return;
        var v = parseFloat((m.custom_uptime_ranges || '').split('-')[i]); if (isNaN(v)) return;
        var span = d[1] - Math.max(d[0], m.create_datetime); if (span <= 0) return;
        if (m.create_datetime > d[0]) v = 100 - (100 - v) * (d[1] - d[0]) / span;
        v = Math.max(0, Math.min(100, v + setupDown(m, d[0], d[1]) / span * 100));
        vals.push(v);
      });
      return vals.length ? Math.min.apply(null, vals) : null;
    });
    return { st: st, days: days, since: Math.min.apply(null, ms.map(function (m) { return m.create_datetime; })), ms: ms };
  }
  /* überlappende Ausfälle mehrerer Checks einer Gruppe zu einem zusammenfassen */
  function groupIncidents(ms) {
    var all = []; ms.forEach(function (m) { all = all.concat(downs(m)); });
    all.sort(function (x, y) { return x.a - y.a; });
    var out = [];
    all.forEach(function (x) { var p = out[out.length - 1]; if (p && x.a <= p.b + 60) { p.b = Math.max(p.b, x.b); p.open = p.open || x.open; } else out.push({ a: x.a, b: x.b, open: x.open }); });
    return out;
  }
  function cls(v) { return v === null ? 'n' : v >= 99.9 ? '' : v >= 99 ? 'w' : 'b'; }

  /* ---------- Darstellung ---------- */
  function render() {
    if (!data) {
      if (failed) {
        document.body.className = 's-load'; $('head').textContent = t('unk');
        ['k90', 'k30', 'krt'].forEach(function (k) { $(k).textContent = t('na'); });
        $('incs').innerHTML = ''; $('sub').innerHTML = '&nbsp;';
      }
      return;
    }
    var by = byId(), now = Date.now() / 1000;
    var infos = GROUPS.map(function (g) { return groupInfo(g, by); });
    var order = { bad: 0, warn: 1, unk: 2, load: 3, ok: 4 }, worst = 'ok';
    infos.forEach(function (x) { if (order[x.st] < order[worst]) worst = x.st; });
    document.body.className = worst === 'ok' ? 's-ok' : worst === 'warn' ? 's-warn' : worst === 'bad' ? 's-bad' : 's-load';
    $('head').textContent = worst === 'ok' ? t('ok') : worst === 'warn' ? t('part') : worst === 'bad' ? t('down') : worst === 'load' ? t('check') : t('unk');

    function avg(n) { var s = 0, c = 0; infos.forEach(function (x) { x.days.slice(90 - n).forEach(function (v) { if (v !== null) { s += v; c++; } }); }); return c ? s / c : null; }
    [['k90', 90], ['k30', 30]].forEach(function (k) { var v = avg(k[1]); $(k[0]).innerHTML = v === null ? t('na') : fmtPct(v) + '<u>%</u>'; });
    var app = by[804217766], rt = (app && app.response_times) || [];
    if (rt.length) {
      var n = Math.min(12, rt.length), avgms = Math.round(rt.slice(0, n).reduce(function (a, r) { return a + r.value; }, 0) / n);
      $('krt').innerHTML = avgms + '<u>ms</u>';
      var pts = rt.slice(0, 30).reverse().map(function (r) { return r.value; });
      var mx = Math.max.apply(null, pts) * 1.15 || 1, w = 200, h = 26, k = Math.max(1, pts.length - 1);
      var d = 'M' + pts.map(function (v, i) { return (i / k * w).toFixed(1) + ' ' + (h - v / mx * h).toFixed(1); }).join(' L');
      $('spark').innerHTML = pts.length > 1 ? '<path class="a" d="' + d + ' L' + w + ' ' + h + ' L0 ' + h + 'Z"/><path class="l" d="' + d + '"/>' : '';
    } else { $('krt').textContent = t('na'); $('spark').innerHTML = ''; }

    $('sub').innerHTML = t('sub').replace('{a}', '<em>' + rel(Math.max(0, now - data.generated)) + '</em>');
    $('upd').textContent = t('upd');

    var html = '';
    infos.forEach(function (x, gi) {
      var g = GROUPS[gi], tx = g.t[L] || g.t.de;
      var pc = { ok: '', warn: 'warn', bad: 'bad', load: 'load', unk: 'load' }[x.st];
      var pt = { ok: t('p_ok'), warn: t('p_warn'), bad: t('p_bad'), load: t('p_load'), unk: t('p_unk') }[x.st];
      var known = x.days.filter(function (v) { return v !== null; });
      var up = known.length ? known.reduce(function (a, b) { return a + b; }, 0) / known.length : null;
      html += '<div class="comp"><div class="cr"><span class="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[g.id] + '</svg></span>' +
        '<span class="cn"><b>' + tx[0] + '</b><small>' + tx[1] + '</small></span><span class="pill ' + pc + '">' + pt + '</span></div>';
      html += '<div class="bars" role="img" aria-label="' + t('bars').replace('{n}', tx[0]).replace('{p}', up === null ? t('nodata') : fmtPct(up) + ' %') + '">';
      x.days.forEach(function (v, i) { html += '<i class="' + cls(v) + '" data-d="' + data.days[i][0] + '" data-v="' + (v === null ? '' : v) + '"></i>'; });
      html += '</div><div class="bl"><span class="l90">' + t('ago90') + '</span><span class="l45">' + t('ago45') + '</span><span>' +
        (up === null ? t('nodata') : '<b>' + fmtPct(up) + ' %</b><span class="ms"> · ' + t('since').replace('{d}', fmtDate(Math.max(x.since, data.days[0][0]), { day: 'numeric', month: 'short' })) + '</span>') +
        '</span><span>' + t('today') + '</span></div></div>';
    });
    $('comps').innerHTML = html;

    var list = [];
    infos.forEach(function (x, gi) {
      var tx = GROUPS[gi].t[L] || GROUPS[gi].t.de;
      groupIncidents(x.ms).forEach(function (r) { if (r.b > now - 90 * 86400) list.push({ g: tx[0], r: r }); });
    });
    list.sort(function (a, b) { return b.r.a - a.r.a; });
    $('incs').innerHTML = !list.length
      ? '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.3l3 3 6-6.3"/></svg>' + t('none') + '</div>'
      : list.slice(0, 12).map(function (x) {
        var dt = new Date(x.r.a * 1000);
        return '<div class="ii"><span class="d"><b>' + dt.getDate() + '</b><small>' + dt.toLocaleDateString(t('locale'), { month: 'short' }) + '</small></span><p>' + x.g + ' ' + t('unreach') +
          '<small>' + dt.toLocaleTimeString(t('locale'), { hour: '2-digit', minute: '2-digit' }) + ' · ' + t('dur').replace('{d}', fmtDur(x.r.b - x.r.a)) + ' · ' + (x.r.open ? t('ongoing') : t('resolved')) + '</small></p></div>';
      }).join('');
  }
  setInterval(function () { if (data) $('sub').innerHTML = t('sub').replace('{a}', '<em>' + rel(Math.max(0, Date.now() / 1000 - data.generated)) + '</em>'); }, 15000);

  /* ---------- Tooltip ---------- */
  var tip = $('tip');
  function showTip(e) {
    var n = e.target; if (n.tagName !== 'I' || !n.parentNode.classList.contains('bars')) return;
    var v = n.dataset.v;
    tip.innerHTML = '<b>' + fmtDate(+n.dataset.d, { weekday: 'short', day: 'numeric', month: 'long' }) + '</b><br>' + (v === '' ? t('nodata') : t('uptime') + ' ' + fmtPct(+v) + ' %');
    var r = n.getBoundingClientRect(); tip.classList.add('on');
    var w = tip.offsetWidth, x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8), y = r.top - tip.offsetHeight - 10;
    if (y < 8) y = r.bottom + 10;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  document.addEventListener('mouseover', showTip); document.addEventListener('mouseout', hideTip);
  document.addEventListener('scroll', hideTip, { passive: true });
  document.addEventListener('touchstart', function (e) { if (e.target.tagName === 'I' && e.target.parentNode.classList.contains('bars')) showTip(e); else hideTip(); }, { passive: true });

  applyLang(); load();
})();
