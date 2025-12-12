/**
 * Schedule API - Schedule and calendar management endpoints
 */
import http from "./http";

export const scheduleApi = {
  // Schedule Events
  async getScheduleEvents(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append("from", params.from);
    if (params.to) queryParams.append("to", params.to);

    const queryString = queryParams.toString();
    const endpoint = `/api/schedule${queryString ? `?${queryString}` : ""}`;
    return http.get(endpoint);
  },

  async createScheduleEvent(event) {
    return http.post("/api/schedule", event);
  },

  async updateScheduleEvent(id, event) {
    return http.put(`/api/schedule/${id}`, event);
  },

  async deleteScheduleEvent(id) {
    return http.delete(`/api/schedule/${id}`);
  },

  async resetSchedule() {
    return http.delete("/api/schedule/reset");
  },

  // Module Scheduling
  async getAvailableModules() {
    return http.get("/api/schedule/available-modules");
  },

  async autoScheduleModules(options = {}) {
    return http.post("/api/schedule/auto-schedule", options);
  },

  async linkEventToModule(eventId, moduleId) {
    return http.post(`/api/schedule/${eventId}/link-module/${moduleId}`, {});
  },

  async unlinkEventFromModule(eventId) {
    return http.delete(`/api/schedule/${eventId}/unlink-module`);
  },
};
