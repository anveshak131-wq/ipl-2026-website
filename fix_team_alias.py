with open('src/app/ipl-admin-2026/matches/page.tsx', 'r') as f:
    content = f.read()

old = '        const findTeam = (raw: string) => {\n            const norm = normaliseName(raw);\n            if (!norm || norm === \'tbd\') return null;'

new = (
    '        const findTeam = (raw: string) => {\n'
    '            // Historical franchise renames \u2014 map old names to current names\n'
    '            const HISTORICAL_ALIASES: Record<string, string> = {\n'
    "                'kings xi punjab':     'Punjab Kings',\n"
    "                'kings eleven punjab': 'Punjab Kings',\n"
    "                'delhi daredevils':    'Delhi Capitals',\n"
    '            };\n'
    '            const resolved = HISTORICAL_ALIASES[raw.trim().toLowerCase()] ?? raw;\n'
    '            const norm = normaliseName(resolved);\n'
    "            if (!norm || norm === 'tbd') return null;"
)

if old in content:
    content = content.replace(old, new, 1)
    with open('src/app/ipl-admin-2026/matches/page.tsx', 'w') as f:
        f.write(content)
    print('SUCCESS: historical alias map added to findTeam')
else:
    idx = content.find('const findTeam')
    if idx >= 0:
        print('findTeam found but old string did not match. Context:')
        print(repr(content[idx:idx+300]))
    else:
        print('ERROR: findTeam not found in file')
