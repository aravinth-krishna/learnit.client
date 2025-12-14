import React, { useEffect, useRef, useState } from "react";
import { scheduleApi } from "../../services";
import { AutoScheduleModal } from "./schedule/AutoScheduleModal";
import { EditEventModal } from "./schedule/EditEventModal";
import { ResetScheduleModal } from "./schedule/ResetScheduleModal";
import { ScheduleCalendar } from "./schedule/ScheduleCalendar";
import { ScheduleHeader } from "./schedule/ScheduleHeader";
import { MetricsRow } from "./schedule/MetricsRow";
import { NextSessions } from "./schedule/NextSessions";
import styles from "./Schedule.module.css";

export default function Schedule() {
  const calendarRef = useRef(null);

  const getNextMondayStart = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    const day = nextMonday.getDay();
    const diff = (day === 0 ? 1 : 8) - day;
    nextMonday.setDate(nextMonday.getDate() + diff);
    nextMonday.setHours(9, 0, 0, 0);
    return nextMonday.toISOString().slice(0, 16);
  };

  const [events, setEvents] = useState([]);
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
  });
  const [autoOptions, setAutoOptions] = useState({
    startDateTime: getNextMondayStart(),
    preferredStartHour: 8,
    preferredEndHour: 18,
    includeWeekends: false,
    maxDailyHours: 5,
    maxSessionMinutes: 90,
    bufferMinutes: 15,
    weeklyLimitHours: 15,
    focusPreference: "morning",
  });
  const [notification, setNotification] = useState("");

  const updateAutoOptions = (updates) =>
    setAutoOptions((prev) => ({ ...prev, ...updates }));

  const updateEditForm = (updates) =>
    setEditForm((prev) => ({ ...prev, ...updates }));

  useEffect(() => {
    loadEvents();
    loadAvailableModules();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await scheduleApi.getScheduleEvents();
      // Map backend DTOs to FullCalendar events
      setEvents(
        data.map((e) => ({
          id: String(e.id),
          title: e.title,
          start: e.startUtc,
          end: e.endUtc,
          allDay: e.allDay,
          courseModuleId: e.courseModuleId,
          courseModule: e.courseModule,
          backgroundColor: e.courseModuleId ? "#4CAF50" : undefined, // Green for course modules
          borderColor: e.courseModuleId ? "#4CAF50" : undefined,
        }))
      );
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

  const createEventOnServer = async ({ title, start, end, allDay }) => {
    const payload = {
      title,
      startUtc: new Date(start).toISOString(),
      endUtc: end ? new Date(end).toISOString() : null,
      allDay: !!allDay,
    };

    const created = await scheduleApi.createScheduleEvent(payload);
    return {
      id: String(created.id),
      title: created.title,
      start: created.startUtc,
      end: created.endUtc,
      allDay: created.allDay,
      courseModuleId: created.courseModuleId,
      courseModule: created.courseModule,
      backgroundColor: created.courseModuleId ? "#4CAF50" : undefined,
      borderColor: created.courseModuleId ? "#4CAF50" : undefined,
    };
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

      const startDate = autoOptions.startDateTime
        ? new Date(autoOptions.startDateTime)
        : null;

      const payload = {
        startDateTime:
          startDate && !Number.isNaN(startDate.valueOf())
            ? startDate.toISOString()
            : null,
        preferredStartHour: Number(autoOptions.preferredStartHour),
        preferredEndHour: Number(autoOptions.preferredEndHour),
        includeWeekends: autoOptions.includeWeekends,
        maxDailyHours: Number(autoOptions.maxDailyHours),
        maxSessionMinutes: Number(autoOptions.maxSessionMinutes),
        bufferMinutes: Number(autoOptions.bufferMinutes),
        weeklyLimitHours: Number(autoOptions.weeklyLimitHours),
        focusPreference: autoOptions.focusPreference,
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

      setShowAutoSchedule(false);
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
      alert("Event unlinked from course module!");
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
      setEvents((prev) => [...prev, created]);
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
      setEvents((prev) => [...prev, created]);
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

      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                title: event.title,
                start: event.start?.toISOString?.() ?? event.start,
                end: event.end?.toISOString?.() ?? event.end,
                allDay: event.allDay,
              }
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

      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                title: event.title,
                start: event.start?.toISOString?.() ?? event.start,
                end: event.end?.toISOString?.() ?? event.end,
                allDay: event.allDay,
              }
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

      // Update event if any properties changed
      if (titleChanged || startChanged || endChanged || allDayChanged) {
        const startDate = editForm.start ? new Date(editForm.start) : null;
        const endDate = editForm.end ? new Date(editForm.end) : null;

        await updateEventOnServer(editingEvent.id, {
          title: editForm.title,
          start: startDate,
          end: endDate,
          allDay: editForm.allDay,
        });

        // Update local state
        setEvents((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id
              ? {
                  ...e,
                  title: editForm.title,
                  start: startDate,
                  end: endDate,
                  allDay: editForm.allDay,
                  startUtc: startDate?.toISOString(),
                  endUtc: endDate?.toISOString(),
                }
              : e
          )
        );
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
        setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
        setShowEditModal(false);
        setEditingEvent(null);
      } catch (err) {
        setError(err.message || "Failed to delete event");
      }
    }
  };

  const weeklyGoal = "15 hours";
  const completedThisWeek = "12.5 hours";

  return (
    <section className={styles.page}>
      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      <ScheduleHeader
        onAutoSchedule={() => setShowAutoSchedule(true)}
        onReset={() => setShowResetConfirm(true)}
        loading={loading}
      />

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
            <MetricsRow
              weeklyGoal={weeklyGoal}
              completedThisWeek={completedThisWeek}
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
