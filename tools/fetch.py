# Holt den Status von UptimeRobot und schreibt status.json (läuft in GitHub Actions alle 5 Min.).
# Der Read-only-Schlüssel ist derselbe, der ohnehin in app.js steht.
import json, re, time, urllib.parse, urllib.request, pathlib, sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from datetime import timezone
root = pathlib.Path(__file__).resolve().parent.parent
key = re.search(r"var KEY = '([^']+)'", (root / 'app.js').read_text(encoding='utf-8')).group(1)
try:
    tz = ZoneInfo('Europe/Berlin')
except Exception:  # nur lokal unter Windows ohne tzdata
    tz = timezone(timedelta(hours=1))
now = int(time.time())
today = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)
days = []
for i in range(89, -1, -1):
    a = today - timedelta(days=i)
    b = a + timedelta(days=1)
    days.append([int(a.timestamp()), min(int(b.timestamp()), now)])
body = urllib.parse.urlencode({
    'api_key': key, 'format': 'json',
    'custom_uptime_ranges': '-'.join(f'{a}_{b}' for a, b in days),
    'response_times': 1, 'response_times_average': 30, 'logs': 1, 'logs_limit': 100,
}).encode()
for attempt in range(3):
    try:
        with urllib.request.urlopen(urllib.request.Request('https://api.uptimerobot.com/v2/getMonitors', data=body, method='POST'), timeout=30) as r:
            j = json.load(r)
        if j.get('stat') == 'ok':
            break
    except Exception as e:
        print('retry', e)
    time.sleep(10)
else:
    sys.exit('UptimeRobot nicht erreichbar')
keep = ('id', 'friendly_name', 'status', 'create_datetime', 'custom_uptime_ranges', 'logs', 'response_times')
mons = [{k: m.get(k) for k in keep} for m in j['monitors']]
for m in mons:
    m['logs'] = [{'type': l['type'], 'datetime': l['datetime'], 'duration': l['duration']} for l in (m['logs'] or [])]
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'status.json')
out.write_text(json.dumps({'generated': now, 'days': days, 'monitors': mons}, separators=(',', ':')), encoding='utf-8')
print('ok', len(mons), 'monitors')
