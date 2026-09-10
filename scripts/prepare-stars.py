"""Build a compact HYG 4.1 subset: python3 scripts/prepare-stars.py /path/to/hygdata_v41.csv"""
import csv, json, sys
from pathlib import Path
stars=[]
for row in csv.DictReader(open(sys.argv[1])):
    if row['id']=='0' or float(row['mag'])>6.5:
        continue
    stars.append([int(row['id']),round(float(row['ra']),6),round(float(row['dec']),6),round(float(row['mag']),2),round(float(row['ci']),3) if row['ci'] else .65])
result={'catalog':'HYG 4.1','author':'David Nash / Astronomy Nexus','license':'CC BY-SA 4.0','source':'https://github.com/astronexus/HYG-Database','epoch':'J2000','selection':'Apparent magnitude <= 6.5, excluding Sol','fields':['hyg_id','ra_hours','dec_degrees','apparent_magnitude','bv_color_index'],'stars':stars}
Path('public/data/stars.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print(f'Wrote {len(stars)} measured star directions and magnitudes.')
