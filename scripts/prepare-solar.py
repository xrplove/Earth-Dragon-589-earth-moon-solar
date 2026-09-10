"""Download/cache and bundle JPL geometric state vectors, one request at a time.
Usage: python3 scripts/prepare-solar.py /tmp/solar-source
No API is used by the deployed page. Each body file preserves the exact query/header.
"""
import json,sys,time,urllib.parse,urllib.request,hashlib
from pathlib import Path
cache=Path(sys.argv[1]);cache.mkdir(parents=True,exist_ok=True)
out=Path(__file__).resolve().parents[1]/'public/data/solar';out.mkdir(parents=True,exist_ok=True)
# id, name, parent, mean radius km, representative orbital period days, color
bodies=[
(199,'Mercury',10,2439.4,87.969,'#b9aca0'),(299,'Venus',10,6051.8,224.701,'#e0c68d'),(399,'Earth',10,6371,365.256,'#6eafda'),(499,'Mars',10,3389.5,686.98,'#ce835d'),(599,'Jupiter',10,69911,4332.59,'#ddbd94'),(699,'Saturn',10,58232,10759.22,'#e3d3a4'),(799,'Uranus',10,25362,30688.5,'#a1d4d8'),(899,'Neptune',10,24622,60182,'#678ce0'),
(301,'Moon',399,1737.4,27.322,'#c1c3c5'),(401,'Phobos',499,11.08,.31891,'#aca294'),(402,'Deimos',499,6.2,1.2624,'#bcb2a1'),
(501,'Io',599,1821.6,1.769,'#e3cd72'),(502,'Europa',599,1560.8,3.551,'#c8bda0'),(503,'Ganymede',599,2634.1,7.155,'#a8a5a0'),(504,'Callisto',599,2410.3,16.689,'#93918a'),
(601,'Mimas',699,198.2,.942,'#aaa9a3'),(602,'Enceladus',699,252.1,1.37,'#e1e6e9'),(603,'Tethys',699,531.1,1.888,'#babfc2'),(604,'Dione',699,561.4,2.737,'#bcc1c4'),(605,'Rhea',699,763.5,4.518,'#bab6ad'),(606,'Titan',699,2574.7,15.945,'#d0a664'),(608,'Iapetus',699,734.5,79.321,'#ada699'),
(701,'Ariel',799,578.9,2.52,'#bec1c2'),(702,'Umbriel',799,584.7,4.144,'#979c9e'),(703,'Titania',799,788.9,8.706,'#b1b6b7'),(704,'Oberon',799,761.4,13.463,'#a4a7a9'),(705,'Miranda',799,235.8,1.413,'#c2bdae'),(801,'Triton',899,1353.4,5.877,'#d7c7c0'),(808,'Proteus',899,210,1.122,'#989b9f')]
meta=[]
for id,name,parent,radius,period,color in bodies:
 path=cache/f'{id}.json'
 query={'format':'json','COMMAND':f"'{id}'",'CENTER':f"'500@{parent}'",'EPHEM_TYPE':'VECTORS','START_TIME':"'2026-01-01'",'STOP_TIME':"'2027-01-01'",'STEP_SIZE':"'1 d'" if parent==10 else "'1 h'",'VEC_TABLE':'2','CSV_FORMAT':'YES','OUT_UNITS':'KM-S','REF_PLANE':'ECLIPTIC','VEC_CORR':'NONE','TIME_TYPE':'UT'}
 if not path.exists():
  for attempt in range(3):
   try:
    with urllib.request.urlopen('https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(query),timeout=90) as response:raw=json.load(response)
    assert '$$SOE' in raw.get('result',''),raw.get('error',raw.get('result','')[:300]);raw['query']=query;path.write_text(json.dumps(raw));break
   except Exception:
    if attempt==2:raise
    time.sleep(2)
 raw=json.loads(path.read_text());rows=[];dates=[]
 for line in raw['result'].split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
  cols=[c.strip() for c in line.split(',')];dates.append(round((float(cols[0])-2440587.5)*86400000));rows.append([round(float(c),6) for c in cols[2:8]])
 step=dates[1]-dates[0];assert all(b-a==step for a,b in zip(dates,dates[1:]));assert len(rows)>360
 info={'id':id,'name':name,'parent':parent,'radius':radius,'period':period,'color':color,'texture':('/textures/earth-detail.jpg' if id==399 else '/textures/moon/color.jpg' if id==301 else f'/textures/solar/{name.lower()}.jpg' if parent==10 else None)}
 payload={'meta':{'query':raw['query'],'header':raw['result'].split('$$SOE')[0],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'frame':'geometric ecliptic J2000, relative to parent center','units':'positions km; velocities km/s','interpolation':'cubic Hermite position/velocity'},'start':dates[0],'step':step,'states':rows}
 (out/f'{id}.json').write_text(json.dumps(payload,separators=(',',':')));meta.append(info);print(name,len(rows),'states',flush=True)
(out/'catalog.json').write_text(json.dumps({'start':'2026-01-01','end':'2027-01-01','source':'NASA/JPL Horizons','coverage':'8 planets and 21 selected moons. Not all known moons. Surface appearance and rotation are illustrative.','bodies':meta},separators=(',',':')))
