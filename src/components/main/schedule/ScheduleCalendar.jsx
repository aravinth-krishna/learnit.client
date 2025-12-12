import React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export function ScheduleCalendar({
  calendarRef,
  events,
  onSelect,
  onDateClick,
  onEventDrop,
  onEventResize,
  onEventClick,
  onEventMouseEnter,
  onEventMouseLeave,
  onEventDidMount,
}) {
  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={events}
      selectable
      editable
      selectMirror
      nowIndicator
      allDaySlot={false}
      dragScroll
      eventStartEditable
      eventDurationEditable
      eventResizableFromStart
      select={onSelect}
      dateClick={onDateClick}
      eventDrop={onEventDrop}
      eventResize={onEventResize}
      eventClick={onEventClick}
      eventMouseEnter={onEventMouseEnter}
      eventMouseLeave={onEventMouseLeave}
      eventDidMount={onEventDidMount}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      slotMinTime="08:00:00"
      slotMaxTime="20:00:00"
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
        startTime: "08:00",
        endTime: "18:00",
      }}
      eventConstraint="businessHours"
    />
  );
}
