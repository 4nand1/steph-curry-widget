# Fetches Steph Curry's data from ESPN's public JSON and prints one small JSON for the widget
# (the raw schedule alone is ~1MB, too much to hand to the widget). Stdlib only.
import datetime as dt, json, urllib.request

PLAYER, TEAM = "3975", "GS"  # ESPN athlete id / team abbreviation
E = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
A = f"https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{PLAYER}"

def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=10) as r:
            return json.load(r)
    except Exception:
        return None

def games_log():
    d = get(f"{A}/gamelog")
    if not d: return None
    L = d.get("labels", [])
    out = []
    for st in d.get("seasonTypes", [])[:1]:
        for c in st.get("categories", []):
            for e in c.get("events", []):
                m = d["events"].get(e["eventId"], {})
                g = dict(zip(L, e["stats"]))
                out.append({"date": m.get("gameDate"), "at": m.get("atVs"), "opp": (m.get("opponent") or {}).get("abbreviation"),
                            "res": m.get("gameResult"), "score": m.get("score"),
                            **{k.lower(): g.get(k) for k in ("MIN", "PTS", "REB", "AST", "STL", "BLK", "TO", "FG", "3PT", "FT")}})
    out.sort(key=lambda x: x["date"] or "", reverse=True)
    return out  # whole season, newest first (~82 rows max)

def live_game(events):
    """Player's line in the team's live game, or in one that ended < 12h ago. None when there is neither."""
    now = dt.datetime.now(dt.timezone.utc)
    live = [e for e in events if e["competitions"][0]["status"]["type"]["state"] == "in"]
    recent = [e for e in events if e["competitions"][0]["status"]["type"]["completed"]
              and now - dt.datetime.fromisoformat(e["date"].replace("Z", "+00:00")) < dt.timedelta(hours=12)]
    e = (live or recent[-1:] or [None])[0]
    d = e and get(f"{E}/summary?event={e['id']}")
    if not d: return None
    comp = d["header"]["competitions"][0]
    line = None
    for t in d.get("boxscore", {}).get("players", []):
        if t["team"]["abbreviation"] != TEAM: continue
        block = t["statistics"][0]
        for a in block["athletes"]:
            if a["athlete"]["id"] == PLAYER and a.get("stats"):
                line = dict(zip(block["labels"], a["stats"]))
    us = next((c for c in comp["competitors"] if c["team"]["abbreviation"] == TEAM), None)
    them = next((c for c in comp["competitors"] if c is not us), None)
    if not (us and them): return None
    return {"state": comp["status"]["type"].get("state"), "detail": comp["status"]["type"].get("shortDetail"),
            "opp": them["team"]["abbreviation"], "home": us.get("homeAway") == "home",
            "us": us.get("score"), "them": them.get("score"), "line": line}

def injury():
    """ESPN's injury report entry (e.g. status "Out", "Day-To-Day"); None when the player is healthy."""
    a = (get(A) or {}).get("athlete") or {}
    i = (a.get("injuries") or [None])[0]
    return i and {"status": i.get("status"), "note": i.get("shortComment")}

sched = get(f"{E}/teams/{TEAM.lower()}/schedule")
ov = get(f"{A}/overview")
print(json.dumps({
    "games": games_log(),
    "live": live_game(sched["events"]) if sched else None,
    "stats": ov.get("statistics") if ov else None,
    "injury": injury(),
}, ensure_ascii=False))
