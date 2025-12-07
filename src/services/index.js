/**
 * API Services - Unified export for all API modules
 * Provides a clean interface for importing API functions
 */
import { authApi } from "./authApi";
import { courseApi } from "./courseApi";
import { scheduleApi } from "./scheduleApi";
import { profileApi } from "./profileApi";
import { progressApi } from "./progressApi";

export { authApi, courseApi, scheduleApi, profileApi, progressApi };

// Default export for backward compatibility
export default {
  ...authApi,
  ...courseApi,
  ...scheduleApi,
  ...profileApi,
  ...progressApi,
};
