# Steph Curry widget for Übersicht

A small macOS desktop widget for [Übersicht](https://tracesof.net/uebersicht/) that shows Steph Curry's stats, with 3-point shooting first.

![Widget screenshot](docs/screenshot.png)

- **Season averages:** points, 3PT %, assists, rebounds.
- **Live game line:** while the Warriors play (and for 12 hours after), shows his points, 3PT made/attempted and %, FG, assists, rebounds, minutes and +/-.
- **Injury status:** taken from ESPN's injury report, and hidden when he is healthy.
- **Game log & career** (click the button): season vs career averages, points per game, season high, and the full game log.
- Refreshes every minute. English or Mongolian.

## Install

You need [Übersicht](https://tracesof.net/uebersicht/) and `python3`. To get `python3`, run `xcode-select --install`, or use Homebrew.

```bash
git clone https://github.com/4nand1/steph-curry-widget.git ~/Library/Application\ Support/Übersicht/widgets/steph-curry.widget
```

The folder name must be `steph-curry.widget`, because the widget runs `steph-curry.widget/fetch.py`.

To update:

```bash
git -C ~/Library/Application\ Support/Übersicht/widgets/steph-curry.widget pull
```

To have it on screen from login, turn on **Launch Übersicht when I login** in Übersicht's preferences.

## Settings

All settings are at the top of `index.jsx`:

| What | Where |
|---|---|
| Language | `const LANG = "en"` (`"en"` or `"mn"`) |
| Position and width | `export const className` at the bottom of the styles |
| Refresh rate | `refreshFrequency` (default 1 minute) |

## How it works

`fetch.py` uses only the Python standard library. It reads ESPN's public JSON endpoints (overview, game log, injury report, team schedule, box score) and prints one small JSON object for the widget. The raw schedule alone is about 1 MB.

## Disclaimer

This is a fan project. It is not affiliated with or endorsed by the NBA, the Golden State Warriors, Stephen Curry or ESPN. The ESPN endpoints are unofficial and may change without notice.

## License

[MIT](LICENSE)
