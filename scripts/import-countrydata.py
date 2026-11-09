#!/usr/bin/env python3
"""Build data/countries.json from a clone of SolutionsAsService/CountryData.

    python3 scripts/import-countrydata.py /path/to/CountryData

Only two things are taken from each record: its government type and the year it
began (independence or founding). Records where no start year can be read with
confidence are skipped and listed, never guessed. Family is derived from the
government-type text by the keyword rules in family(); the original text is kept
in `govType` so every classification can be checked.
"""
import json, re, sys, pathlib

root = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent.parent / "data" / "countries.json"
index = json.loads((root / "data" / "index.json").read_text(encoding="utf-8"))

# Already drawn as curated systems in data/systems.json; not repeated as countries.
CURATED = {"united-states", "cuba", "saudi-arabia", "iran", "china", "china-prc", "north-korea"}

def unwrap(d):
    if len(d) == 1:
        v = next(iter(d.values()))
        if isinstance(v, dict):
            return v
    return d

def get(d, *names):
    for k, v in d.items():
        if k.lower().replace("_", "").replace(" ", "") in names:
            return v
    return None

def leaves(o, path=()):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from leaves(v, path + (k,))
    elif isinstance(o, (str, int)) and not isinstance(o, bool):
        yield path, str(o)

def year(s):
    m = re.search(r"(?<!\d)(\d{3,4})\s*(BCE|BC)?", s)
    if not m:
        return None
    y = int(m.group(1))
    return -y if m.group(2) else y

TIERS = [
    lambda k, v: re.search(r"from|independence", k, re.I) and not re.search(r"recogni|admi|un |join|constitution", k, re.I),
    lambda k, v: re.search(r"declar|proclam", k, re.I),
    lambda k, v: re.search(r"found|unif|formation|establish|confedera|federation", k, re.I),
]

def start_year(d):
    for section in [k for k in d if re.fullmatch(r"(?i)government|history|independence|formation|founding|foundation|modern[_ ]?history|colonial[_ ]?history", k)]:
        sec = d.get(section)
        if not isinstance(sec, (dict, str)):
            continue
        if isinstance(sec, str):
            continue
        ls = [(p, v) for p, v in leaves(sec)]
        for tier in TIERS:
            for p, v in ls:
                k = p[-1]
                # a leaf that is a plain "Independence" key counts; one under an Independence dict must itself say "from"
                y = year(v)
                if tier(k, v) and y is not None and (y < 0 or 800 <= y <= 2025):
                    return y, "/".join(p)
    return None

def family(t):
    s = t.lower()
    if re.search(r"theocra|islamic emirate|islamic republic", s): return "theocracy"
    if re.search(r"monarch|kingdom|emirate|sultanate", s) and "republic" not in s: return "monarchy"
    if re.search(r"one-party|single-party|marxist|communist|dictator|junta|authoritarian|totalitarian|dominant-party|military", s): return "authoritarian"
    if re.search(r"federal|confedera", s): return "federal"
    return "republic"

records = []
skipped = []
for r in index["records"]:
    if r["kind"] != "country" or r["slug"] in CURATED or "/" in r["path"].replace("data/countries/", ""):
        continue
    try:
        d = unwrap(json.loads((root / r["path"]).read_text(encoding="utf-8")))
    except Exception as e:
        skipped.append((r["slug"], "unreadable"))
        continue
    g = get(d, "government") or {}
    t = get(g, "type", "governmenttype") if isinstance(g, dict) else None
    if not isinstance(t, str) or not t.strip():
        skipped.append((r["slug"], "no government type")); continue
    sy = start_year(d)
    if not sy:
        skipped.append((r["slug"], "no start year")); continue
    y, key = sy
    leg = get(g, "legislature") if isinstance(g, dict) else None
    records.append({
        "id": "cd-" + r["slug"], "name": r["name"], "family": family(t), "kind": "state",
        "start": y, "end": None, "region": r.get("region") or "",
        "origin": "Independence or founding year as recorded in CountryData (" + key + ")",
        "ending": "Still in existence",
        "summary": "Government today: " + t.strip().rstrip(".") + "." + (" Legislature: " + leg + "." if isinstance(leg, str) else ""),
        "govType": t.strip(), "source": "CountryData",
    })

# Historical states: period and government type are read by hand from data/historical/*.json (file named in `source`).
H = [
 ("austro-hungarian-empire","Austro-Hungarian Empire","empire",1867,1918,"Constitutional dual monarchy"),
 ("czechoslovakia","Czechoslovakia","republic",1918,1992,None),
 ("yugoslavia","Yugoslavia","federal",1918,1992,None),
 ("first-austrian-republic","First Austrian Republic","republic",1919,1934,"Federal parliamentary republic"),
 ("federal-state-austria","Federal State of Austria","authoritarian",1934,1938,"Federal one-party austrofascist parliamentary republic under an authoritarian dictatorship"),
 ("second-polish-republic","Second Polish Republic","republic",1918,1939,None),
 ("east-germany","East Germany","authoritarian",1949,1990,None),
 ("west-germany","West Germany","republic",1949,1990,"Federal parliamentary constitutional republic"),
 ("serbia-and-montenegro","Serbia and Montenegro","federal",1992,2006,None),
 ("republic-of-cuba","Republic of Cuba (1902–1959)","republic",1902,1959,None),
 ("swedish-empire","Swedish Empire","monarchy",1611,1721,None),
 ("duchy-of-prussia","Duchy of Prussia","monarchy",1525,1701,"Feudal monarchy"),
 ("qajar-iran","Qajar Iran","monarchy",1789,1925,None),
 ("korean-empire","Korean Empire","monarchy",1897,1910,"Unitary absolute monarchy"),
 ("lan-xang","Lan Xang","monarchy",1353,1707,"Absolute monarchy"),
 ("omani-empire","Omani Empire","empire",1696,1856,"Monarchy"),
 ("kingdom-of-tungning","Kingdom of Tungning","monarchy",1661,1683,"Monarchy"),
 ("kingdom-of-hejaz-and-nejd","Kingdom of Hejaz and Nejd","monarchy",1926,1932,"Islamic absolute dual monarchy"),
]
hist = []
for slug, name, fam, a, b, t in H:
    hist.append({
        "id": "cd-" + slug, "name": name, "family": fam, "kind": "state", "start": a, "end": b,
        "region": "", "origin": "Period as recorded in CountryData", "ending": "Ended " + str(b),
        "summary": ("Government: " + t + "." if t else "Government type is not recorded in CountryData; family assigned by the editors."),
        "govType": t or "", "source": "CountryData data/historical/" + slug + ".json",
    })

records.sort(key=lambda s: s["start"])
out.write_text(json.dumps(records + hist, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(len(records), "countries,", len(hist), "historical;", len(skipped), "skipped")
for s in skipped: print("  skipped", *s)
