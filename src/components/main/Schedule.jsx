"use client";
import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid"; // ✅ added
import interactionPlugin from "@fullcalendar/interaction";
import styles from "./Schedule.module.css";

// Local storage key for persistence
const STORAGE_KEY = "studyPlannerEvents_v1";

// Simple ID generator
function uid() {
  return String(Math.random()).slice(2);
}

// Example default sessions (Monday of current week)
function defaultEvents() {
  const today = new Date();
  const monday = new Date(today);

  const day = monday.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(9, 0, 0, 0);

  return [
    {
      id: uid(),
      title: "Math — Algebra Basics",
      start: new Date(monday).toISOString(),
      end: new Date(monday.getTime() + 60 * 60 * 1000).toISOString(),
    },
    {
      id: uid(),
      title: "AI Concepts — Intro Module",
      start: new Date(monday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      end: new Date(monday.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export default function Schedule() {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultEvents();
    } catch {
      return defaultEvents();
    }
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // Create event by selecting range
  function handleSelect(info) {
    const title = prompt("Enter study session title:", "New Study Session");
    if (!title) return;

    setEvents((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        start: info.startStr,
        end: info.endStr,
      },
    ]);
  }

  // Create event by clicking single slot
  function handleDateClick(info) {
    const title = prompt("Quick session title:", "New Session");
    if (!title) return;

    const start = info.date;
    const end = new Date(info.date.getTime() + 60 * 60 * 1000);

    setEvents((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        start: start.toISOString(),
        end: end.toISOString(),
      },
    ]);
  }

  // Move sessions
  function handleEventDrop(info) {
    const event = info.event;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              start: event.start.toISOString(),
              end: event.end?.toISOString() || null,
            }
          : e
      )
    );
  }

  // Resize sessions
  function handleEventResize(info) {
    const event = info.event;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              start: event.start.toISOString(),
              end: event.end?.toISOString() || null,
            }
          : e
      )
    );
  }

  // Edit and delete with simple prompt
  function handleEventClick(info) {
    const event = info.event;
    const action = prompt(
      `Edit title OR type DELETE to remove:\nCurrent: ${event.title}`,
      event.title
    );

    if (!action) return;

    if (action.toUpperCase() === "DELETE") {
      if (confirm("Delete this session?")) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
      }
      return;
    }

    // update title
    event.setProp("title", action);

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, title: action } : e))
    );
  }

  const aiInsights = [
    "⚡ Peak focus time: 9-11 AM. Schedule complex topics then.",
    "🎯 ML session tomorrow needs 45 min buffer for review.",
    "⚖️ Week is 85% balanced. Consider adding creative work on Wednesday.",
    "💡 React project would benefit from 2-hour deep work blocks.",
  ];

  const productivityScore = 78;
  const weeklyGoal = "15 hours";
  const completedThisWeek = "12.5 hours";

  return (
    <section className={styles.page}>
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

          <button className={styles.primaryBtn} type="button">
            🚀 Auto-optimize week
          </button>
        </div>
      </div>

      <div className={styles.calendarCard}>
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
          select={handleSelect}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          height="70vh"
          eventDisplay="block"
          eventBackgroundColor="var(--primary)"
          eventBorderColor="var(--primary)"
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
            <span className={styles.nextBadge}>Optimized schedule</span>
          </div>
          <div className={styles.deepWorkList}>
            <div className={styles.sessionItem}>
              <div className={styles.sessionMeta}>
                <span>Wednesday 10 AM</span>
                <small>Peak focus time</small>
              </div>
              <strong>React Design Systems · 2h</strong>
              <span className={styles.sessionType}>Deep work</span>
            </div>
            <div className={styles.sessionItem}>
              <div className={styles.sessionMeta}>
                <span>Friday 2 PM</span>
                <small>Review session</small>
              </div>
              <strong>ML Algorithms Recap · 1.5h</strong>
              <span className={styles.sessionType}>Consolidation</span>
            </div>
            <div className={styles.sessionItem}>
              <div className={styles.sessionMeta}>
                <span>Saturday 9 AM</span>
                <small>Weekend deep dive</small>
              </div>
              <strong>Web Dev Project · 3h</strong>
              <span className={styles.sessionType}>Creative work</span>
            </div>
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
    </section>
  );
}
