import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { scheduleApi } from "../../services";
import styles from "./Schedule.module.css";

export default function Schedule() {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableModules, setAvailableModules] = useState([]);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    start: "",
    end: "",
    allDay: false,
    linkToModule: "",
    unlinkFromModule: false,
  });
  const [notification, setNotification] = useState("");

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

      // Start scheduling from next Monday at 9 AM
      const now = new Date();
      const nextMonday = new Date(now);
      const day = nextMonday.getDay();
      const diff = (day === 0 ? 1 : 8) - day; // Next Monday
      nextMonday.setDate(nextMonday.getDate() + diff);
      nextMonday.setHours(9, 0, 0, 0);

      const result = await scheduleApi.autoScheduleModules(
        nextMonday.toISOString()
      );

      if (result.scheduledEvents > 0) {
        // Reload events to show the newly scheduled ones
        await loadEvents();
        await loadAvailableModules();
        alert(
          `Successfully scheduled ${result.scheduledEvents} course modules!`
        );
      } else {
        alert("No course modules available to schedule.");
      }

      setShowAutoSchedule(false);
    } catch (err) {
      console.error("Auto-schedule failed", err);
      setError(err.message || "Failed to auto-schedule modules");
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
    el.style.cursor = "pointer";
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

  // Dynamic AI insights based on available modules and schedule
  const aiInsights = React.useMemo(() => {
    const insights = [];

    if (availableModules.length > 0) {
      insights.push(
        `📚 You have ${availableModules.length} unscheduled course modules ready to schedule.`
      );
      if (availableModules.length > 3) {
        insights.push(
          "🎯 Consider using auto-schedule to efficiently plan multiple modules."
        );
      }
    }

    const courseEvents = events.filter((e) => e.courseModuleId);
    if (courseEvents.length > 0) {
      insights.push(
        `✅ ${courseEvents.length} scheduled sessions are linked to course modules.`
      );
    }

    // Default insights
    insights.push("⚡ Peak focus time: 9-11 AM. Schedule complex topics then.");
    insights.push("💡 Group similar topics together for better retention.");

    return insights.slice(0, 4); // Limit to 4 insights
  }, [availableModules, events]);

  const productivityScore = 78;
  const weeklyGoal = "15 hours";
  const completedThisWeek = "12.5 hours";

  return (
    <section className={styles.page}>
      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>AI-powered scheduling</p>
          <h1>Study planner</h1>
          <p className={styles.subtle}>
            Intelligent time blocking for optimal learning outcomes
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.productivityBadge}>
            <span>Productivity Score</span>
            <strong>{productivityScore}%</strong>
          </div>

          <button
            className={styles.lightBtn}
            onClick={() => {
              const api = calendarRef.current?.getApi();
              api?.today();
            }}
            type="button"
          >
            Today
          </button>

          <button
            className={styles.primaryBtn}
            type="button"
            onClick={handleAutoSchedule}
            disabled={loading}
          >
            🚀 Auto-schedule modules
          </button>
        </div>
      </div>

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
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={events}
          selectable={true}
          editable={true}
          selectMirror={true}
          nowIndicator={true}
          allDaySlot={false}
          dragScroll={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          eventResizableFromStart={true}
          select={handleSelect}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          eventDidMount={handleEventDidMount}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          height="70vh"
          eventDisplay="block"
          eventBackgroundColor="#1eaf53"
          eventBorderColor="#1eaf53"
          eventTextColor="white"
          dayHeaderFormat={{ weekday: "short" }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "09:00",
            endTime: "17:00",
          }}
          eventConstraint="businessHours"
        />
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <span>Weekly Goal</span>
          <strong>{weeklyGoal}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>Completed</span>
          <strong>{completedThisWeek}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>Focus Score</span>
          <strong>{productivityScore}%</strong>
        </div>
        <div className={styles.metricCard}>
          <span>AI Confidence</span>
          <strong>92%</strong>
        </div>
      </div>

      <div className={styles.aiRow}>
        <div className={styles.aiCard}>
          <div className={styles.cardHeader}>
            <h3>🤖 AI Insights</h3>
            <span className={styles.aiBadge}>Smart suggestions</span>
          </div>
          <div className={styles.insightsList}>
            {aiInsights.map((tip, index) => (
              <div key={index} className={styles.insight}>
                <p>{tip}</p>
                <button className={styles.applyBtn} type="button">
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.aiCard}>
          <div className={styles.cardHeader}>
            <h3>🎯 Next Sessions</h3>
            <span className={styles.nextBadge}>Your schedule</span>
          </div>
          <div className={styles.deepWorkList}>
            {events
              .filter((e) => new Date(e.start) > new Date())
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .slice(0, 3)
              .map((event) => {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                const duration =
                  Math.round(((endDate - startDate) / (1000 * 60 * 60)) * 10) /
                  10; // hours

                return (
                  <div key={event.id} className={styles.sessionItem}>
                    <div className={styles.sessionMeta}>
                      <span>
                        {startDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <small>
                        {event.courseModuleId
                          ? "Course module"
                          : "Study session"}
                      </small>
                    </div>
                    <strong>
                      {event.title} · {duration}h
                    </strong>
                    <span className={styles.sessionType}>
                      {event.courseModuleId
                        ? "Linked module"
                        : "Manual session"}
                    </span>
                  </div>
                );
              })}
            {events.filter((e) => new Date(e.start) > new Date()).length ===
              0 && (
              <div className={styles.sessionItem}>
                <div className={styles.sessionMeta}>
                  <span>No upcoming sessions</span>
                  <small>Create or schedule some sessions</small>
                </div>
                <strong>Get started with your study plan</strong>
                <span className={styles.sessionType}>Plan ahead</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <button className={styles.quickBtn} type="button">
          📊 Generate progress report
        </button>
        <button className={styles.quickBtn} type="button">
          ⚡ Optimize for energy levels
        </button>
        <button className={styles.quickBtn} type="button">
          🎯 Adjust learning goals
        </button>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Edit Event</p>
                <h2>Modify Schedule Item</h2>
              </div>
              <button
                className={styles.iconBtn}
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEvent(null);
                  setError("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalForm}>
              <label>
                Event Title *
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter event title"
                  required
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Start Time *
                  <input
                    type="datetime-local"
                    value={editForm.start}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  End Time
                  <input
                    type="datetime-local"
                    value={editForm.end}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={editForm.allDay}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      allDay: e.target.checked,
                    }))
                  }
                />
                All-day event
              </label>

              {/* Course Module Information */}
              {editingEvent.courseModule && (
                <div className={styles.moduleInfo}>
                  <h4>Linked Course Module</h4>
                  <div className={styles.moduleCard}>
                    <strong>{editingEvent.courseModule.title}</strong>
                    <small>from {editingEvent.courseModule.courseTitle}</small>
                  </div>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editForm.unlinkFromModule}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          unlinkFromModule: e.target.checked,
                        }))
                      }
                    />
                    Disconnect from course module
                  </label>
                </div>
              )}

              {/* Link to Module */}
              {!editingEvent.courseModuleId && availableModules.length > 0 && (
                <label>
                  Link to Course Module
                  <select
                    value={editForm.linkToModule}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        linkToModule: e.target.value,
                      }))
                    }
                  >
                    <option value="">Choose a module (optional)</option>
                    {availableModules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title} ({module.courseTitle})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.formActions}>
                <button
                  className={styles.dangerBtn}
                  type="button"
                  onClick={handleDeleteEvent}
                >
                  Delete Event
                </button>
                <div className={styles.rightActions}>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEvent(null);
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.primaryBtn}
                    type="button"
                    onClick={handleSaveEvent}
                    disabled={!editForm.title.trim()}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
