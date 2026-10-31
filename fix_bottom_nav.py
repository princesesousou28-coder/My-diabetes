from pathlib import Path
p=Path('/home/ubuntu/diabetes-care-ar/client/src/pages/Home.tsx')
s=p.read_text()
old='<nav className="fixed bottom-3 left-3 right-3 z-20 flex items-center justify-around rounded-[22px] border border-white/80 bg-white/90 px-2 py-2 shadow-[0_15px_45px_rgba(26,73,92,.14)] backdrop-blur-xl lg:hidden">{navItems.slice(0, 5).map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[15px] py-2 text-[9px] font-bold transition ${section === item.id ? "bg-[#e1f5f1] text-[#0b7772]" : "text-slate-400"}`}><Icon size={17} /><span>{item.label}</span></button>; })}</nav>'
new='<nav className="mobile-bottom-nav fixed bottom-3 left-3 right-3 z-20 grid grid-cols-5 items-stretch gap-1 rounded-[22px] border border-white/80 bg-white/90 px-2 py-2 shadow-[0_15px_45px_rgba(26,73,92,.14)] backdrop-blur-xl lg:hidden" aria-label="التنقل السريع">{navItems.slice(0, 5).map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={`mobile-bottom-nav-item flex min-w-0 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[15px] px-1 py-2 text-center text-[9px] font-bold leading-tight transition ${section === item.id ? "bg-[#e1f5f1] text-[#0b7772]" : "text-slate-400"}`}><Icon size={17} className="shrink-0" /><span className="block w-full truncate">{item.label}</span></button>; })}</nav>'
if old not in s:
    raise SystemExit('bottom nav block not found')
p.write_text(s.replace(old,new,1))

css=Path('/home/ubuntu/diabetes-care-ar/client/src/index.css')
style='''\n.mobile-bottom-nav { direction: rtl; min-height: 66px; padding-bottom: max(8px, env(safe-area-inset-bottom)); }\n.mobile-bottom-nav-item { min-height: 50px; }\n@media (min-width: 768px) and (max-width: 1100px) {\n  .mobile-bottom-nav { left: 16px; right: 16px; max-width: 760px; margin-inline: auto; }\n}\n'''
content=css.read_text()
if '.mobile-bottom-nav {' not in content:
    css.write_text(content+style)
''