"use client";

import {useEffect, useMemo, useState} from "react";
import {convertZonedDateTime, dateTimeInZone, publicServiceAvailability, restaurantLocalDateTime, restaurantTimeZone, serviceChannelLabels, serviceChannels, type ServiceAvailability, type ServiceChannel, type ServiceClosure} from "../../lib/service-availability";

const emptySelection = (): Record<ServiceChannel, boolean> => ({table: false, hall: false, collection: false, delivery: false});
const localNow = (timeZone = restaurantTimeZone) => dateTimeInZone(new Date(), timeZone);
const suggestedEnd = (timeZone = restaurantTimeZone) => {
  const date = new Date(Date.now() + 2 * 60 * 60_000);
  return dateTimeInZone(date, timeZone);
};

function formatDateTime(value: string) {
  const [date, time] = value.split("T");
  return `${date} · ${time}`;
}

export function AvailabilityEditor({initial, csrf, canWrite}: {initial: ServiceAvailability; csrf: string; canWrite: boolean}) {
  const [config, setConfig] = useState(initial);
  const [now, setNow] = useState(restaurantLocalDateTime);
  const [deviceTimeZone, setDeviceTimeZone] = useState(restaurantTimeZone);
  const [displayTimeZone, setDisplayTimeZone] = useState(restaurantTimeZone);
  const [selected, setSelected] = useState(emptySelection);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<{kind: "success" | "error"; text: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ServiceClosure | null>(null);
  const [scheduleChannels, setScheduleChannels] = useState<Record<ServiceChannel, boolean>>(emptySelection);
  const [startsAt, setStartsAt] = useState(localNow);
  const [endsAt, setEndsAt] = useState(suggestedEnd);
  const [reason, setReason] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const states = useMemo(() => publicServiceAvailability(config, now), [config, now]);

  useEffect(() => {
    const detectionTimer = window.setTimeout(() => {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || restaurantTimeZone;
      setDeviceTimeZone(detected);
      if (detected !== restaurantTimeZone) {
        setStartsAt((value) => convertZonedDateTime(value, restaurantTimeZone, detected));
        setEndsAt((value) => convertZonedDateTime(value, restaurantTimeZone, detected));
        setDisplayTimeZone(detected);
      }
    }, 0);
    const timer = window.setInterval(() => setNow(restaurantLocalDateTime()), 10_000);
    return () => {
      window.clearTimeout(detectionTimer);
      window.clearInterval(timer);
    };
  }, []);

  function changeDisplayTimeZone(nextTimeZone: string) {
    if (nextTimeZone === displayTimeZone) return;
    try {
      setStartsAt((value) => value ? convertZonedDateTime(value, displayTimeZone, nextTimeZone) : value);
      setEndsAt((value) => value ? convertZonedDateTime(value, displayTimeZone, nextTimeZone) : value);
      setDisplayTimeZone(nextTimeZone);
      setNotice(null);
    } catch (error) {
      setNotice({kind: "error", text: error instanceof Error ? error.message : "The timezone could not be changed."});
    }
  }

  function displayRestaurantDateTime(value: string) {
    return formatDateTime(displayTimeZone === restaurantTimeZone ? value : convertZonedDateTime(value, restaurantTimeZone, displayTimeZone));
  }

  async function save(action: string, payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/availability", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({csrf, revision: config.revision, action, ...payload}),
      });
      const result = await response.json() as {error?: string; availability?: ServiceAvailability};
      if (!response.ok || !result.availability) throw new Error(result.error || "The controls could not be saved.");
      setConfig(result.availability);
      setNow(restaurantLocalDateTime());
      setNotice({kind: "success", text: success});
      return true;
    } catch (error) {
      setNotice({kind: "error", text: error instanceof Error ? error.message : "The controls could not be saved."});
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleImmediate(enabled: boolean) {
    const channels = serviceChannels.filter((channel) => selected[channel]);
    if (!channels.length) return setNotice({kind: "error", text: "Choose at least one service first."});
    if (!enabled && !window.confirm(`Close ${channels.map((channel) => serviceChannelLabels[channel]).join(", ")} now? Existing bookings and paid orders will not be cancelled.`)) return;
    if (await save("set_channels", {change: {channels, enabled, message}}, enabled ? "Selected services reopened immediately." : "Selected services closed immediately.")) {
      setSelected(emptySelection());
      setMessage("");
    }
  }

  function editClosure(closure: ServiceClosure) {
    setEditing(closure);
    setScheduleChannels(Object.fromEntries(serviceChannels.map((channel) => [channel, closure.channels.includes(channel)])) as Record<ServiceChannel, boolean>);
    setStartsAt(displayTimeZone === restaurantTimeZone ? closure.startsAt : convertZonedDateTime(closure.startsAt, restaurantTimeZone, displayTimeZone));
    setEndsAt(displayTimeZone === restaurantTimeZone ? closure.endsAt : convertZonedDateTime(closure.endsAt, restaurantTimeZone, displayTimeZone));
    setReason(closure.reason);
    setScheduleMessage(closure.message);
    document.getElementById("availability-schedule-form")?.scrollIntoView({behavior: "smooth", block: "start"});
  }

  function resetSchedule() {
    setEditing(null);
    setScheduleChannels(emptySelection());
    setStartsAt(localNow(displayTimeZone));
    setEndsAt(suggestedEnd(displayTimeZone));
    setReason("");
    setScheduleMessage("");
  }

  async function handleSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const channels = serviceChannels.filter((channel) => scheduleChannels[channel]);
    try {
      const restaurantStartsAt = displayTimeZone === restaurantTimeZone ? startsAt : convertZonedDateTime(startsAt, displayTimeZone, restaurantTimeZone);
      const restaurantEndsAt = displayTimeZone === restaurantTimeZone ? endsAt : convertZonedDateTime(endsAt, displayTimeZone, restaurantTimeZone);
      if (await save("save_closure", {change: {id: editing?.id, channels, startsAt: restaurantStartsAt, endsAt: restaurantEndsAt, reason, message: scheduleMessage}}, editing ? "Scheduled closure updated." : "Scheduled closure added.")) resetSchedule();
    } catch (error) {
      setNotice({kind: "error", text: error instanceof Error ? error.message : "Enter a valid date and time."});
    }
  }

  async function handleDelete(closure: ServiceClosure) {
    if (!window.confirm(`Delete the scheduled closure from ${displayRestaurantDateTime(closure.startsAt)}?`)) return;
    if (await save("delete_closure", {closureId: closure.id}, "Scheduled closure deleted.") && editing?.id === closure.id) resetSchedule();
  }

  return <div className="availabilityEditor">
    {notice && <p className={`adminAlert ${notice.kind === "success" ? "isSuccess" : "isError"}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>}

    <section className="availabilityStatusGrid" aria-label="Current service status">
      {serviceChannels.map((channel) => {
        const state = states[channel];
        return <article key={channel} className={state.enabled ? "isOpen" : "isClosed"}>
          <div><span>{state.enabled ? "Open now" : "Closed now"}</span><i aria-hidden="true" /></div>
          <h2>{serviceChannelLabels[channel]}</h2>
          <p>{state.enabled ? "Customers can use this channel." : state.message || (state.source === "scheduled" ? "A scheduled closure is active." : "Closed manually until reopened.")}</p>
          {state.until && <small>Reopens automatically {displayRestaurantDateTime(state.until)} ({displayTimeZone})</small>}
        </article>;
      })}
    </section>

    <section className="adminPanel availabilityImmediate">
      <div className="adminPanelHeading"><div><p>Immediate control</p><h2>Open or close services now</h2></div><span>Applies instantly</span></div>
      <p className="adminSubtle">Select one service or any combination. Closing a channel blocks new customer submissions immediately; existing records stay in place.</p>
      <fieldset disabled={!canWrite || busy}>
        <legend className="srOnly">Services to change</legend>
        <div className="availabilityChoices">{serviceChannels.map((channel) => <label key={channel}><input type="checkbox" checked={selected[channel]} onChange={(event) => setSelected({...selected, [channel]: event.target.checked})}/><span><strong>{serviceChannelLabels[channel]}</strong><small>{states[channel].enabled ? "Currently open" : "Currently closed"}</small></span></label>)}</div>
        <label className="availabilityMessage">Customer message <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={240} placeholder="Optional. For example: Online ordering is paused while the kitchen catches up. Please call us for help."/><small>Shown instead of the standard unavailable message when closing.</small></label>
        <div className="availabilityActions"><button className="adminButton isDanger" type="button" onClick={() => void handleImmediate(false)}>Close selected now</button><button className="adminButton" type="button" onClick={() => void handleImmediate(true)}>Open selected now</button></div>
      </fieldset>
      {!canWrite && <p className="adminSubtle">Your role can view these controls but cannot change them.</p>}
    </section>

    <section className="adminPanel" id="availability-schedule-form">
      <div className="adminPanelHeading"><div><p>Automatic control</p><h2>{editing ? "Edit scheduled closure" : "Schedule a closure"}</h2></div>{editing && <button className="adminTextButton" type="button" onClick={resetSchedule}>Cancel edit</button>}</div>
      <form className="availabilityScheduleForm" onSubmit={handleSchedule}>
        <fieldset disabled={!canWrite || busy}>
          <legend>Services</legend>
          <div className="availabilityChoices">{serviceChannels.map((channel) => <label key={channel}><input type="checkbox" checked={scheduleChannels[channel]} onChange={(event) => setScheduleChannels({...scheduleChannels, [channel]: event.target.checked})}/><span><strong>{serviceChannelLabels[channel]}</strong></span></label>)}</div>
          <label className="availabilityTimeZone">Timezone<select value={displayTimeZone} onChange={(event) => changeDisplayTimeZone(event.target.value)}><option value={deviceTimeZone}>My device time — {deviceTimeZone}</option>{deviceTimeZone !== restaurantTimeZone && <option value={restaurantTimeZone}>Restaurant time — {restaurantTimeZone}</option>}</select><small>Times below use {displayTimeZone === deviceTimeZone ? "your device timezone" : "the restaurant timezone"}. They are converted automatically before the closure is applied.</small></label>
          <div className="availabilityDateGrid"><label>Close from<input type="datetime-local" value={startsAt} min={localNow(displayTimeZone)} onChange={(event) => setStartsAt(event.target.value)} required/></label><label>Reopen at<input type="datetime-local" value={endsAt} min={startsAt || localNow(displayTimeZone)} onChange={(event) => setEndsAt(event.target.value)} required/></label></div>
          <label>Internal reason<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder="Kitchen maintenance, private event, staff training…"/></label>
          <label>Customer message<textarea value={scheduleMessage} onChange={(event) => setScheduleMessage(event.target.value)} maxLength={240} placeholder="Optional message shown while this closure is active."/></label>
          <div className="availabilityActions"><button className="adminButton" type="submit">{busy ? "Saving…" : editing ? "Update scheduled closure" : "Add scheduled closure"}</button></div>
        </fieldset>
      </form>
    </section>

    <section className="adminPanel availabilityScheduleList">
      <div className="adminPanelHeading"><div><p>Timeline</p><h2>Scheduled closures</h2><small>Showing {displayTimeZone === deviceTimeZone ? "your device time" : "restaurant time"} ({displayTimeZone})</small></div><span>{config.closures.length} total</span></div>
      {config.closures.length ? <div>{config.closures.map((closure) => {
        const status = closure.endsAt <= now ? "Past" : closure.startsAt <= now ? "Active" : "Upcoming";
        return <article key={closure.id} className={`is${status}`}>
          <div className="availabilityScheduleMeta"><span>{status}</span><strong>{closure.channels.map((channel) => serviceChannelLabels[channel]).join(" · ")}</strong></div>
          <h3>{displayRestaurantDateTime(closure.startsAt)} → {displayRestaurantDateTime(closure.endsAt)}<small>{displayTimeZone}</small></h3>
          <p>{closure.reason || "No internal reason added."}</p>
          {closure.message && <small>Customer message: {closure.message}</small>}
          {canWrite && <div><button className="adminTextButton" type="button" onClick={() => editClosure(closure)}>Edit</button><button className="adminTextButton isDanger" type="button" disabled={busy} onClick={() => void handleDelete(closure)}>Delete</button></div>}
        </article>;
      })}</div> : <p className="adminSubtle">No closures are scheduled. All automatic controls are clear.</p>}
    </section>
  </div>;
}
