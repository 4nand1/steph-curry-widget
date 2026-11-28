# NBA player widget for Übersicht

A small macOS desktop widget for [Übersicht](https://tracesof.net/uebersicht/) that follows **any NBA player you choose**. It shows 3-point shooting first.

![Widget screenshot](docs/screenshot.png)

- **Season averages:** points, 3PT %, assists, rebounds.
- **Live game line:** while the player's team plays (and for 12 hours after), it shows:
  - points;
  - 3PT made/attempted and %;
  - FG, assists, rebounds, minutes and +/-.
- **Injury status:** taken from ESPN's injury report, and hidden when the player is healthy.
- **Game log & career** (click the button): season vs career averages, points per game, season high, and the full game log.
- **Team look:** the team colours, headshot, jersey and position all come from ESPN, so the card matches whoever you pick.
- Refreshes every minute. English or Mongolian.

## Install

You need [Übersicht](https://tracesof.net/uebersicht/) and `python3`. To get `python3`, run `xcode-select --install`, or use Homebrew.

```bash
git clone https://github.com/4nand1/nba-player-widget.git ~/Library/Application\ Support/Übersicht/widgets/nba-player.widget
```

The folder name must be `nba-player.widget`, because the widget runs `nba-player.widget/fetch.py`.

To update:

```bash
git -C ~/Library/Application\ Support/Übersicht/widgets/nba-player.widget pull
```

To have it on screen from login, turn on **Launch Übersicht when I login** in Übersicht's preferences.

## Pick your player

Open `index.jsx` and change the first setting:

```js
const PLAYER = "Stephen Curry"; // e.g. "LeBron James", "Victor Wembanyama", or an ESPN id like "1966"
```

- A name is looked up with ESPN's search once, then cached in `.player-ids.json`.
- If two players share a name, use the ESPN athlete id. It is the number in the player's ESPN URL, e.g. `espn.com/nba/player/_/id/1966/lebron-james`.
- If no NBA player matches, the widget says so.

## Other settings

These are at the top of `index.jsx`:

| What | Where |
|---|---|
| Language | `const LANG = "en"` (`"en"` or `"mn"`) |
| Position and width | `export const className`, at the bottom of the styles |
| Refresh rate | `refreshFrequency` (default 1 minute) |

## How it works

`fetch.py` uses only the Python standard library. It reads ESPN's public JSON endpoints and prints one small JSON object for the widget. The raw schedule alone is about 1 MB. The endpoints it reads:

- player search;
- athlete record, with team and injury report;
- overview;
- game log;
- team schedule;
- box score.

## Disclaimer

This is a fan project. It is not affiliated with or endorsed by the NBA, its teams or players, or ESPN. The ESPN endpoints are unofficial and may change without notice.

## License

[MIT](LICENSE)
