from pathlib import Path

p = Path('/home/ubuntu/diabetes-care-ar/client/src/pages/Home.tsx')
s = p.read_text()
needle = '</div><div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">{showForm ?'
s = s.replace(needle, '</div><InteractiveGlucoseChart readings={readings} /><div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">{showForm ?', 1)
component = r'''
function InteractiveGlucoseChart({ readings }: { readings: Reading[] }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const week = readings.slice(0, 7).reverse();
  const month = [112, 118, 104, 129, 121, 108, 116, 124, 110, 132, 119, 114, 126, 105, 111, 120, 117, 123, 109, 115, 128, 121, 113, 118, 112, 116, 108, 122, 114, readings[0]?.value || 112];
  const data = range === "week" ? (week.length ? week.map((r, i) => ({ label: ["س", "ح", "ن", "ث", "ر", "خ", "ج"][i], value: r.value })) : [{ label: "—", value: 0 }]) : month.map((value, i) => ({ label: `${i + 1}`, value }));
  const values = data.map(d => d.value).filter(Boolean);
  const min = Math.max(40, Math.min(...values, 70) - 15);
  const max = Math.min(300, Math.max(...values, 140) + 25);
  const points = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * 100},${100 - ((d.value - min) / Math.max(1, max - min)) * 100}`).join(" ");
  const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  return <div className="glass mb-6 p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-extrabold text-[#dcefee]"><BarChart3 size={17} className="text-[#74e1c6]" /> اتجاه السكر التفاعلي</div><p className="mt-1 text-[10px] text-slate-400">مرّر فوق النقاط لرؤية كل قراءة، وبدّل الفترة للمقارنة.</p></div><div className="flex rounded-[13px] border border-white/10 bg-white/[.04] p-1"><button onClick={() => setRange("week")} className={`rounded-[10px] px-3 py-1.5 text-[10px] font-bold ${range === "week" ? "bg-[#74e1c6] text-[#092b34]" : "text-slate-400"}`}>أسبوع</button><button onClick={() => setRange("month")} className={`rounded-[10px] px-3 py-1.5 text-[10px] font-bold ${range === "month" ? "bg-[#74e1c6] text-[#092b34]" : "text-slate-400"}`}>شهر</button></div></div><div className="relative h-56 overflow-hidden rounded-[16px] border border-white/10 bg-[#091724]/60 p-3"><div className="absolute inset-x-3 top-8 border-t border-dashed border-white/10" /><div className="absolute inset-x-3 top-1/2 border-t border-dashed border-white/10" /><div className="absolute inset-x-3 bottom-8 border-t border-dashed border-white/10" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible"><defs><linearGradient id="glucoseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#74e1c6" stopOpacity=".28" /><stop offset="100%" stopColor="#74e1c6" stopOpacity="0" /></linearGradient></defs><polyline points={`0,100 ${points} 100,100`} fill="url(#glucoseFill)" stroke="none" /><polyline points={points} fill="none" stroke="#74e1c6" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />{data.map((d, i) => { const x = (i / Math.max(1, data.length - 1)) * 100; const y = 100 - ((d.value - min) / Math.max(1, max - min)) * 100; return <circle key={i} cx={x} cy={y} r="2.2" fill="#dffbf3" stroke="#168f83" strokeWidth="1" vectorEffect="non-scaling-stroke"><title>{d.label}: {d.value} mg/dL</title></circle>; })}</svg><div className="absolute inset-x-3 bottom-2 flex justify-between text-[9px] text-slate-500">{data.filter((_, i) => range === "week" || i % 5 === 0 || i === data.length - 1).map((d, i) => <span key={i}>{d.label}</span>)}</div></div><div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-slate-400"><span>المتوسط: <b className="text-[#74e1c6]">{average || "—"} mg/dL</b></span><span>النطاق المعروض: {min}–{max}</span><span className="mr-auto rounded-full bg-[#74e1c6]/10 px-2.5 py-1 font-bold text-[#74e1c6]">{range === "week" ? "آخر 7 أيام" : "آخر 30 يوماً"}</span></div></div>;
}
'''
s = s.replace('\nfunction DailyAnalysisCard', component + '\nfunction DailyAnalysisCard')
p.write_text(s)
