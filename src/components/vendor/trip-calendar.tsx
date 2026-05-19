/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useTripStore } from "@/stores/tripStore";
import { TRIP_STATUS_COLORS } from "@/types/trip";
import type { TripStatus } from "@/types/trip";
import "@/app/trip-calendar.css";

export default function TripCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const {
    calendarEvents,
    loading,
    fetchTrips,
    setCreateDialogOpen,
    setSelectedTrip,
    setDetailDrawerOpen,
    handleEventDrop,
    handleEventResize,
    fetchTripDetail,
    setTemplateDrawerOpen,
    filters,
    setFilters
  } = useTripStore();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/vendor/fleet").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setVehicles(d);
    }).catch(() => {});
    fetch("/api/vendor/drivers").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDrivers(d);
    }).catch(() => {});
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const view = calendarApi.view;
      fetchTrips(view.activeStart.toISOString(), view.activeEnd.toISOString());
    }
  }, [filters, fetchTrips]);

  const handleDatesSet = useCallback(
    (arg: any) => {
      fetchTrips(arg.startStr, arg.endStr);
    },
    [fetchTrips]
  );

  // Date click → open create dialog with that date
  const handleDateClick = useCallback(
    (arg: any) => {
      setCreateDialogOpen(true, { start: arg.dateStr });
    },
    [setCreateDialogOpen]
  );

  // Select range → open create with start/end
  const handleSelect = useCallback(
    (arg: any) => {
      setCreateDialogOpen(true, {
        start: arg.startStr,
        end: arg.endStr
      });
    },
    [setCreateDialogOpen]
  );

  // Event click → open detail drawer (set trip immediately, fetch full detail in bg)
  const handleEventClick = useCallback(
    (arg: any) => {
      const trip = arg.event.extendedProps.trip;
      setSelectedTrip(trip);
      setDetailDrawerOpen(true);
      fetchTripDetail(trip.id);
    },
    [setSelectedTrip, setDetailDrawerOpen, fetchTripDetail]
  );

  // Drag & Drop
  const onEventDrop = useCallback(
    (arg: any) => {
      const newStart = arg.event.startStr;
      const newEnd =
        arg.event.endStr || new Date(new Date(newStart).getTime() + 2 * 60 * 60000).toISOString();
      handleEventDrop(arg.event.id, newStart, newEnd);
    },
    [handleEventDrop]
  );

  const onEventResize = useCallback(
    (arg: any) => {
      handleEventResize(arg.event.id, arg.event.startStr, arg.event.endStr);
    },
    [handleEventResize]
  );

  // Custom event rendering
  const renderEventContent = useCallback((eventInfo: any) => {
    const { origin, destination, driverName, vehicleName, seatsBooked, totalSeats } =
      eventInfo.event.extendedProps;

    return (
      <div className="trip-event-content">
        <div className="trip-event-route">
          {origin} → {destination}
        </div>
        <div className="trip-event-meta">
          {eventInfo.timeText}
          {driverName ? ` • ${driverName}` : ""}
        </div>
        {totalSeats > 0 && (
          <div className="trip-event-meta">
            🚐 {vehicleName?.split("(")[0]?.trim()} • {seatsBooked}/{totalSeats} kursi
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <div className="trip-calendar-page">
      {/* Toolbar */}
      <div className="trip-toolbar">
        <div className="trip-toolbar-left" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <h1 className="scaffold-title" style={{ fontSize: "1.75rem", margin: 0 }}>
            Trip Calendar
          </h1>
          
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginLeft: "1rem", borderLeft: "1px solid #e2e8f0", paddingLeft: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: 2 }}>FILTER ARMADA</span>
              <select 
                className="trip-form-select" 
                style={{ padding: "4px 8px", fontSize: "0.85rem", minWidth: 140, borderRadius: 6 }}
                value={filters.vehicleId}
                onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
              >
                <option value="">Semua Armada</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} - {v.model}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: 2 }}>FILTER DRIVER</span>
              <select 
                className="trip-form-select" 
                style={{ padding: "4px 8px", fontSize: "0.85rem", minWidth: 140, borderRadius: 6 }}
                value={filters.driverId}
                onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
              >
                <option value="">Semua Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            
            {(filters.vehicleId || filters.driverId) && (
              <button 
                className="trip-btn trip-btn-ghost trip-btn-sm" 
                onClick={() => setFilters({ vehicleId: "", driverId: "" })}
                style={{ marginTop: 16 }}
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>
        <div className="trip-toolbar-right">
          <button 
            className="trip-btn trip-btn-secondary" 
            onClick={() => setTemplateDrawerOpen(true)}
            style={{ marginRight: '0.5rem' }}
          >
            📋 Template Jadwal
          </button>
          <button className="trip-btn trip-btn-primary" onClick={() => setCreateDialogOpen(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Buat Trip
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="trip-legend">
        {Object.entries(TRIP_STATUS_COLORS).map(([status, colors]) => (
          <div className="trip-legend-item" key={status}>
            <span className="trip-legend-dot" style={{ background: colors.bg }} />
            {colors.label}
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="trip-loading-bar">
          <div className="trip-loading-bar-inner" />
        </div>
      )}

      {/* Calendar */}
      <div className="trip-calendar-wrap">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
          }}
          buttonText={{
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            list: "Daftar"
          }}
          locale="id"
          firstDay={1}
          height="auto"
          contentHeight="auto"
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={4}
          eventDisplay="block"
          moreLinkText={(n) => `+${n} lagi`}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          eventContent={renderEventContent}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false
          }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false
          }}
          slotMinTime="04:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          snapDuration="00:15:00"
        />
      </div>
    </div>
  );
}
