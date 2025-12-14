import React, { useEffect, useRef, useState } from "react";
import { courseApi, scheduleApi } from "../../services";
import { AutoScheduleModal } from "./schedule/AutoScheduleModal";
import { EditEventModal } from "./schedule/EditEventModal";
import { ResetScheduleModal } from "./schedule/ResetScheduleModal";
import { ScheduleCalendar } from "./schedule/ScheduleCalendar";
import { MetricsRow } from "./schedule/MetricsRow";
import { NextSessions } from "./schedule/NextSessions";
import styles from "./Schedule.module.css";

const colorPalette = [
  "#2563eb",
  "#16a34a",
  "#db2777",
  "#ea580c",
  "#7c3aed",
  "#0ea5e9",
  "#d97706",
  "#22c55e",
];

const getCourseColor = (courseId) => {
  if (courseId === null || courseId === undefined) return "#1eaf53";
  const idx = Math.abs(courseId) % colorPalette.length;
  return colorPalette[idx];
};

const decorateEventColors = (event) => {
  if (!event.courseModuleId) {
    return {
      ...event,
      backgroundColor: undefined,
      borderColor: undefined,
      textColor: "#fff",
    };
  }

  const courseId = event.courseModule?.courseId;
  const isCompleted = event.courseModule?.isCompleted;
  const baseColor = getCourseColor(courseId);

  const color = isCompleted ? "#94a3b8" : baseColor;

  return {
    ...event,
    backgroundColor: color,
    borderColor: color,
    textColor: "#fff",
  };
};

export default function Schedule() {
  const calendarRef = useRef(null);

  const getNextMondayDate = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    const day = nextMonday.getDay();
    const diff = (day === 0 ? 1 : 8) - day;
    nextMonday.setDate(nextMonday.getDate() + diff);
    return nextMonday.toISOString().slice(0, 10);
  };

  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableModules, setAvailableModules] = useState([]);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    start: "",
    end: "",
    allDay: false,
    linkToModule: "",
    unlinkFromModule: false,
    markComplete: false,
  });
  const [autoOptions, setAutoOptions] = useState({
    startDate: getNextMondayDate(),
    preferredStartHour: 9,
    preferredEndHour: 18,
    dayStart: "09:00",
    dayEnd: "18:00",
    includeWeekends: false,
    maxSessionMinutes: 90,
    bufferMinutes: 15,
    weeklyLimitHours: 15,
    courseOrder: [],
  });
  const [notification, setNotification] = useState("");
  const [weeklyMetrics, setWeeklyMetrics] = useState({
    scheduled: 0,
    completed: 0,
  });

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "0 hours";
    const rounded = Math.round(hours * 10) / 10;
    const display = Number.isInteger(rounded)
      ? rounded.toFixed(0)
      : rounded.toFixed(1);
    return `${display} hours`;
  };

  const updateAutoOptions = (updates) =>
    setAutoOptions((prev) => ({ ...prev, ...updates }));

  const toggleCourseSelection = (courseId) => {
    setAutoOptions((prev) => {
      const order = prev.courseOrder || [];
      const exists = order.includes(courseId);
      const next = exists
        ? order.filter((id) => id !== courseId)
        : [...order, courseId];
      return { ...prev, courseOrder: next };
    });
  };

  const moveCourseSelection = (courseId, delta) => {
    setAutoOptions((prev) => {
      const order = [...(prev.courseOrder || [])];
      const idx = order.indexOf(courseId);
      if (idx === -1) return prev;
      const swapWith = idx + delta;
      if (swapWith < 0 || swapWith >= order.length) return prev;
      [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
      return { ...prev, courseOrder: order };
    });
  };

  const setEventsWithMetrics = (updater) => {
    setEvents((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      computeWeeklyMetrics(next);
      return next;
    });
  };

  const updateEditForm = (updates) =>
    setEditForm((prev) => ({ ...prev, ...updates }));

  useEffect(() => {
    loadEvents();
    loadAvailableModules();
    loadCourses();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await scheduleApi.getScheduleEvents();
      // Map backend DTOs to FullCalendar events
      const mapped = data.map((e) => {
        return decorateEventColors({
          id: String(e.id),
          title: e.title,
          start: e.startUtc,
          end: e.endUtc,
          allDay: e.allDay,
          courseModuleId: e.courseModuleId,
          courseModule: e.courseModule,
        });
      });

      setEvents(mapped);
      computeWeeklyMetrics(mapped);
    } catch (err) {
      console.error("Failed to load schedule events", err);
      setError(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModules = async () => {
    try {
      const data = await scheduleApi.getAvailableModules();
      setAvailableModules(data);
    } catch (err) {
      console.error("Failed to load available modules", err);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await courseApi.getCourses();
      setCourses(data || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  };

  const computeWeeklyMetrics = (list) => {
    const now = new Date();
    let scheduled = 0;
    let completed = 0;

    list.forEach((e) => {
      if (!e.courseModuleId) return;
      const start = new Date(e.start);
      const end = e.end
        ? new Date(e.end)
        : new Date(start.getTime() + 60 * 60 * 1000);

      const hours = Math.max(0.25, (end - start) / (1000 * 60 * 60));
      scheduled += hours;
      if (e.courseModule?.isCompleted || end <= now) {
        completed += hours;
      }
    });

    setWeeklyMetrics({
      scheduled: Math.round(scheduled * 10) / 10,
      completed: Math.round(completed * 10) / 10,
    });
  };

  const createEventOnServer = async ({ title, start, end, allDay }) => {
    const payload = {
      title,
      startUtc: new Date(start).toISOString(),
      endUtc: end ? new Date(end).toISOString() : null,
      allDay: !!allDay,
    };

    const created = await scheduleApi.createScheduleEvent(payload);
    return decorateEventColors({
      id: String(created.id),
      title: created.title,
      start: created.startUtc,
      end: created.endUtc,
      allDay: created.allDay,
      courseModuleId: created.courseModuleId,
      courseModule: created.courseModule,
    });
  };

  const updateEventOnServer = async (id, { title, start, end, allDay }) => {
    const payload = {
      title,
      startUtc: new Date(start).toISOString(),
      endUtc: end ? new Date(end).toISOString() : null,
      allDay: !!allDay,
    };
    await scheduleApi.updateScheduleEvent(id, payload);
  };

  const handleAutoSchedule = async () => {
    try {
      setLoading(true);
      setError("");

      const startDate = autoOptions.startDate
        ? new Date(
            `${autoOptions.startDate}T${autoOptions.dayStart || "09:00"}`
          )
        : null;

      const payload = {
        startDateTime:
          startDate && !Number.isNaN(startDate.valueOf())
            ? startDate.toISOString()
            : null,
        preferredStartHour:
          Number(autoOptions.dayStart?.split(":")[0]) ||
          Number(autoOptions.preferredStartHour) ||
          9,
        preferredEndHour:
          Number(autoOptions.dayEnd?.split(":")[0]) ||
          Number(autoOptions.preferredEndHour) ||
          18,
        includeWeekends: autoOptions.includeWeekends,
        maxSessionMinutes: Number(autoOptions.maxSessionMinutes),
        bufferMinutes: Number(autoOptions.bufferMinutes),
        weeklyLimitHours: Number.isFinite(Number(autoOptions.weeklyLimitHours))
          ? Number(autoOptions.weeklyLimitHours)
          : null,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        courseOrderIds: Array.isArray(autoOptions.courseOrder)
          ? autoOptions.courseOrder
          : [],
      };

      const result = await scheduleApi.autoScheduleModules(payload);

      if (result.scheduledEvents > 0) {
        // Reload events to show the newly scheduled ones
        await loadEvents();
        await loadAvailableModules();
        setNotification(
          `Scheduled ${result.scheduledEvents} focused blocks (up to ${payload.maxSessionMinutes} minutes each).`
        );
      } else {
        setNotification("No course modules available to schedule.");
      }
      setTimeout(() => setNotification(""), 5000);
    } catch (err) {
      console.error("Auto-schedule failed", err);
      setError(err.message || "Failed to auto-schedule modules");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSchedule = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await scheduleApi.resetSchedule();
      await loadEvents();
      setShowResetConfirm(false);
      setNotification(result.message || "Schedule cleared");
      setTimeout(() => setNotification(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to reset schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToModule = async (eventId, moduleId) => {
    try {
      await scheduleApi.linkEventToModule(eventId, moduleId);
      await loadEvents();
      await loadAvailableModules();
      alert("Event linked to course module!");
    } catch (err) {
      console.error("Failed to link event to module", err);
      setError(err.message || "Failed to link event to module");
    }
  };

  const handleUnlinkFromModule = async (eventId) => {
    try {
      await scheduleApi.unlinkEventFromModule(eventId);
      await loadEvents();
      await loadAvailableModules();
    } catch (err) {
      console.error("Failed to unlink event from module", err);
      setError(err.message || "Failed to unlink event from module");
    }
  };

  const deleteEventOnServer = async (id) => {
    await scheduleApi.deleteScheduleEvent(id);
  };

  // Create event by selecting range
  async function handleSelect(info) {
    const title = prompt("Enter study session title:", "New Study Session");
    if (!title) return;

    try {
      const created = await createEventOnServer({
        title,
        start: info.startStr,
        end: info.endStr,
        allDay: info.allDay,
      });
      setEventsWithMetrics((prev) => [...prev, created]);
    } catch (err) {
      alert(err.message || "Failed to create event");
    }
  }

  // Create event by clicking single slot
  async function handleDateClick(info) {
    const title = prompt("Quick session title:", "New Session");
    if (!title) return;

    const start = info.date;
    const end = new Date(info.date.getTime() + 60 * 60 * 1000);

    try {
      const created = await createEventOnServer({
        title,
        start,
        end,
        allDay: info.allDay,
      });
      setEventsWithMetrics((prev) => [...prev, created]);
    } catch (err) {
      alert(err.message || "Failed to create event");
    }
  }

  // Move sessions
  async function handleEventDrop(info) {
    const event = info.event;

    try {
      await updateEventOnServer(event.id, {
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      });

      setEventsWithMetrics((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? decorateEventColors({
                ...e,
                title: event.title,
                start: event.start?.toISOString?.() ?? event.start,
                end: event.end?.toISOString?.() ?? event.end,
                allDay: event.allDay,
              })
            : e
        )
      );
    } catch (err) {
      console.error("Failed to move event", err);
      setNotification(
        `Failed to update event: ${err.message || "Unknown error"}`
      );
      setTimeout(() => setNotification(""), 5000);
      info.revert();
    }
  }

  // Resize sessions
  async function handleEventResize(info) {
    const event = info.event;

    try {
      await updateEventOnServer(event.id, {
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      });

      setEventsWithMetrics((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? decorateEventColors({
                ...e,
                title: event.title,
                start: event.start?.toISOString?.() ?? event.start,
                end: event.end?.toISOString?.() ?? event.end,
                allDay: event.allDay,
              })
            : e
        )
      );
    } catch (err) {
      console.error("Failed to resize event", err);
      setNotification(
        `Failed to update event: ${err.message || "Unknown error"}`
      );
      setTimeout(() => setNotification(""), 5000);
      info.revert();
    }
  }

  // Hover effects for better UX
  function handleEventMouseEnter(info) {
    const el = info.el;
    el.style.cursor = "grab";
    el.style.transform = "scale(1.02)";
    el.style.transition = "transform 0.1s ease";
  }

  function handleEventMouseLeave(info) {
    const el = info.el;
    el.style.cursor = "default";
    el.style.transform = "scale(1)";
  }

  // Add drag indicator to events
  function handleEventDidMount(info) {
    // Add a subtle drag indicator
    const eventEl = info.el;
    eventEl.title = `${info.event.title} - Click to edit, drag to reschedule`;
  }

  // Open edit modal for event
  function handleEventClick(info) {
    const event = info.event;
    const currentEvent = events.find((e) => e.id === event.id);

    setEditingEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      courseModuleId: currentEvent?.courseModuleId,
      courseModule: currentEvent?.courseModule,
    });

    setEditForm({
      title: event.title,
      start: new Date(event.start).toISOString().slice(0, 16),
      end: event.end ? new Date(event.end).toISOString().slice(0, 16) : "",
      allDay: event.allDay || false,
      linkToModule: "",
      unlinkFromModule: false,
      markComplete: !!currentEvent?.courseModule?.isCompleted,
    });

    setShowEditModal(true);
  }

  // Handle saving changes from the edit modal
  const handleSaveEvent = async () => {
    if (!editingEvent) return;

    // Validation
    if (!editForm.title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!editForm.start) {
      setError("Start time is required");
      return;
    }

    const startDate = new Date(editForm.start);
    const endDate = editForm.end ? new Date(editForm.end) : null;

    if (endDate && startDate >= endDate) {
      setError("End time must be after start time");
      return;
    }

    setError("");

    try {
      // Handle unlinking from module first
      if (editForm.unlinkFromModule && editingEvent.courseModuleId) {
        await handleUnlinkFromModule(editingEvent.id);
      }

      // Handle linking to module
      if (editForm.linkToModule && !editingEvent.courseModuleId) {
        const moduleId = parseInt(editForm.linkToModule);
        await handleLinkToModule(editingEvent.id, moduleId);
      }

      // Optionally mark linked module complete/incomplete
      let moduleCompletionChanged = false;
      if (!editForm.unlinkFromModule && editingEvent.courseModuleId) {
        const currentCompleted = !!editingEvent.courseModule?.isCompleted;
        if (editForm.markComplete !== currentCompleted) {
          await courseApi.toggleModuleCompletion(editingEvent.courseModuleId);
          moduleCompletionChanged = true;
        }
      }

      // Check if any event properties changed
      const startChanged =
        editForm.start !==
        new Date(editingEvent.start).toISOString().slice(0, 16);
      const endChanged =
        editForm.end !==
        (editingEvent.end
          ? new Date(editingEvent.end).toISOString().slice(0, 16)
          : "");
      const allDayChanged = editForm.allDay !== (editingEvent.allDay || false);
      const titleChanged = editForm.title !== editingEvent.title;
      const shouldUpdateEvent =
        titleChanged || startChanged || endChanged || allDayChanged;

      const startDate = editForm.start ? new Date(editForm.start) : null;
      const endDate = editForm.end ? new Date(editForm.end) : null;

      // Local helper to avoid duplication
      const applyLocalUpdate = () =>
        setEventsWithMetrics((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id
              ? decorateEventColors({
                  ...e,
                  title: editForm.title,
                  start: startDate,
                  end: endDate,
                  allDay: editForm.allDay,
                  startUtc: startDate?.toISOString(),
                  endUtc: endDate?.toISOString(),
                  courseModule: moduleCompletionChanged
                    ? {
                        ...e.courseModule,
                        isCompleted: editForm.markComplete,
                      }
                    : e.courseModule,
                })
              : e
          )
        );

      // Update event if any properties changed
      if (shouldUpdateEvent) {
        await updateEventOnServer(editingEvent.id, {
          title: editForm.title,
          start: startDate,
          end: endDate,
          allDay: editForm.allDay,
        });

        if (moduleCompletionChanged) {
          await loadEvents();
          await loadAvailableModules();
        } else {
          applyLocalUpdate();
        }
      }

      if (!shouldUpdateEvent && moduleCompletionChanged) {
        await loadEvents();
        await loadAvailableModules();
      }

      setShowEditModal(false);
      setEditingEvent(null);
    } catch (err) {
      setError(err.message || "Failed to update event");
    }
  };

  // Handle deleting event from modal
  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEventOnServer(editingEvent.id);
        setEventsWithMetrics((prev) =>
          prev.filter((e) => e.id !== editingEvent.id)
        );
        setShowEditModal(false);
        setEditingEvent(null);
      } catch (err) {
        setError(err.message || "Failed to delete event");
      }
    }
  };

  const weeklyGoal = formatHours(weeklyMetrics.scheduled);
  const completedThisWeek = formatHours(weeklyMetrics.completed);

  return (
    <section className={styles.page}>
      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      <div className={styles.layout}>
        <div className={styles.leftPane}>
          <div className={styles.calendarCard}>
            {error && (
              <div
                style={{
                  marginBottom: "8px",
                  color: "red",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}
            <ScheduleCalendar
              calendarRef={calendarRef}
              events={events}
              onSelect={handleSelect}
              onDateClick={handleDateClick}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onEventClick={handleEventClick}
              onEventMouseEnter={handleEventMouseEnter}
              onEventMouseLeave={handleEventMouseLeave}
              onEventDidMount={handleEventDidMount}
            />
          </div>
        </div>

        <div className={styles.rightPane}>
          <div className={styles.sideCard}>
            <div className={styles.actionButtons}>
              <button
                className={styles.primaryBtn}
                type="button"
                onClick={() => setShowAutoSchedule(true)}
                disabled={loading}
              >
                🚀 Auto-schedule modules
              </button>

              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => setShowResetConfirm(true)}
                disabled={loading}
              >
                🧹 Reset schedule
              </button>
            </div>
          </div>

          <div className={styles.sideCard}>
            <MetricsRow
              weeklyGoal={weeklyGoal}
              completedThisWeek={completedThisWeek}
              loading={false}
            />
          </div>

          <NextSessions events={events} />
        </div>
      </div>

      {/* Auto-schedule options */}
      <AutoScheduleModal
        isOpen={showAutoSchedule}
        autoOptions={autoOptions}
        onChange={updateAutoOptions}
        courses={courses}
        onToggleCourse={toggleCourseSelection}
        onMoveCourse={moveCourseSelection}
        onClose={() => setShowAutoSchedule(false)}
        onSubmit={handleAutoSchedule}
        loading={loading}
        error={error}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={showEditModal}
        editingEvent={editingEvent}
        availableModules={availableModules}
        editForm={editForm}
        onChange={updateEditForm}
        onDelete={handleDeleteEvent}
        onSave={handleSaveEvent}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
          setError("");
        }}
        error={error}
      />

      {/* Reset schedule confirmation */}
      <ResetScheduleModal
        isOpen={showResetConfirm}
        error={error}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetSchedule}
        loading={loading}
      />
    </section>
  );
}
