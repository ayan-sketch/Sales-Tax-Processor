import json
from pathlib import Path

G = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))

nodes = G['nodes']
edges = G['links']

target_ids = set()
for n in nodes:
    nid = n['id']
    label = n.get('label', nid).lower()
    if '165' in nid or '165' in label or 'statement' in label:
        target_ids.add(nid)
        print(f'NODE: {nid}')
        print(f'  label: {n.get("label","")}')
        print(f'  type: {n.get("type","")}')
        print(f'  file: {n.get("file","")}')
        print()

print('=== EDGES involving 165 nodes ===')
for e in edges:
    s, t = e['source'], e['target']
    if s in target_ids or t in target_ids:
        other = t if s in target_ids else s
        marker = ' *' if other in target_ids else ''
        print(f'  {s} --{e.get("type","?")}--> {t}{marker}')

print()
print(f'Total 165-related nodes: {len(target_ids)}')
