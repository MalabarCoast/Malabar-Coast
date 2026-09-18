"use client";

import {useState} from "react";
import {dayNames, formatServiceHours, type RestaurantSchedule} from "../../lib/restaurant-schedule";
import type {ScheduleChange, ScheduleImpact} from "../../lib/schedule-admin";

const displayDays = [1, 2, 3, 4, 5, 6, 0];
const emptyException = (): ScheduleChange => ({kind: "exception", date: "", mode: "closed", opens: "", closes: "", secondOpens: "", secondCloses: "", reason: ""});

export function ScheduleEditor({initial, csrf, canWrite}: {initial: RestaurantSchedule; csrf: string; canWrite: boolean}) {
  const [schedule, setSchedule] = useState(initial);
  const [change, setChange] = useState<ScheduleChange>(emptyException);
  const [preview, setPreview] = useState<{impact: ScheduleImpact[]; token: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  function edit(next: ScheduleChange) { setChange(next); setPreview(null); setMessage(""); }
  async function request(action: "preview" | "save") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/schedule", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({csrf, action, change, token: preview?.token})});
      const result = await response.json() as {error?: string; token?: string; impact?: ScheduleImpact[]; schedule?: RestaurantSchedule};
      if (!response.ok) throw new Error(result.error || "The calendar could not be updated.");
      if (action === "preview" && result.token && result.impact) setPreview({token: result.token, impact: result.impact});
      if (action === "save" && result.schedule) { setSchedule(result.schedule); setPreview(null); setMessage("Calendar saved. Existing bookings and paid orders were left unchanged."); }
    } catch (error) {setPreview(null); setMessage(error instanceof Error ? error.message : "The calendar could not be updated.");}
    finally {setBusy(false);}
  }
  return <div className="scheduleEditor">
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Weekly pattern</p><h2>Opening days and times</h2></div></div>
      <div className="scheduleWeek">{displayDays.map((index) => <div key={dayNames[index]}><strong>{dayNames[index]}</strong><span>{formatServiceHours(schedule.weekly[index])}</span></div>)}</div>
      <p className="scheduleHelp">Use the first service for lunch or a continuous day. Add the optional second service when the restaurant closes between lunch and dinner. These hours control the website, bookings, collection and delivery.</p>
      {canWrite && <button className="adminButton" type="button" onClick={() => {const day = 1; edit({kind: "weekly", day, ...schedule.weekly[day]});}}>Edit weekly hours</button>}
    </section>
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Holiday calendar</p><h2>Dated exceptions</h2></div><span>Overrides the regular weekday</span></div>
      {schedule.exceptions.length ? <div className="scheduleExceptions">{schedule.exceptions.map((item) => <button type="button" key={item.date} onClick={() => edit({kind: "exception", date: item.date, mode: item.mode, opens: item.opens, closes: item.closes, secondOpens: item.secondOpens, secondCloses: item.secondCloses, reason: item.reason})}><strong>{item.date}</strong><span>{formatServiceHours(item)} · {item.reason || "No reason added"}</span></button>)}</div> : <p>No dated exceptions yet.</p>}
      {canWrite && <button className="adminButton" type="button" onClick={() => edit(emptyException())}>Add a date</button>}
    </section>
    {canWrite && <section className="adminPanel"><div className="adminPanelHeading"><div><p>Make a change</p><h2>{change.kind === "weekly" ? "Weekly day" : "Calendar date"}</h2></div></div>
      <div className="adminRecordGrid">
        <label>Change type<select value={change.kind} onChange={(event) => event.target.value === "weekly" ? edit({kind: "weekly", day: 1, ...schedule.weekly[1]}) : edit(emptyException())}><option value="exception">Dated exception</option><option value="weekly">Weekly day</option></select></label>
        {change.kind === "weekly" ? <><label>Day<select value={change.day} onChange={(event) => {const day = Number(event.target.value); edit({kind: "weekly", day, ...schedule.weekly[day]});}}>{dayNames.map((name, index) => <option value={index} key={name}>{name}</option>)}</select></label><label>Status<select value={change.closed ? "closed" : "open"} onChange={(event) => edit({...change, closed: event.target.value === "closed"})}><option value="open">Open</option><option value="closed">Closed</option></select></label></> : <><label>Date<input type="date" value={change.date} onChange={(event) => edit({...change, date: event.target.value})}/></label><label>Status<select value={change.mode} onChange={(event) => edit({...change, mode: event.target.value as "closed" | "open" | "reduced" | "remove"})}><option value="closed">Closed</option><option value="open">Open exceptionally</option><option value="reduced">Reduced hours</option>{schedule.exceptions.some((item) => item.date === change.date) && <option value="remove">Remove exception</option>}</select></label><label className="adminRecordWide">Reason or holiday name<input maxLength={180} value={change.reason} onChange={(event) => edit({...change, reason: event.target.value})} placeholder="Christmas Day"/></label></>}
        {(change.kind === "weekly" ? !change.closed : change.mode === "open" || change.mode === "reduced") && <>
          <label>First service opens<input type="time" value={change.opens} onChange={(event) => edit({...change, opens: event.target.value})}/></label>
          <label>First service closes<input type="time" value={change.closes} onChange={(event) => edit({...change, closes: event.target.value})}/></label>
          <label>Second service opens <small>(optional)</small><input type="time" value={change.secondOpens} onChange={(event) => edit({...change, secondOpens: event.target.value})}/></label>
          <label>Second service closes <small>(optional)</small><input type="time" value={change.secondCloses} onChange={(event) => edit({...change, secondCloses: event.target.value})}/></label>
        </>}
      </div>
      <div className="scheduleActions"><button className="adminButton" type="button" disabled={busy} onClick={() => void request("preview")}>{busy ? "Checking…" : "Preview affected bookings and orders"}</button>{preview && <button className="adminButton" type="button" disabled={busy} onClick={() => void request("save")}>Save calendar change</button>}</div>
      {message && <p className="adminAlert" role="status">{message}</p>}
      {preview && <div className="scheduleImpact" role="status"><h3>{preview.impact.length ? `${preview.impact.length} existing record${preview.impact.length === 1 ? "" : "s"} affected` : "No existing bookings or paid orders affected"}</h3><p>Saving changes future availability only. Staff must decide whether to honour or rearrange each existing record; none will be cancelled automatically.</p>{preview.impact.length > 0 && <div className="adminTableWrap"><table className="adminOrdersTable"><thead><tr><th>Type</th><th>Reference</th><th>Date and time</th><th>Customer</th><th>Details</th></tr></thead><tbody>{preview.impact.map((item) => <tr key={`${item.type}-${item.reference}`}><td>{item.type}</td><td><a href={item.href} className="adminOrderReference">{item.reference}</a></td><td>{item.date} {item.time}</td><td>{item.name}</td><td>{item.detail}</td></tr>)}</tbody></table></div>}</div>}
    </section>}
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>External listings</p><h2>Keep every channel aligned</h2></div></div><p>After changing a holiday or weekly schedule, update Google Business Profile and any third-party ordering platforms separately.</p></section>
  </div>;
}
