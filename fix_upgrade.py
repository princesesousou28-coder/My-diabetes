from pathlib import Path
p=Path('/home/ubuntu/diabetes-care-ar/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('result={arguments?.dailyResult} loading={arguments?.dailyLoading} onRun={arguments?.runDailyAnalysis}', 'result={dailyResult} loading={dailyLoading} onRun={onRunDailyAnalysis}')
s=s.replace('function MovementSection() {', 'function MovementSection({ profile, bmi }: any) {')
s=s.replace('}\n275\tfunction FoodSection', '}\n\nfunction FoodSection')
# generated output had literal line number only if present; normalize accidental adjacent braces
s=s.replace('</div>;\n}275\tfunction FoodSection', '</div>;\n}\n\nfunction FoodSection')
p.write_text(s)
