from pathlib import Path
p=Path('/home/ubuntu/diabetes-care-ar/client/src/pages/Home.tsx')
s=p.read_text()
first=s.find('  HeartPulse,\n')
second=s.find('  HeartPulse,\n', first+1)
if second >= 0: s=s[:second]+s[second+len('  HeartPulse,\n'):]
s=s.replace('setNutrition(current => ({ calories:', 'setNutrition((current: any) => ({ calories:')
p.write_text(s)
