/**
 * AI API - AI helper endpoints
 */
import http from "./http";

export const aiApi = {
  chat(payload) {
    return http.post("/api/ai/chat", payload);
  },
  createCourse(prompt) {
    return http.post("/api/ai/create-course", { prompt });
  },
  scheduleInsights(prompt = "") {
    return http.post("/api/ai/schedule-insights", { prompt });
  },
  progressInsights(prompt = "") {
    return http.post("/api/ai/progress-insights", { prompt });
  },
  compareFriends(friends) {
    return http.post("/api/ai/compare", friends);
  },
  listFriends() {
    return http.get("/api/friends");
  },
  addFriend(friend) {
    return http.post("/api/friends", friend);
  },
  deleteFriend(id) {
    return http.delete(`/api/friends/${id}`);
  },
};
