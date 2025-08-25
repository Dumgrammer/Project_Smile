'use client';

import { useMemo } from 'react';

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

type WeekCalendarProps = {
  date: Date;
  events: CalendarEvent[];
  onSlotClick?: (start: Date, end: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  startHour?: number; // default 9
  endHour?: number;   // default 17
  stepMinutes?: number; // default 30
  daysCount?: number; // default 7 (set to 1 for day view)
};

const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 17; // exclusive upper bound
const DEFAULT_STEP_MINUTES = 30;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as first day
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export function WeekCalendar({ date, events, onSlotClick, onEventClick, startHour = DEFAULT_START_HOUR, endHour = DEFAULT_END_HOUR, stepMinutes = DEFAULT_STEP_MINUTES, daysCount = 7 }: WeekCalendarProps) {
  const days = useMemo(() => {
    const base = daysCount === 1 ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : startOfWeek(date);
    return Array.from({ length: daysCount }, (_, i) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
  }, [date, daysCount]);

  const slots = useMemo(() => {
    const result: { hour: number; minute: number; label: string }[] = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        result.push({ hour: h, minute: m, label });
      }
    }
    return result;
  }, [startHour, endHour, stepMinutes]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    days.forEach((d, idx) => (map[idx] = []));
    for (const e of events) {
      const idxBase = daysCount === 1 ? days[0].getDay() : 1; // week starts Monday (1)
      const idx = daysCount === 1 ? 0 : ((new Date(e.start).getDay() + 6) % 7);
      if (map[idx]) map[idx].push(e);
    }
    return map;
  }, [events, days, daysCount]);

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr]">
      <div className={`grid items-center text-xs font-semibold text-slate-600 dark:text-slate-300`} style={{ gridTemplateColumns: `72px repeat(${days.length}, 1fr)` }}>
        <div className="py-2" />
        {days.map((d, i) => (
          <div key={i} className="py-2 text-center border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-md">
            <div className="text-violet-700 dark:text-violet-300">
              {d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
      <div className="grid h-full" style={{ gridTemplateColumns: `72px repeat(${days.length}, 1fr)` }}>
        {/* Time gutter */}
        <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400">
          {slots.map((s, idx) => (
            <div key={idx} className="h-10 border-b dark:border-slate-800 flex items-start pt-1 pr-2 text-right">
              {s.label}
            </div>
          ))}
        </div>

        {/* Days */}
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="relative">
            {/* Slots */}
            {slots.map((s, idx) => (
              <div
                key={idx}
                className="h-10 border-l border-b dark:border-slate-800 hover:bg-violet-500/10 dark:hover:bg-violet-400/10 transition-colors cursor-crosshair"
                onClick={() => {
                  const start = new Date(day);
                  start.setHours(s.hour, s.minute, 0, 0);
                  const end = addMinutes(start, stepMinutes);
                  onSlotClick?.(start, end);
                }}
              />
            ))}

            {/* Events */}
            {eventsByDay[dayIdx]?.map((e) => {
              const start = new Date(e.start);
              const end = new Date(e.end);
              const pxPerHalfHour = 40; // h-10 (40px) per 30 minutes
              const pxPerMinute = pxPerHalfHour / 30;
              const minutesFromStart = (start.getHours() - startHour) * 60 + start.getMinutes();
              // account for 1px border per slot line above this event
              const slotLinesAbove = Math.max(0, Math.floor(minutesFromStart / stepMinutes));
              const top = minutesFromStart * pxPerMinute + slotLinesAbove; 
              const durationMinutes = Math.max(15, (end.getTime() - start.getTime()) / 60000);
              const slotLinesInside = Math.max(0, Math.floor(durationMinutes / stepMinutes));
              const height = durationMinutes * pxPerMinute + slotLinesInside;
              return (
                <div
                  key={e.id}
                  className="absolute left-1 right-1 rounded-md bg-violet-600/90 text-white text-xs p-2 shadow hover:shadow-md transition cursor-pointer border border-violet-400/40"
                  style={{ top, height }}
                  onClick={() => onEventClick?.(e)}
                >
                  <div className="font-semibold truncate">{e.title}</div>
                  <div className="opacity-90">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { CalendarEvent, WeekCalendarProps };


