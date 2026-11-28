# Fetches one NBA player's data from ESPN's public JSON and prints one small JSON for the widget
# (the raw schedule alone is ~1MB, too much to hand to the widget). Stdlib only.
# Usage: python3 fetch.py "Stephen Curry"   (a name, or an ESPN athlete id such as 3975)
import datetime as dt, json, os, sys, urllib.parse, urllib.request

E = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".player-ids.json")  # name -> ESPN id

def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=10) as r:
            return json.load(r)
    except Exception:
        return None

def player_id(query):
    """ESPN athlete id for a name (first NBA match of ESPN's search), cached so it is searched once."""
    query = query.strip()
    if query.isdigit(): return query
    try: cache = json.load(open(CACHE))
    except Exception: cache = {}
    key = query.lower()
    if key not in cache:
        d = get("https://site.web.api.espn.com/apis/search/v2?type=player&limit=10&query=" + urllib.parse.quote(query)) or {}
        hit = next((c for r in d.get("results", []) for c in r.get("contents", []) if c.get("defaultLeagueSlug") == "nba"), None)
        if not hit: return None
        cache[key] = hit["uid"].rsplit("a:", 1)[-1]
        try: json.dump(cache, open(CACHE, "w"))
        except Exception: pass
    return cache[key]

def games_log(A):
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

def live_game(pid, team_id):
    """The player's line in the team's live game, or in one that ended < 12h ago. None when there is neither."""
    sched = get(f"{E}/teams/{team_id}/schedule")
    if not sched: return None
    now = dt.datetime.now(dt.timezone.utc)
    events = sched.get("events", [])
    live = [e for e in events if e["competitions"][0]["status"]["type"]["state"] == "in"]
    recent = [e for e in events if e["competitions"][0]["status"]["type"]["completed"]
              and now - dt.datetime.fromisoformat(e["date"].replace("Z", "+00:00")) < dt.timedelta(hours=12)]
    e = (live or recent[-1:] or [None])[0]
    d = e and get(f"{E}/summary?event={e['id']}")
    if not d: return None
    comp = d["header"]["competitions"][0]
    line = None
    for t in d.get("boxscore", {}).get("players", []):
        if t["team"]["id"] != team_id: continue
        block = t["statistics"][0]
        for a in block["athletes"]:
            if a["athlete"]["id"] == pid and a.get("stats"):
                line = dict(zip(block["labels"], a["stats"]))
    us = next((c for c in comp["competitors"] if c["team"]["id"] == team_id), None)
    them = next((c for c in comp["competitors"] if c is not us), None)
    if not (us and them): return None
    return {"state": comp["status"]["type"].get("state"), "detail": comp["status"]["type"].get("shortDetail"),
            "opp": them["team"]["abbreviation"], "home": us.get("homeAway") == "home",
            "us": us.get("score"), "them": them.get("score"), "line": line}

def main(query):
    pid = player_id(query)
    if not pid: return {"error": "notFound", "query": query}
    A = f"https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{pid}"
    a = (get(A) or {}).get("athlete")
    if not a: return None  # ESPN unreachable: print null, the widget keeps its last data
    t = a.get("team") or {}
    inj = (a.get("injuries") or [None])[0]
    ov = get(f"{A}/overview")
    return {
        "player": {"name": a.get("displayName"), "short": a.get("lastName") or a.get("displayName"),
                   "jersey": a.get("jersey"), "pos": (a.get("position") or {}).get("abbreviation"),
                   "headshot": (a.get("headshot") or {}).get("href"), "team": t.get("abbreviation"),
                   "color": t.get("color"), "alt": t.get("alternateColor")},
        "games": games_log(A),
        "live": live_game(pid, t["id"]) if t.get("id") else None,
        "stats": ov.get("statistics") if ov else None,
        "injury": inj and {"status": inj.get("status"), "note": inj.get("shortComment")},
    }

if __name__ == "__main__":
    print(json.dumps(main(" ".join(sys.argv[1:]) or "Stephen Curry"), ensure_ascii=False))
