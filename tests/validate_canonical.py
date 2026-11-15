"""Validasi data kanonik KUHP DIGITAL.

Jalankan dari mana saja:
    python3 tests/validate_canonical.py
"""
import json
import os
import re
import html

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

D = json.load(open(os.path.join(AKAR, 'src', 'data', 'kuhp-data.json')))
P = {a['nomor']: a for a in D['pasal']}
print('meta stats:', json.dumps(D['meta']['statistik'], indent=1))
ok = True
def chk(cond, msg):
    global ok
    print(('  OK  ' if cond else '  FAIL') + '  ' + msg)
    if not cond: ok = False

chk(len(P) == 624, f'jumlah pasal = {len(P)}')
chk(sorted(P) == list(range(1, 625)), 'nomor pasal lengkap 1..624 tanpa celah')
chk(all(a['buku'] for a in D['pasal']), 'semua pasal punya buku')
chk(all(a['bab'] for a in D['pasal']), 'semua pasal punya bab')
chk(all(a['babJudul'] for a in D['pasal']), 'semua pasal punya judul bab')
# hierarchy consistency
buku1 = [a for a in D['pasal'] if a['buku'] == 'BUKU KESATU']
buku2 = [a for a in D['pasal'] if a['buku'] == 'BUKU KEDUA']
chk(len(buku1) == 187, f'Buku Kesatu = {len(buku1)} pasal (1-187)')
chk(len(buku2) == 437, f'Buku Kedua = {len(buku2)} pasal (188-624)')
chk({a['bab'] for a in buku1} == {'I','II','III','IV','V','VI'}, 'Buku Kesatu 6 bab')
chk(len({a['bab'] for a in buku2}) == 37, f"Buku Kedua {len({a['bab'] for a in buku2})} bab")
# no empty — teksPolos/penjelasanPolos sengaja dihapus dari JSON (dihitung saat runtime),
# jadi validasi memakai teks HTML yang tersedia.
def _polos(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h or '')).strip()
chk(all(_polos(a['teks']) for a in D['pasal']), 'tidak ada redaksi kosong')
chk(all(_polos(a['penjelasan']) for a in D['pasal']), 'tidak ada penjelasan kosong')
chk(all(_polos(a['teks']) for a in D['pasal']), 'tidak ada redaksi yang hanya berisi markup')
# tags
bad = [a['nomor'] for a in D['pasal'] if a['teks'].count('<li') != a['teks'].count('</li>')]
chk(not bad, f'tag <li> seimbang di semua pasal {bad[:5]}')
bad = [a['nomor'] for a in D['pasal'] if len(re.findall(r'<p[ >]', a['teks'])) != a['teks'].count('</p>')]
chk(not bad, f'tag <p> seimbang di semua pasal {bad[:5]}')
# ayat sequence
issues = []
for a in D['pasal']:
    nums = [x['nomor'] for x in a['ayat'] if x['nomor']]
    if nums != list(range(1, len(nums) + 1)):
        issues.append((a['nomor'], nums))
chk(not issues, f'urutan ayat berurutan di semua pasal {issues[:5]}')
# artefak
ART = ['Berikut adalah', '```', 'Agar tidak melebihi', 'verbatim']
found = [(a['nomor'], w) for a in D['pasal'] for w in ART
         if w in a['teks'] or w in a['penjelasan']]
chk(not found, f'tidak ada artefak AI/kode {found[:5]}')
# 610 / 622
chk(len(P[610]['ayat']) == 2, f"Pasal 610 punya {len(P[610]['ayat'])} ayat (sesuai sumber resmi)")
chk(len(P[622]['ayat']) == 21, f"Pasal 622 punya {len(P[622]['ayat'])} ayat")
chk(P[610]['ayat'][1]['nomor'] == 2 and len(P[610]['ayat'][1]['huruf']) == 3, 'Pasal 610 ayat (2) lengkap 3 butir')
chk('kategori VI.' in _polos(P[610]['teks']), 'Pasal 610 berakhir lengkap dengan kategori VI')
# corrections
kor = json.load(open(os.path.join(AKAR, 'src', 'data', 'koreksi.json')))
chk(len(kor['log']) >= 30, f'log koreksi = {len(kor["log"])} entri')
chk(all(P[l['pasal']]['adaKoreksi'] for l in kor['log']), 'setiap koreksi tertaut ke pasal')
# spot checks against official
print('\n--- spot check redaksi ---')
for n, frag in [(476, 'mengambil suatu Barang yang sebagian atau seluruhnya milik orang lain'),
                (458, 'merampas nyawa orang lain, dipidana karena pembunuhan'),
                (411, 'dipidana karena perzinaan'),
                (433, 'dipidana karena pencemaran'),
                (486, 'dipidana karena penggelapan'),
                (492, 'memakai nama palsu atau kedudukan palsu'),
                (591, 'Dipidana karena penadahan'),
                (597, 'hukum yang hidup dalam masyarakat'),
                (624, 'mulai berlaku setelah 3 (tiga) tahun')]:
    chk(frag in _polos(P[n]['teks']), f'Pasal {n} memuat frasa kunci')
print('\n--- spot check koreksi ---')
for n, frag in [(342, 'menjual, menyerahkan, menawarkan'),
                (372, 'mengumumkan seluruh atau sebagian Surat'),
                (417, 'menyalahgunakan wibawa yang timbul dari'),
                (587, 'dapat menghancurkan atau mengakibatkan'),
                (507, 'memengaruhi supaya membeli'),
                (196, 'Yang dimaksud dengan "mempersiapkan"'),
                (125, 'konkursus idealis'),
                (450, 'memperdagangkan orang')]:
    chk(frag in (_polos(P[n]['teks']) if n not in (196,125,450) else _polos(P[n]['penjelasan'])),
        f'Pasal {n} terkoreksi sesuai sumber resmi')
print('\n--- metadata turunan ---')
a = P[476]
print('  Pasal 476 ancaman:', json.dumps(a['ancaman']['penjara']), json.dumps(a['ancaman']['denda']))
print('  Pasal 476 kataKunci:', a['kataKunci'][:8])
print('  Pasal 476 rujukan:', a['rujukan'][:3])
print('  Pasal 458 ayat:', [(x['nomor'], len(x['huruf'])) for x in P[458]['ayat']])
print('  Pasal 607 huruf:', [(x['nomor'], [h['label'] for h in x['huruf']]) for x in P[607]['ayat']][:3])
mat = sum(1 for a in D['pasal'] if a['ancaman']['mati'])
print('  pasal dengan ancaman pidana mati:', mat)
print('\nRESULT:', 'SEMUA LULUS' if ok else 'ADA KEGAGALAN')
