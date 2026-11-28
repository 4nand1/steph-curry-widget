# Stat cards for Übersicht

A macOS desktop widget for [Übersicht](https://tracesof.net/uebersicht/) that shows **whatever numbers you choose**, as a stack of small cards. Each card reads one of these:

- a JSON URL;
- a shell command;
- a ready-made **NBA player** card, with live 3PT line, averages, injury status and game log.

![Widget screenshot](docs/screenshot.png)

## Install

You need [Übersicht](https://tracesof.net/uebersicht/) and `python3`. To get `python3`, run `xcode-select --install`, or use Homebrew.

```bash
git clone https://github.com/4nand1/stat-cards.git ~/Library/Application\ Support/Übersicht/widgets/stat-cards.widget
```

The folder name must be `stat-cards.widget`, because the widget runs `stat-cards.widget/fetch.py`.

Next, copy the example config and edit it:

```bash
cp ~/Library/Application\ Support/Übersicht/widgets/stat-cards.widget/config.example.json ~/Library/Application\ Support/Übersicht/widgets/stat-cards.widget/config.json
```

Until a `config.json` exists, the widget shows the example cards. `config.json` is git-ignored, so `git pull` never overwrites it.

To have it on screen from login, turn on **Launch Übersicht when I login** in Übersicht's preferences.

## Config

```json
{
  "lang": "en",
  "cards": [
    {
      "title": "Bitcoin",
      "color": "#F7931A",
      "url": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      "fields": [
        { "label": "USD", "path": "bitcoin.usd", "prefix": "$", "decimals": 0 },
        { "label": "24h", "path": "bitcoin.usd_24h_change", "format": "change", "unit": "%" }
      ]
    },
    { "title": "This Mac", "command": "df -h / | awk 'NR==2 {print $5}'", "fields": [{ "label": "Disk used" }] },
    { "type": "nba-player", "player": "Stephen Curry" }
  ]
}
```

| Key | Meaning |
|---|---|
| `lang` | `"en"` or `"mn"` (Mongolian) |
| `title`, `color` | Card heading, and the colour of its top stripe |
| `url` | A JSON endpoint. `headers` (an object) is optional, e.g. for an API key |
| `command` | A shell command. JSON output is read like a URL's; any other output is shown as text |
| `fields` | Up to 4 tiles per card |
| `path` | Where the value sits in the JSON, as a dotted path: `bitcoin.usd`, `items.0.name`. Leave it out to use the whole output |
| `format` | `"change"` adds a +/− sign and green/red colour |
| `decimals`, `prefix`, `unit` | Number formatting, e.g. `"prefix": "$"`, `"unit": "%"` |
| `"type": "nba-player"` | With `player` set to a name (`"LeBron James"`) or an ESPN athlete id (`"1966"`) |

For an NBA player card:
- A name is looked up with ESPN's search once, then cached.
- If two players share a name, use the id. It is the number in the player's ESPN URL.
- The card takes the team colours and headshot from ESPN.

A card whose source is down keeps its last value. A broken card shows its own error, and the other cards keep working.

## Other settings

These live in `index.jsx`:
- **Refresh rate:** `refreshFrequency`. The default is 1 minute; mind the rate limits of the APIs you use.
- **Position and width:** `export const className`, at the bottom of the file.

## How it works

`fetch.py` uses only the Python standard library. It reads the config and fetches all the cards in parallel. It then prints one small JSON object, which the widget renders.

## Disclaimer

This is a fan project. It is not affiliated with the NBA, its teams or players, ESPN, or any API it is pointed at. The ESPN endpoints are unofficial and may change without notice.

## License

[MIT](LICENSE)
