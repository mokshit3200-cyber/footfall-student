"use client";

import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { todayISO, todayDayKey, dueLabel, daysUntil } from "@/lib/dates";

export default function RemindersEngine() {
  const { data } = useStore();
  const lastCheck = useRef<number>(0);

  useEffect(() => {
    // Run the check every minute (60000ms)
    const checkReminders = () => {
      const settings = data.reminders;
      if (!settings || !settings.enabled) return;

      const now = new Date();
      const currentMin = Math.floor(now.getTime() / 60000);
      if (currentMin === lastCheck.current) return; // already checked this minute
      lastCheck.current = currentMin;

      const today = todayISO();
      const firedKey = "footfall-fired-reminders";
      let firedData: Record<string, string[]> = {};
      try {
        firedData = JSON.parse(localStorage.getItem(firedKey) || "{}");
      } catch {
        firedData = {};
      }

      const firedToday = firedData[today] || [];
      const updatedFiredToday = [...firedToday];
      let didUpdateFired = false;

      const notify = (id: string, title: string, body: string) => {
        if (updatedFiredToday.includes(id)) return;

        updatedFiredToday.push(id);
        didUpdateFired = true;

        if ("Notification" in window && Notification.permission === "granted") {
          // Fire notification through service worker registration if available for better PWA behavior
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: "/icon.svg",
                badge: "/icon.svg",
                tag: id,
              });
            });
          } else {
            new Notification(title, { body, icon: "/icon.svg" });
          }
        }
      };

      // 1. Class Reminders
      if (settings.classReminders) {
        const todayKey = todayDayKey();
        const slots = data.timetable.filter((s) => s.day === todayKey);
        const subjectById = Object.fromEntries(data.subjects.map((s) => [s.id, s]));

        slots.forEach((slot) => {
          const [sh, sm] = slot.start.split(":").map(Number);
          const classTime = new Date();
          classTime.setHours(sh, sm, 0, 0);

          const diffMs = classTime.getTime() - now.getTime();
          const diffMin = Math.round(diffMs / 60000);
          const leadMin = settings.classLeadMin || 15;

          // Trigger if we are in the window (exact minute or 1 min late due to timer offset)
          if (diffMin <= leadMin && diffMin >= 0) {
            const subj = subjectById[slot.subjectId];
            const subjectName = subj ? subj.name : "Class";
            const reminderId = `class-${slot.id}-${slot.start}-${today}`;
            const body = `${slot.start}${slot.room ? ` · Room ${slot.room}` : ""}${
              slot.teacher ? ` · ${slot.teacher}` : ""
            }`;
            notify(reminderId, `${subjectName} starts in ${diffMin} min`, body);
          }
        });
      }

      // 2. Deadline Reminders
      if (settings.deadlineReminders) {
        const leadDays = settings.deadlineLeadDays || 1;
        const upcomingDeadlines = data.deadlines.filter((d) => !d.done);
        const subjectById = Object.fromEntries(data.subjects.map((s) => [s.id, s]));

        upcomingDeadlines.forEach((deadline) => {
          const daysLeft = daysUntil(deadline.date);
          if (daysLeft === leadDays) {
            const reminderId = `deadline-${deadline.id}-${today}`;
            const subj = deadline.subjectId ? subjectById[deadline.subjectId] : null;
            const subjectLabel = subj ? ` [${subj.name}]` : "";
            notify(
              reminderId,
              `Deadline approaching${subjectLabel}`,
              `"${deadline.title}" is due ${dueLabel(deadline.date)}`
            );
          }
        });
      }

      // 3. Attendance Nudge
      if (settings.attendanceNudge) {
        // Nudge at evening (>= 18:00 / 6:00 PM) if today has classes and attendance is unmarked
        if (now.getHours() >= 18) {
          const todayKey = todayDayKey();
          const todaySlots = data.timetable.filter((s) => s.day === todayKey);
          if (todaySlots.length > 0) {
            const unmarkedSlots = todaySlots.filter(
              (slot) =>
                !data.attendance.some(
                  (record) => record.slotId === slot.id && record.date === today
                )
            );

            if (unmarkedSlots.length > 0) {
              const reminderId = `attendance-nudge-${today}`;
              notify(
                reminderId,
                "Log your attendance!",
                `You have ${unmarkedSlots.length} unmarked classes from today.`
              );
            }
          }
        }
      }

      if (didUpdateFired) {
        // Keep firedData clean (delete records older than today to save space)
        const cleanFiredData: Record<string, string[]> = { [today]: updatedFiredToday };
        localStorage.setItem(firedKey, JSON.stringify(cleanFiredData));
      }
    };

    // Run immediately on mount and then poll every 30 seconds to catch exact minute marks
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [data]);

  return null;
}
