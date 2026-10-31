from pathlib import Path
p=Path('/home/ubuntu/diabetes-care-ar/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('الاقتراح الحالي: **${preferred}** لمسافة تقريبية ${dailyDistance} كم.', 'الاقتراح الحالي: <b>{preferred}</b> لمسافة تقريبية <b>{dailyDistance} كم</b>.')
p.write_text(s)
