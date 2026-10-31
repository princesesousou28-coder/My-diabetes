from pathlib import Path
p=Path('/home/ubuntu/diabetes-care-ar/client/src/pages/Home.tsx')
s=p.read_text().replace('نتيجة التحليل</div>', 'التقييم والبدائل والوصفات</div>')
s=s.replace('max-h-28 overflow-auto whitespace-pre-wrap', 'max-h-40 overflow-auto whitespace-pre-wrap')
p.write_text(s)
