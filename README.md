# PoliticalMapApp: Ages of Rule

A timeline of governance systems, from Sumerian city-states to the European Union. Static site, no build step, no dependencies.

- **Home** – a skyline of how many systems were alive in each year, with a draggable year marker.
- **Timeline** – every system as a bar, grouped by family; zoom to an era, filter, search, share a link to one system.
- **All systems** – a sortable index.
- **System pages** – dates, story, lineage, and everything alive at the same time.
- **About the data** – method, conventions and known gaps.

## Run it

```bash
npx serve .      # or: python3 -m http.server
```

Open the printed URL. Opening `index.html` directly will not work, because the data is loaded with `fetch`.

## Data

Curated systems are in `data/systems.json`. `data/countries.json` is generated from the [CountryData](https://github.com/SolutionsAsService/CountryData) atlas by `python3 scripts/import-countrydata.py <path-to-CountryData>`; the charts can add it with one click.

All content lives in `data/systems.json`. Years are signed (negative = BCE); `end: null` means still in existence. Check your edit with:

```bash
node scripts/check-data.mjs
```

Every figure shown on the site is computed from that file (see `figures()` in `assets/common.js`). See [CONTRIBUTING.md](CONTRIBUTING.md) to fix a fact or add a system.
