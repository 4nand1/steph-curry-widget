// Stat cards for Übersicht: each card in config.json shows numbers from a URL or a shell command,
// or, with "type": "nba-player", a player's live game line, averages and game log (ESPN). fetch.py builds the data.
import { css, React } from "uebersicht";

const STR = {
  en: {
    final: "Final", pts: "pts", three: "3PT", ast: "ast", reb: "reb", min: "min",
    notPlaying: (n, live) => `${n} ${live ? "is not playing" : "did not play"} in this game.`,
    PTS: "PTS", AST: "AST", REB: "REB", close: "Close", avgTitle: "Averages: season vs career",
    season: "Season", career: "Career", gp: "GP", hint: "Gold: season average is above the career average.",
    trend: "Season points · by game", best: "Season high", log: "Game log",
    cols: ["Date", "Opp", "W/L", "MIN", "PTS", "REB", "AST", "3PT"],
    loading: "Loading…", notFound: (q) => `No NBA player found for "${q}". Check "player" in config.json.`,
    unreachable: "Could not reach the source.", noSource: "Add a \"url\" or \"command\" to this card in config.json.", failed: "This card failed", config: "config.json problem", gpAvg: (n) => `Averages over ${n} games`,
    tiles: ["Points", "3PT %", "Assists", "Rebounds"],
    btn: "Game log & career", btnSub: "Points per game, season high, career averages",
    injured: (s) => s || "Injured", error: "Widget error", noPython: "Could not run fetch.py. Is python3 installed? (xcode-select --install)",
  },
  mn: {
    final: "Төгссөн", pts: "оноо", three: "3 оноо", ast: "дамж", reb: "самб", min: "мин",
    notPlaying: (n, live) => `${n} энэ тоглолтод ${live ? "тоглохгүй байна" : "тоглоогүй"}.`,
    PTS: "Оноо", AST: "Дамж.", REB: "Самбар", close: "Хаах", avgTitle: "Дундаж: улирал ба карьер",
    season: "Улирал", career: "Карьер", gp: "тогл.", hint: "Шар өнгөтэй тоо: улирлын дундаж карьерынхаас өндөр байна.",
    trend: "Улирлын оноо · тоглолт бүрээр", best: "Улирлын шилдэг", log: "Тоглолтын түүх",
    cols: ["Огноо", "Өрс.", "Ү/Д", "Мин", "Оноо", "Самб", "Дамж", "3PT"],
    loading: "Ачаалж байна…", notFound: (q) => `"${q}" нэртэй NBA тоглогч олдсонгүй. config.json доторх "player"-ийг шалгана уу.`,
    unreachable: "Эх сурвалжтай холбогдож чадсангүй.", noSource: "config.json-д энэ картын \"url\" эсвэл \"command\"-ийг бичнэ үү.", failed: "Карт алдаатай", config: "config.json алдаатай", gpAvg: (n) => `${n} тоглолтын дундаж`,
    tiles: ["Оноо", "3 оноо %", "Дамж.", "Самбар"],
    btn: "Тоглолтын түүх ба карьер", btnSub: "Тоглолт бүрийн оноо, шилдэг тоглолт, карьерын дундаж",
    injured: () => "Бэртэлтэй", error: "Самбар алдаатай", noPython: "fetch.py ажиллаж чадсангүй. python3 суусан эсэхийг шалгана уу (xcode-select --install).",
  },
};
let T = STR.en; // set from config.json's "lang" on each render

export const command = "python3 stat-cards.widget/fetch.py"; // path is relative to the widgets folder
export const refreshFrequency = 60 * 1000; // 1 min: fresh within a minute of login or wake

// A card whose source was unreachable this time keeps its last good data.
const merge = (old, d) => ({ ...d, cards: (d.cards || []).map((c, i) => (c.error === "unreachable" && old?.cards?.[i] && !old.cards[i].error && old.cards[i].title === c.title ? old.cards[i] : c)) });

export const initialState = { data: null, error: null, open: null };
export const updateState = (e, s) => {
  if (e.type === "UB/COMMAND_RAN") {
    if (e.error) return s.data ? s : { ...s, error: T.noPython };
    try { const d = JSON.parse(e.output); return { ...s, data: d.cards ? merge(s.data, d) : d, error: null }; } catch { return s; }
  }
  if (e.type === "TOGGLE") return { ...s, open: s.open === e.i ? null : e.i };
  return s;
};

const md = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}`; };
function averages(st) {
  if (!st) return null;
  const L = st.labels || [];
  const pick = (name) => {
    const sp = st.splits?.find((x) => x.displayName === name);
    return sp ? Object.fromEntries(L.map((k, i) => [k, sp.stats[i]])) : null;
  };
  return { season: pick("Regular Season"), career: pick("Career") };
}

// "4-7" -> { m: 4, a: 7, pct: 57 }
const shot = (v) => { const [m, a] = String(v || "").split("-").map(Number); return a ? { m, a, pct: Math.round((m / a) * 100) } : { m: m || 0, a: 0, pct: null }; };

// The line in the game that is on now (or just ended): 3PT first, it is what this widget is for.
const liveLine = (lv, name) => {
  if (!lv) return null;
  const live = lv.state === "in";
  const L = lv.line;
  const p3 = L && shot(L["3PT"]), fg = L && shot(L.FG);
  return (
    <div className={`${liveBox} ${live ? liveOn : ""}`}>
      <div className={liveHead}>
        <span className={live ? liveDot : finDot}>{live ? "● LIVE" : T.final}</span>
        <span>{lv.home ? "vs" : "@"} {lv.opp} · {lv.us}–{lv.them}</span>
        {live && <span className={muted}>{lv.detail}</span>}
      </div>
      {L ? (
        <div className={liveGrid}>
          <div className={liveMain}><b>{L.PTS}</b><span>{T.pts}</span></div>
          <div className={liveMain}><b className={goldTxt}>{p3.m}/{p3.a}</b><span>{T.three}{p3.pct != null && ` · ${p3.pct}%`}</span></div>
          <div className={liveSide}>
            <span>FG {fg.m}/{fg.a}{fg.pct != null && ` · ${fg.pct}%`}</span>
            <span>{L.AST} {T.ast} · {L.REB} {T.reb}</span>
            <span>{L.MIN} {T.min} · {L["+/-"]}</span>
          </div>
        </div>
      ) : (
        <p className={liveNone}>{T.notPlaying(name, live)}</p>
      )}
    </div>
  );
};

const avgCols = () => [["PTS", T.PTS], ["AST", T.AST], ["REB", T.REB], ["3P%", "3P%"], ["FG%", "FG%"], ["FT%", "FT%"]];
const injuryPill = (inj, cls) => inj && <span className={`${pill} ${warnP} ${cls || ""}`}>⚠ {T.injured(inj.status)}</span>;

const detailView = (p, s, inj, games, toggle) => {
  const AVG = avgCols();
  const gs = games || [];
  const best = gs.reduce((b, g) => (+g.pts > +(b?.pts ?? -1) ? g : b), null);
  const trend = [...gs].reverse();
  const max = Math.max(...trend.map((g) => +g.pts || 0), 1);
  return (
    <div className={detail}>
      <div className={hdr}>
        <b className={dName}>{p.name}</b><span className={muted}>{[p.jersey && `#${p.jersey}`, p.pos, p.team].filter(Boolean).join(" · ")}</span>
        {injuryPill(inj)}
        <button className={iconBtn} style={{ marginLeft: inj ? 0 : "auto" }} onClick={toggle} title={T.close}>✕</button>
      </div>
      {inj?.note && <p className={note}>{inj.note}</p>}

      <p className={secLbl}>{T.avgTitle}</p>
      <table className={avgT}>
        <thead><tr><th />{AVG.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
        <tbody>
          {[["season", s.season], ["career", s.career]].map(([key, v]) => v && (
            <tr key={key}>
              <td><b>{T[key]}</b><span>{v.GP ?? "–"} {T.gp}</span></td>
              {AVG.map(([k]) => {
                const up = key === "season" && s.career && +v[k] > +s.career[k];
                return <td key={k} className={up ? better : ""}>{v[k] ?? "–"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={hint}>{T.hint}</p>

      {trend.length > 0 && <>
        <p className={secLbl}>{T.trend}</p>
        <div className={chart} style={{ gridTemplateColumns: `repeat(${trend.length}, 1fr)` }}>
          {trend.map((g, k) => (
            <div key={k} className={col} title={`${md(g.date)} ${g.at} ${g.opp} · ${g.pts} ${T.pts}`}>
              <span className={val}>{g.pts}</span>
              <div className={barWrap}><div className={`${bar} ${g.res === "W" ? barW : barL}`} style={{ height: `${Math.max(4, ((+g.pts || 0) / max) * 100)}%` }} /></div>
              <span className={oppS}>{g.opp}</span>
            </div>
          ))}
        </div>
      </>}

      {best && <div className={bestBox}><span>{T.best}</span><b>{best.pts} {T.pts}</b> {best.at} {best.opp} · {md(best.date)} · 3PT {best["3pt"]} · {best.ast} AST</div>}

      {gs.length > 0 && <>
        <p className={secLbl}>{T.log}</p>
        <div className={logWrap}>
          <table className={logT}>
            <thead><tr>{T.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {gs.map((g, k) => (
                <tr key={k} className={+g.min < 15 ? dimRow : ""} title={`${g.at} ${g.opp} ${g.score} · FG ${g.fg} · FT ${g.ft} · ${g.stl} STL · ${g.to} TO`}>
                  <td>{md(g.date)}</td>
                  <td>{g.at} {g.opp}</td>
                  <td><span className={g.res === "W" ? wTxt : lTxt}>{g.res}</span></td>
                  <td>{g.min}{+g.min < 15 && "⚠"}</td>
                  <td className={ptsC}>{g.pts}</td>
                  <td>{g.reb}</td>
                  <td>{g.ast}</td>
                  <td>{g["3pt"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  );
};

const message = (text) => <div className={wrap}><section className={panel}><p className={muted}>{text}</p></section></div>;
const hex = (c, d) => { const h = String(c || "").replace(/^#/, ""); return `#${/^[0-9a-f]{6}$/i.test(h) ? h : d}`; };

// One NBA player: live line, averages, injury, and the game log behind the button.
const playerCard = (c, open, toggle) => {
  const { games, stats, live, injury: inj, player: p } = c;
  const s = averages(stats);
  if (!s || !p) return <section className={panel}><p className={muted}>{T.loading}</p></section>;
  const c1 = hex(p.alt, "8a8a8a"), c2 = hex(c.color || p.color, "FFC72C");
  const v = s.season || {};
  return (
    <section className={panel}>
      <span className={stripe} style={{ background: `linear-gradient(90deg, ${c1} 50%, ${c2} 50%)` }} />
      {open ? detailView(p, s, inj, games, toggle) : <>
        <header className={hdr}>
          <span className={avatar} style={{ borderColor: c2 }}>{p.headshot ? <img src={p.headshot} alt="" /> : p.jersey}</span>
          <span className={btnTxt}><b>{p.name}</b><span>{T.gpAvg(v.GP ?? "–")}</span></span>
          {injuryPill(inj, right)}
        </header>
        {inj?.note && <p className={note}>{inj.note}</p>}
        {liveLine(live, p.short)}
        <div className={tiles}>
          {["PTS", "3P%", "AST", "REB"].map((k, i) => (
            <div key={k}><b className={k === "3P%" ? goldTxt : ""}>{v[k] ?? "–"}</b><span>{T.tiles[i]}</span></div>
          ))}
        </div>
        <button className={openBtn} onClick={toggle}>
          <span className={btnTxt}><b>{T.btn}</b><span>{T.btnSub}</span></span>
          <span className={chev}>›</span>
        </button>
      </>}
    </section>
  );
};

// {value, format: "change" | "number", decimals, prefix, unit} -> shown text and colour
const show = (f) => {
  const v = f.value;
  if (v == null || v === "") return { text: "–" };
  const n = typeof v === "number" ? v : /^-?\d+(\.\d+)?$/.test(String(v).trim()) ? +v : null;
  if (n == null) return { text: `${f.prefix || ""}${v}${f.unit || ""}` };
  const d = f.decimals ?? (Number.isInteger(n) ? 0 : 2);
  const num = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: f.format === "change" ? d : 0, maximumFractionDigits: d });
  const sign = n < 0 ? "−" : f.format === "change" && n > 0 ? "+" : "";
  return { text: `${sign}${f.prefix || ""}${num}${f.unit || ""}`, tone: f.format === "change" ? (n > 0 ? upTxt : n < 0 ? downTxt : "") : "" };
};

const fieldsCard = (c) => (
  <section className={panel}>
    {c.color && <span className={stripe} style={{ background: hex(c.color, "FFC72C") }} />}
    {c.title && <p className={cardTitle}>{c.title}</p>}
    <div className={tiles} style={{ gridTemplateColumns: `repeat(${Math.min(c.fields.length, 4)}, 1fr)` }}>
      {c.fields.map((f, i) => {
        const { text, tone } = show(f);
        return <div key={i}><b className={tone || ""} style={text.length > 9 ? { fontSize: 14 } : null}>{text}</b>{f.label && <span>{f.label}</span>}</div>;
      })}
    </div>
  </section>
);

const errorCard = (c) => (
  <section className={panel}>
    {c.title && <p className={cardTitle}>{c.title}</p>}
    <p className={muted}>{c.error === "notFound" ? T.notFound(c.query) : T[c.error] || `${T.failed}${c.detail ? `: ${c.detail}` : ""}`}</p>
  </section>
);

const view = ({ data, error, open }, dispatch) => {
  T = STR[data?.lang] || STR.en;
  if (!data) return message(error || T.loading);
  if (data.error) return message(`${T.config}: ${data.detail || data.error}`);
  return (
    <div className={wrap}>
      {data.cards.map((c, i) => (
        <React.Fragment key={i}>
          {c.error ? errorCard(c) : c.type === "nba-player" ? playerCard(c, open === i, () => dispatch({ type: "TOGGLE", i })) : fieldsCard(c)}
        </React.Fragment>
      ))}
    </div>
  );
};

// Übersicht's server crashes when a widget throws while rendering, so never let an error escape.
export const render = (state, dispatch) => {
  try { return view(state, dispatch); }
  catch (err) { return message(`${T.error}: ${String(err && err.message)}`); }
};

export const className = `top: 40px; left: 24px; width: 360px;`;
const wrap = css`display: flex; flex-direction: column; gap: 10px; font: 13px/1.45 -apple-system, "SF Pro Text", sans-serif; color: #f2f2f2; -webkit-font-smoothing: antialiased;`;
const panel = css`position: relative; overflow: hidden; background: rgba(18,18,22,0.76); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 16px; border: 0.5px solid rgba(255,255,255,0.12); padding: 14px 16px; p { margin: 0; }`;
const stripe = css`position: absolute; inset: 0 0 auto 0; height: 3px;`; // team colours, set inline
const hdr = css`display: flex; align-items: center; gap: 8px; margin-bottom: 10px;`;
const right = css`margin-left: auto;`;
const pill = css`font-size: 11px; font-weight: 700; letter-spacing: 0.02em; padding: 2px 8px; border-radius: 999px; white-space: nowrap;`;
const warnP = css`background: rgba(239,159,39,0.2); color: #FAC775;`;
const muted = css`color: rgba(255,255,255,0.55); font-size: 12px;`;
const openBtn = css`margin-top: 12px; width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; cursor: pointer; text-align: left;
  background: rgba(255,199,44,0.08); border: 0.5px solid rgba(255,199,44,0.28); color: #f2f2f2; font: inherit; transition: background .15s;
  &:hover { background: rgba(255,199,44,0.16); }`;
const avatar = css`flex: none; width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.08); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; border: 1.5px solid; img { width: 100%; height: 100%; object-fit: cover; object-position: top; }`;
const btnTxt = css`flex: 1; display: flex; flex-direction: column; b { font-size: 14px; } span { font-size: 11.5px; color: rgba(255,255,255,0.55); }`;
const chev = css`font-size: 20px; color: rgba(255,255,255,0.5);`;
const detail = css`margin-top: 12px; padding-top: 12px; border-top: 0.5px solid rgba(255,255,255,0.1); max-height: 70vh; overflow-y: auto; margin-right: -8px; padding-right: 8px;
  &::-webkit-scrollbar { width: 6px; } &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }`;
const dName = css`font-size: 16px;`;
const iconBtn = css`margin-left: auto; width: 26px; height: 26px; border-radius: 8px; background: rgba(255,255,255,0.07); color: #f2f2f2; border: 0.5px solid rgba(255,255,255,0.14); cursor: pointer; &:hover { background: rgba(255,255,255,0.16); }`;
const note = css`font-size: 11.5px; line-height: 1.45; color: rgba(250,199,117,0.9); margin-bottom: 4px !important;`;
const secLbl = css`margin: 14px 0 6px !important; font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.45);`;
const avgT = css`width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
  th { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); text-align: center; padding: 0 0 4px; }
  td { text-align: center; font-size: 14px; font-weight: 700; padding: 6px 0; border-top: 0.5px solid rgba(255,255,255,0.07); }
  td:first-child { text-align: left; } td:first-child b { display: block; font-size: 12px; } td:first-child span { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }`;
const better = css`color: #FFD866;`;
const hint = css`font-size: 10.5px; color: rgba(255,255,255,0.35); margin-top: 4px !important;`;
const chart = css`display: grid; gap: 4px;`;
const col = css`display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0;`;
const val = css`font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums;`;
const barWrap = css`height: 48px; width: 100%; display: flex; align-items: flex-end; justify-content: center;`;
const bar = css`width: 72%; border-radius: 3px 3px 1px 1px;`;
const barW = css`background: linear-gradient(180deg, #FFC72C, rgba(255,199,44,0.4));`;
const barL = css`background: linear-gradient(180deg, rgba(240,149,149,0.9), rgba(240,149,149,0.3));`;
const oppS = css`font-size: 9.5px; color: rgba(255,255,255,0.55); overflow: hidden; text-overflow: clip; white-space: nowrap; max-width: 100%;`;
const bestBox = css`margin-top: 12px; padding: 8px 12px; border-radius: 10px; background: rgba(255,199,44,0.1); border: 0.5px solid rgba(255,199,44,0.3); font-size: 12px;
  span { display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #FFD866; } b { font-size: 15px; }`;
const logWrap = css`border-radius: 10px; background: rgba(255,255,255,0.03); overflow: hidden;`;
const logT = css`width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 11.5px; font-variant-numeric: tabular-nums;
  th { position: sticky; top: 0; background: rgba(30,30,36,0.98); font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); text-align: left; padding: 6px 3px; }
  th:first-child, td:first-child { padding-left: 8px; width: 13%; } th:nth-child(2), td:nth-child(2) { width: 17%; } th:nth-child(8), td:nth-child(8) { width: 14%; }
  td { padding: 6px 3px; overflow: hidden; border-top: 0.5px solid rgba(255,255,255,0.06); white-space: nowrap; }`;
const ptsC = css`font-weight: 800; font-size: 13px;`;
const wTxt = css`color: #7FE0BE; font-weight: 800;`;
const lTxt = css`color: #FF9F9F; font-weight: 800;`;
const liveBox = css`margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1);`;
const liveOn = css`background: rgba(226,75,74,0.1); border-color: rgba(226,75,74,0.4);`;
const liveHead = css`display: flex; align-items: baseline; gap: 8px; font-size: 12px; margin-bottom: 6px; span:last-child { margin-left: auto; }`;
const liveDot = css`color: #FF8A8A; font-weight: 800;`;
const finDot = css`color: rgba(255,255,255,0.6); font-weight: 700;`;
const liveGrid = css`display: grid; grid-template-columns: auto auto 1fr; gap: 16px; align-items: end;`;
const liveMain = css`display: flex; flex-direction: column; b { font-size: 30px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; } span { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 2px; }`;
const goldTxt = css`color: #FFD866;`;
const upTxt = css`color: #7FE0BE;`;
const downTxt = css`color: #FF9F9F;`;
const cardTitle = css`font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 2px !important;`;
const liveSide = css`display: flex; flex-direction: column; gap: 1px; font-size: 11.5px; color: rgba(255,255,255,0.75); text-align: right; font-variant-numeric: tabular-nums;`;
const liveNone = css`font-size: 12px; color: rgba(255,255,255,0.6);`;
const tiles = css`display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 12px; div { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 8px 0; text-align: center; } b { display: block; font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; } span { font-size: 10.5px; color: rgba(255,255,255,0.5); }`;
const dimRow = css`td { color: rgba(255,255,255,0.45); }`;
