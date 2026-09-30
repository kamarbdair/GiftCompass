#!/usr/bin/env python3
"""Generate the GiftCompass pgfgantt schedule and validate every span/link."""

WEEKS = 39
MONTHS = [("Sep 2026",4),("Oct 2026",5),("Nov 2026",4),("Dec 2026",4),
          ("Jan 2027",5),("Feb 2027",4),("Mar 2027",4),("Apr 2027",5),("May 2027",4)]
SEMESTERS = [("Semester 1 --- Analysis \\& Design (Sep--Dec 2026)",17),
             ("Semester 2 --- Implementation, Testing \\& Delivery (Jan--May 2027)",22)]

# (id, kind, label, start, end)   kind: group | bar | ms
ROWS = [
 ("p1","group","Phase 1 --- Requirements Engineering",1,7),
 ("t11","bar","T1.1 Problem definition and project scope",1,2),
 ("t12","bar","T1.2 Literature review on gift recommender systems",1,4),
 ("t13","bar","T1.3 User and stakeholder requirements (Jeddah)",2,5),
 ("t14","bar","T1.4 Functional and non-functional requirements",4,6),
 ("t15","bar","T1.5 Software Requirements Specification (SRS)",6,7),
 ("m1","ms","M1 --- Requirements completed",7,7),

 ("p2","group","Phase 2 --- Feasibility \& Analysis",4,10),
 ("t21","bar","T2.1 Technical feasibility assessment",4,6),
 ("t22","bar","T2.2 Legal and privacy analysis (Saudi PDPL, platform terms)",5,8),
 ("t23","bar","T2.3 Data-source study: TikTok access routes and consent",6,9),
 ("t24","bar","T2.4 Economic feasibility and cost analysis",8,9),
 ("t25","bar","T2.5 Feasibility study report",9,10),
 ("m2","ms","M2 --- Feasibility completed",10,10),

 ("p3","group","Phase 3 --- System Design",10,17),
 ("t31","bar","T3.1 System architecture design",10,13),
 ("t32","bar","T3.2 Data model design (Recipient Profile, product catalogue)",12,14),
 ("t33","bar","T3.3 Database design (ERD and data storage)",13,16),
 ("t34","bar","T3.4 UI/UX wireframes and user-flow design",13,16),
 ("t35","bar","T3.5 Interface design (Arabic/English, mobile-first)",15,17),
 ("t36","bar","T3.6 Consent and privacy design (bilingual screens)",14,17),
 ("t37","bar","T3.7 Recommendation engine design (matching, filtering, ranking)",14,17),
 ("t38","bar","T3.8 Software Design Document (SDD)",16,17),
 ("m3","ms","M3 --- Design completed",17,17),

 ("p4","group","Phase 4 --- Implementation",16,32),
 ("t41","bar","T4.1 Development environment setup",16,17),
 ("t42","bar","T4.2 Database implementation and data setup",18,20),
 ("t43","bar","T4.3 Product catalogue module (Jeddah products, prices in SAR)",18,23),
 ("t44","bar","T4.4 Backend services and application logic",19,23),
 ("t45","bar","T4.5 Web interface: landing and gift request screens",20,24),
 ("t46","bar","T4.6 Recipient questionnaire module",22,25),
 ("t47","bar","T4.7 Recipient Profile Builder (interest extraction, weighting)",23,27),
 ("t48","bar","T4.8 Gift matching module (Arabic/English candidate retrieval)",25,28),
 ("t49","bar","T4.9 Filtering module (budget, relationship, occasion, delivery)",26,28),
 ("t410","bar","T4.10 Ranking and scoring module",28,31),
 ("t411","bar","T4.11 Recommendation explanation module",31,32),
 ("t412","bar","T4.12 Results, refinement and feedback interface",29,32),
 ("t413","bar","T4.13 TikTok Gift Profile: consent, upload and approval flow",24,28),
 ("t414","bar","T4.14 TikTok interest extraction into Recipient Profile",28,31),
 ("t415","bar","T4.15 Security, privacy and consent implementation (PDPL)",28,32),
 ("m4","ms","M4 --- Feature-complete build",32,32),

 ("p5","group","Phase 5 --- Integration",30,33),
 ("t51","bar","T5.1 Module integration",30,32),
 ("t52","bar","T5.2 End-to-end system integration",32,33),
 ("m5","ms","M5 --- Integrated system",33,33),

 ("p6","group","Phase 6 --- Testing \& Debugging",24,35),
 ("t61","bar","T6.1 Unit testing (alongside module development)",24,32),
 ("t62","bar","T6.2 Integration testing",32,34),
 ("t63","bar","T6.3 System testing",33,35),
 ("t64","bar","T6.4 Security and privacy (PDPL) testing",33,35),
 ("t65","bar","T6.5 Usability testing with target users",33,35),
 ("t66","bar","T6.6 Debugging and regression testing",32,35),
 ("t67","bar","T6.7 User acceptance testing (UAT)",34,35),
 ("m6","ms","M6 --- Testing completed",35,35),

 ("p7","group","Phase 7 --- Evaluation",33,35),
 ("t71","bar","T7.1 Recommendation quality evaluation against baseline",33,34),
 ("t72","bar","T7.2 Results analysis and discussion",34,35),
 ("m7","ms","M7 --- Evaluation completed",35,35),

 ("p8","group","Phase 8 --- Documentation \& Closure",1,39),
 ("t81","bar","T8.1 Continuous documentation and progress reports",1,35),
 ("t82","bar","T8.2 Final project report",34,38),
 ("t83","bar","T8.3 User manual and deployment guide",35,37),
 ("t84","bar","T8.4 Final presentation and demonstration",36,38),
 ("t85","bar","T8.5 Final submission and project defence",38,39),
 ("m8","ms","M8 --- Final submission",39,39),
]

LINKS = [("t11","t13"),("t12","t14"),("t14","t15"),("t15","m1"),
         ("t21","t24"),("t23","t25"),("t24","t25"),("t25","m2"),
         ("m2","t31"),("t31","t33"),("t31","t34"),("t32","t37"),("t38","m3"),
         ("m3","t42"),("t42","t45"),("t44","t47"),("t47","t410"),("t49","t410"),
         ("t410","t411"),("t413","t414"),("t414","m4"),("t415","m4"),("t411","m4"),
         ("m4","t52"),("t51","t52"),("t52","m5"),
         ("m5","t63"),("m5","t64"),("t62","t67"),("t67","m6"),
         ("m5","t71"),("t71","t72"),("t72","m7"),
         ("m7","t84"),("t82","t85"),("t85","m8")]

# --------------------------------------------------------------- validation
span = {r[0]: (r[3], r[4]) for r in ROWS}
errs = []
if sum(n for _, n in MONTHS) != WEEKS: errs.append('month spans do not total %d' % WEEKS)
if sum(n for _, n in SEMESTERS) != WEEKS: errs.append('semester spans do not total %d' % WEEKS)
for rid, kind, label, s, e in ROWS:
    if not (1 <= s <= e <= WEEKS): errs.append(f'{rid}: bad span {s}-{e}')
    if kind == 'ms' and s != e: errs.append(f'{rid}: milestone must be a single slot')
for a, b in LINKS:
    if a not in span or b not in span: errs.append(f'link {a}->{b}: unknown id'); continue
    if span[b][0] < span[a][1]:
        errs.append(f'link {a}->{b}: target starts w{span[b][0]} before source ends w{span[a][1]}')
# phase groups must cover their tasks
cur = None
for rid, kind, label, s, e in ROWS:
    if kind == 'group': cur = (rid, s, e)
    elif cur and (s < cur[1] or e > cur[2]):
        errs.append(f'{rid} ({s}-{e}) outside group {cur[0]} ({cur[1]}-{cur[2]})')
if errs:
    raise SystemExit('VALIDATION FAILED:\n  ' + '\n  '.join(errs))

# calendar sanity: testing and evaluation must finish before May 2027 (week 36)
may_start = sum(n for _, n in MONTHS[:-1]) + 1
for rid in ('m6', 'm7'):
    assert span[rid][1] < may_start, f'{rid} falls in May'
print(f'validation passed: {len(ROWS)} rows, {len(LINKS)} links, '
      f'{WEEKS} weeks, May starts at week {may_start}')
print(f'  testing complete  w{span["m6"][1]}   evaluation complete w{span["m7"][1]}')

# ------------------------------------------------------------------- emit
def esc(s): return s

lines = []
A = lines.append
A(r"\documentclass[10pt]{article}")
A(r"% GiftCompass --- Project Development Schedule (Gantt chart)")
A(r"% Built with the pgfgantt package, following the Overleaf pgfgantt example.")
A(r"% Compile with pdfLaTeX.")
A(r"\usepackage[a3paper,landscape,margin=1.4cm]{geometry}")
A(r"% For A4 instead, replace the line above with:")
A(r"% \usepackage[a4paper,landscape,margin=1cm]{geometry}  % also set y unit chart=0.24cm below")
A(r"\usepackage[T1]{fontenc}")
A(r"\usepackage{lmodern}")
A(r"\usepackage{amssymb}")
A(r"\usepackage{xcolor}")
A(r"\usepackage{pgfgantt}")
A(r"\usepackage{caption}")
A("")
A(r"% ---- GiftCompass palette -------------------------------------------------")
A(r"\definecolor{gcBerry}   {HTML}{6D2E46}")
A(r"\definecolor{gcBerryDk} {HTML}{4A1F30}")
A(r"\definecolor{gcRose}    {HTML}{A26769}")
A(r"\definecolor{gcSand}    {HTML}{E7D9D3}")
A(r"\definecolor{gcInk}     {HTML}{2B1A20}")
A(r"\definecolor{gcGrid}    {HTML}{D8CBC8}")
A("")
A(r"\pagestyle{empty}")
A(r"\begin{document}")
A(r"\begin{center}")
A(r"{\Large\bfseries\color{gcBerry} GiftCompass --- Project Development Schedule}\\[2pt]")
A(r"{\normalsize\color{gcInk} Personalised Gift Recommendation Platform for Jeddah, Saudi Arabia}\\[2pt]")
A(r"{\small\color{gcInk!70} Full software development life cycle, September 2026 -- May 2027 "
  r"(39 weeks). Testing and evaluation complete before the May deadline.}")
A(r"\end{center}")
A(r"\vspace{1mm}")
A("")
A(r"\begin{center}")
A(r"\begin{ganttchart}[")
A(r"    hgrid,")
A(r"    vgrid={*{1}{draw=gcGrid!60, line width=0.2pt}},")
A(r"    x unit=0.70cm,")
A(r"    y unit title=0.50cm,")
A(r"    y unit chart=0.32cm,")
A(r"    title height=1,")
A(r"    title/.append style={fill=gcBerry, draw=gcBerryDk, line width=0.3pt},")
A(r"    title label font=\sffamily\bfseries\scriptsize\color{white},")
A(r"    include title in canvas=false,")
A(r"    bar/.append style={fill=gcRose, draw=gcBerryDk, line width=0.3pt, rounded corners=1pt},")
A(r"    bar height=0.62,")
A(r"    bar label font=\sffamily\scriptsize\color{gcInk},")
A(r"    bar label node/.append style={left=4pt},")
A(r"    group/.append style={fill=gcBerry, draw=gcBerryDk, line width=0.3pt},")
A(r"    group label font=\sffamily\bfseries\scriptsize\color{gcBerry},")
A(r"    group label node/.append style={left=4pt},")
A(r"    group height=0.5, group peaks height=0.14,")
A(r"    group right shift=0, group left shift=0,")
A(r"    milestone/.append style={fill=gcBerryDk, draw=gcBerryDk},")
A(r"    milestone label font=\sffamily\bfseries\scriptsize\color{gcBerryDk},")
A(r"    link/.style={->, thick, draw=gcInk!55},")
A(r"    link bulge=0.5, link tolerance=0.25,")
A(r"    progress label text={}, milestone label node/.append style={left=6pt},")
A(r"]{1}{%d}" % WEEKS)
A(r"  %% ---- calendar -------------------------------------------------------")
A("  " + " ".join(r"\gantttitle{%s}{%d}" % (n, k) for n, k in SEMESTERS) + r" \\")
A("  " + " ".join(r"\gantttitle{%s}{%d}" % (n, k) for n, k in MONTHS) + r" \\")
A(r"  \gantttitlelist{1,...,%d}{1} \\" % WEEKS)

prev_phase = None
for i, (rid, kind, label, s, e) in enumerate(ROWS):
    last = (i == len(ROWS) - 1)
    end = "" if last else r" \\"
    if kind == "group":
        if prev_phase is not None:
            lines.append(r"  %% ---------------------------------------------------------------------")
        A(r"  \ganttgroup[name=%s]{%s}{%d}{%d}%s" % (rid, label, s, e, end))
        prev_phase = rid
    elif kind == "bar":
        A(r"  \ganttbar[name=%s]{%s}{%d}{%d}%s" % (rid, label, s, e, end))
    else:
        A(r"  \ganttmilestone[name=%s]{%s}{%d}%s" % (rid, label, s, end))

A(r"  %% ---- dependencies ---------------------------------------------------")
for a, b in LINKS:
    A(r"  \ganttlink{%s}{%s}" % (a, b))
A(r"\end{ganttchart}")
A(r"\end{center}")
A("")
A(r"\vspace{0.5mm}")
A(r"\begin{center}\scriptsize\color{gcInk!75}")
A(r"\textbf{Legend:}\; \textcolor{gcBerry}{$\blacksquare$}~SDLC phase \quad "
  r"\textcolor{gcRose}{$\blacksquare$}~Task \quad "
  r"\textcolor{gcBerryDk}{$\blacklozenge$}~Milestone \quad "
  r"$\rightarrow$~Dependency\\[2pt]")
A(r"Week 1 = first week of September 2026. \; Testing (M6) and evaluation (M7) both complete in week 35 "
  r"(end of April 2027); May 2027 is reserved for documentation, presentation and submission.")
A(r"\end{center}")
A(r"\end{document}")

open('giftcompass_gantt.tex','w',encoding='utf-8').write("\n".join(lines) + "\n")
print(f"wrote giftcompass_gantt.tex ({len(lines)} lines)")
