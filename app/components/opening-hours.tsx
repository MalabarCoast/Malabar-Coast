import {dayNames, scheduleForDate, type RestaurantSchedule} from "../lib/restaurant-schedule";

const displayDays = [1, 2, 3, 4, 5, 6, 0];

export function OpeningHours({schedule}: {schedule: RestaurantSchedule}) {
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
  const current = scheduleForDate(schedule, today);
  const upcoming = schedule.exceptions.filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return <section className="openingHours" aria-labelledby="opening-hours-title">
    <div className="openingHoursLead"><p>Plan your visit</p><h2 id="opening-hours-title">Opening days<br/>and times.</h2><span>{current.closed ? `Closed today${current.reason ? ` · ${current.reason}` : ""}` : current.opens && current.closes ? `Today ${current.opens}–${current.closes}` : "Today's hours to be confirmed"}</span></div>
    <div className="openingHoursList"><dl>{displayDays.map((index) => <div key={dayNames[index]}><dt>{dayNames[index]}</dt><dd>{schedule.weekly[index].closed ? "Closed" : schedule.weekly[index].opens && schedule.weekly[index].closes ? `${schedule.weekly[index].opens}–${schedule.weekly[index].closes}` : "Hours to be confirmed"}</dd></div>)}</dl>
    {upcoming.length > 0 && <div className="openingHoursExceptions"><strong>Upcoming changes</strong>{upcoming.map((item) => <p key={item.date}><time dateTime={item.date}>{item.date}</time> · {item.mode === "closed" ? "Closed" : item.opens && item.closes ? `Open ${item.opens}–${item.closes}` : "Open by arrangement"}{item.reason ? ` · ${item.reason}` : ""}</p>)}</div>}</div>
  </section>;
}
