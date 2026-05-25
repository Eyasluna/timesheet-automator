import { useState, useCallback } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function randomizeHours(totalHours, numDays = 5, maxPerDay = 11) {
  // Distribute totalHours across numDays in 1-hour increments.
  // Each day in [0, maxPerDay]. Works for any total from 0 up to numDays * maxPerDay.
  const hours = Array(numDays).fill(0);
  const target = Math.max(0, Math.round(totalHours));
  const cap = Math.round(maxPerDay);

  let placed = 0;
  let safety = target * 10;
  while (placed < target && safety-- > 0) {
    const idx = Math.floor(Math.random() * numDays);
    if (hours[idx] < cap) {
      hours[idx] += 1;
      placed += 1;
    }
  }
  return hours;
}

function getTimeFromHours(startHour, durationHours) {
  const endHour = startHour + durationHours;
  const fmt = (h) => {
    const hh = Math.floor(h) % 24;
    const mm = Math.round((h - Math.floor(h)) * 60);
    const ampm = hh >= 12 ? "PM" : "AM";
    const displayH = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    return `${displayH}:${mm.toString().padStart(2, "0")} ${ampm}`;
  };
  return { start: fmt(startHour), end: fmt(endHour) };
}

function getBiweeklyDates(periodStart) {
  // Returns array of {date, dayName, weekNum} for a 2-week period Mon-Fri
  const dates = [];
  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 5; day++) {
      const d = new Date(periodStart);
      d.setDate(d.getDate() + week * 7 + day);
      dates.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dayName: DAYS[day],
        weekNum: week + 1,
      });
    }
  }
  return dates;
}

function generateTimesheetRows(totalHoursW1, totalHoursW2, startDate, lunchMins = 30) {
  const hoursW1 = randomizeHours(totalHoursW1);
  const hoursW2 = randomizeHours(totalHoursW2);
  const allHours = [...hoursW1, ...hoursW2];
  const dates = getBiweeklyDates(startDate);

  return dates.map((d, i) => {
    const workHours = allHours[i];
    if (workHours === 0) {
      return { ...d, hours: 0, start: "—", end: "—", lunch: "—" };
    }
    // Random start between 7:30 and 9:30
    const startOffset = Math.round(Math.random() * 8) * 0.25;
    const startHour = 7.5 + startOffset;
    const effectiveLunch = workHours >= 5 ? lunchMins : 0;
    const totalWithLunch = workHours + effectiveLunch / 60;
    const { start, end } = getTimeFromHours(startHour, totalWithLunch);
    return { ...d, hours: workHours, start, end, lunch: effectiveLunch ? `${effectiveLunch}m` : "—" };
  });
}

function generatePDFHTML(rows, name, employer, period, totalHoursW1, totalHoursW2, supervisor) {
  const week1 = rows.filter(r => r.weekNum === 1);
  const week2 = rows.filter(r => r.weekNum === 2);

  const tableRows = (weekRows) => weekRows.map(r => `
    <tr>
      <td>${r.dayName}</td>
      <td>${r.date}</td>
      <td>${r.start}</td>
      <td>${r.end}</td>
      <td>${r.lunch}</td>
      <td>${r.hours}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
  .title { font-size: 28px; font-weight: bold; letter-spacing: -1px; }
  .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #666; margin-top: 4px; }
  .meta { text-align: right; font-size: 13px; line-height: 1.8; }
  .meta strong { font-weight: 600; }
  .week-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin: 24px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1a1a2e; color: #f0e6d3; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500; }
  td { padding: 9px 12px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .total-row td { background: #f0e6d3 !important; font-weight: bold; border-top: 2px solid #1a1a2e; }
  .grand-total { margin-top: 24px; text-align: right; padding: 14px 16px; background: #1a1a2e; color: #f0e6d3; font-size: 15px; display: inline-block; float: right; }
  .grand-total span { font-size: 22px; font-weight: bold; margin-left: 10px; }
  .footer { margin-top: 60px; clear: both; border-top: 1px solid #ddd; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
  .sig { margin-top: 60px; display: flex; justify-content: space-between; }
  .sig-group { display: flex; align-items: flex-end; }
  .sig-line { border-bottom: 1px solid #999; width: 160px; margin-right: 8px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Timesheet</div>
      <div class="subtitle">Pay Period Report</div>
    </div>
    <div class="meta">
      <div><strong>Employee:</strong> ${name || "—"}</div>
      <div><strong>Employer:</strong> ${employer || "—"}</div>
      <div><strong>Supervisor:</strong> ${supervisor || "—"}</div>
      <div><strong>Period:</strong> ${period}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="week-label">Week 1</div>
  <table>
    <thead><tr><th>Day</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Lunch</th><th>Hours</th></tr></thead>
    <tbody>
      ${tableRows(week1)}
      <tr class="total-row"><td colspan="5">Week 1 Total</td><td>${totalHoursW1}</td></tr>
    </tbody>
  </table>

  <div class="week-label">Week 2</div>
  <table>
    <thead><tr><th>Day</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Lunch</th><th>Hours</th></tr></thead>
    <tbody>
      ${tableRows(week2)}
      <tr class="total-row"><td colspan="5">Week 2 Total</td><td>${totalHoursW2}</td></tr>
    </tbody>
  </table>

  <div class="grand-total">Biweekly Total<span>${totalHoursW1 + totalHoursW2} hrs</span></div>

  <div class="sig">
    <div class="sig-group">
      <span class="sig-line"></span>
      <span style="font-size:12px;color:#666">Employee Signature</span>
    </div>
    <div class="sig-group">
      <span class="sig-line"></span>
      <span style="font-size:12px;color:#666">Supervisor Signature</span>
    </div>
  </div>

  <div class="footer">
    <span>Confidential — For payroll purposes only</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;
}

export default function TimesheetApp() {
  const [name, setName] = useState("");
  const [employer, setEmployer] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [w1Hours, setW1Hours] = useState(10);
  const [w2Hours, setW2Hours] = useState(10);
  const [lunch, setLunch] = useState(30);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  });
  const [preview, setPreview] = useState(null);
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("setup");

  const generate = useCallback(() => {
    const sd = new Date(startDate + "T00:00:00");
    const newRows = generateTimesheetRows(w1Hours, w2Hours, sd, lunch);
    const endDate = new Date(sd);
    endDate.setDate(endDate.getDate() + 13);
    const period = `${sd.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const html = generatePDFHTML(newRows, name, employer, period, w1Hours, w2Hours, supervisor);
    setPreview(html);
    setRows(newRows);
    setTab("preview");
  }, [name, employer, w1Hours, w2Hours, lunch, startDate, supervisor]);

  const downloadPDF = () => {
    const blob = new Blob([preview], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet_${startDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    const win = window.open("", "_blank");
    win.document.write(preview);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const regenerate = () => {
    generate();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f1a",
      fontFamily: "'Georgia', serif",
      color: "#e8ddd0",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: "32px 40px 24px",
        borderBottom: "1px solid #2a2a4a",
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#8888aa", marginBottom: 8 }}>
            Biweekly
          </div>
          <h1 style={{ fontSize: 36, fontWeight: "bold", letterSpacing: -1, color: "#f0e6d3", margin: 0 }}>
            Timesheet Automator
          </h1>
          <p style={{ fontSize: 13, color: "#7777aa", marginTop: 8, margin: "8px 0 0" }}>
            Generate randomized timesheets with consistent totals — never miss a deadline again
          </p>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ background: "#13132a", borderBottom: "1px solid #2a2a4a" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: 0 }}>
          {["setup", "preview"].map(t => (
            <button key={t} onClick={() => t === "preview" && preview ? setTab(t) : setTab("setup")}
              style={{
                padding: "14px 28px",
                background: "none",
                border: "none",
                borderBottom: tab === t ? "2px solid #f0a040" : "2px solid transparent",
                color: tab === t ? "#f0e6d3" : "#666688",
                fontSize: 13,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "Georgia, serif",
                opacity: t === "preview" && !preview ? 0.4 : 1,
              }}>
              {t === "setup" ? "⚙ Setup" : "👁 Preview"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 40px" }}>

        {tab === "setup" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={cardStyle}>
                <div style={sectionLabel}>Employee Info</div>
                <Field label="Your Name" value={name} onChange={setName} placeholder="Jane Smith" />
                <Field label="Employer / Company" value={employer} onChange={setEmployer} placeholder="Acme Corp" />
                <Field label="Supervisor's Name" value={supervisor} onChange={setSupervisor} placeholder="John Doe" />
              </div>

              <div style={cardStyle}>
                <div style={sectionLabel}>Pay Period</div>
                <Field label="Period Start (Monday)" value={startDate} onChange={setStartDate} type="date" />
                <Field label="Lunch Break" value={lunch} onChange={v => setLunch(Number(v))} type="select"
                  options={[{v:0,l:"No lunch"},{v:30,l:"30 minutes"},{v:45,l:"45 minutes"},{v:60,l:"60 minutes"}]} />
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={cardStyle}>
                <div style={sectionLabel}>Hours Configuration</div>
                <HoursSlider label="Week 1 Total Hours" value={w1Hours} onChange={setW1Hours} />
                <HoursSlider label="Week 2 Total Hours" value={w2Hours} onChange={setW2Hours} />
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#1a1a3e", borderRadius: 8, fontSize: 13, color: "#8888cc" }}>
                  <strong style={{ color: "#f0a040" }}>Biweekly Total:</strong>{" "}
                  <span style={{ color: "#f0e6d3", fontSize: 16, fontWeight: "bold" }}>{w1Hours + w2Hours} hrs</span>
                  <div style={{ marginTop: 4, fontSize: 11, color: "#666688" }}>
                    Daily hours will be randomized (0–11 hrs/day) to match each week's total. Days may be 0h for low totals.
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={sectionLabel}>Deadline Reminder</div>
                <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.6, marginBottom: 16 }}>
                  Set a calendar reminder so you never miss submission day. Most employers want timesheets by Friday of the pay period's last week.
                </p>
                <div style={{ fontSize: 12, color: "#f0a040", background: "#2a1a0a", padding: "10px 14px", borderRadius: 6, borderLeft: "3px solid #f0a040" }}>
                  💡 Tip: After generating, use the "Add to Calendar" button to set a recurring biweekly reminder
                </div>
              </div>
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <button onClick={generate} style={{
                width: "100%",
                padding: "18px",
                background: "linear-gradient(135deg, #f0a040 0%, #e07020 100%)",
                border: "none",
                borderRadius: 10,
                color: "#1a0a00",
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "Georgia, serif",
                letterSpacing: 1,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(240,160,64,0.3)",
              }}>
                ✦ Generate Timesheet
              </button>
            </div>
          </div>
        )}

        {tab === "preview" && preview && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <ActionBtn onClick={regenerate} icon="🔀" label="Randomize Again" secondary />
              <ActionBtn onClick={printPDF} icon="🖨" label="Print / Save as PDF" />
              <ActionBtn onClick={downloadPDF} icon="⬇" label="Download HTML" secondary />
              <ActionBtn onClick={() => setTab("setup")} icon="←" label="Edit Settings" secondary />
            </div>

            {/* Quick summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Week 1", value: `${w1Hours} hrs`, sub: "5 days" },
                { label: "Week 2", value: `${w2Hours} hrs`, sub: "5 days" },
                { label: "Biweekly Total", value: `${w1Hours + w2Hours} hrs`, sub: "10 working days" },
              ].map(s => (
                <div key={s.label} style={{ background: "#1a1a3e", borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#666688" }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#f0a040", margin: "4px 0 2px" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#8888aa" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Day breakdown */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <div style={sectionLabel}>Daily Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
                {rows?.slice(0, 5).map((r, i) => (
                  <DayCard key={i} row={r} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#5555aa", marginBottom: 12 }}>Week 2</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                {rows?.slice(5).map((r, i) => (
                  <DayCard key={i} row={r} />
                ))}
              </div>
            </div>

            {/* Print tip */}
            <div style={{ fontSize: 12, color: "#666688", textAlign: "center", padding: "0 0 8px" }}>
              Click <strong style={{ color: "#f0a040" }}>Print / Save as PDF</strong> → choose "Save as PDF" in the print dialog to get a PDF file
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DayCard({ row }) {
  return (
    <div style={{ background: "#13132a", borderRadius: 6, padding: "10px 10px 8px", border: "1px solid #2a2a4a" }}>
      <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#666688" }}>{row.dayName.slice(0,3)}</div>
      <div style={{ fontSize: 11, color: "#8888aa", marginBottom: 6 }}>{row.date}</div>
      <div style={{ fontSize: 16, fontWeight: "bold", color: "#f0e6d3" }}>{row.hours}<span style={{ fontSize: 10, color: "#666688" }}>h</span></div>
      <div style={{ fontSize: 10, color: "#5555aa", marginTop: 3 }}>{row.start}–{row.end}</div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, secondary }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px",
      background: secondary ? "transparent" : "linear-gradient(135deg, #f0a040 0%, #e07020 100%)",
      border: secondary ? "1px solid #3a3a6a" : "none",
      borderRadius: 8,
      color: secondary ? "#e8ddd0" : "#1a0a00",
      fontSize: 13,
      fontFamily: "Georgia, serif",
      cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span>{icon}</span>{label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", options }) {
  const inputStyle = {
    boxSizing: "border-box",
    width: "100%",
    padding: "9px 12px",
    background: "#0f0f1a",
    border: "1px solid #2a2a5a",
    borderRadius: 6,
    color: "#e8ddd0",
    fontSize: 14,
    fontFamily: "Georgia, serif",
    marginTop: 4,
    outline: "none",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#8888aa" }}>{label}</label>
      {type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

function HoursSlider({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#8888aa" }}>{label}</label>
        <span style={{ fontSize: 16, fontWeight: "bold", color: "#f0a040" }}>{value}h</span>
      </div>
      <input type="range" min={0} max={55} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#f0a040" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555577", marginTop: 2 }}>
        <span>0h</span><span>25h</span><span>55h</span>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#13132a",
  border: "1px solid #2a2a4a",
  borderRadius: 12,
  padding: "20px 22px",
};

const sectionLabel = {
  fontSize: 10,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: "#f0a040",
  marginBottom: 16,
};
