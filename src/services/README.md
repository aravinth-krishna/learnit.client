# API Services Structure

This directory contains modular API services organized by feature domain.

## File Structure

```
services/
├── http.js           # Core HTTP client (low-level)
├── authApi.js        # Authentication endpoints
├── courseApi.js      # Course management endpoints
├── scheduleApi.js    # Schedule management endpoints
├── profileApi.js     # User profile endpoints
├── progressApi.js    # Progress tracking endpoints
├── index.js          # Main export file
└── README.md         # This file
```

## Usage Examples

### Importing API Services

```javascript
// Import specific API module
import { courseApi } from "../../services";

// Or import multiple modules
import { courseApi, scheduleApi } from "../../services";

// Or import everything (not recommended)
import api from "../../services";
```

### Authentication

```javascript
import { authApi } from "../../services";

// Login
const { token, user } = await authApi.login("email@example.com", "password");

// Register
const { token, user } = await authApi.register(
  "John Doe",
  "email@example.com",
  "password"
);

// Logout
await authApi.logout();
```

### Course Management

```javascript
import { courseApi } from '../../services';

// Get all courses with filters
const courses = await courseApi.getCourses({
  search: 'Python',
  priority: 'High',
  difficulty: 'Beginner',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Get single course
const course = await courseApi.getCourse(courseId);

// Create course
const newCourse = await courseApi.createCourse({
  title: 'My Course',
  description: 'Description',
  modules: [...]
});

// Update course
await courseApi.updateCourse(courseId, { title: 'Updated Title' });

// Delete course
await courseApi.deleteCourse(courseId);

// Module operations
await courseApi.updateModule(moduleId, { title: 'New Title' });
await courseApi.toggleModuleCompletion(moduleId);

// External links
await courseApi.addExternalLink(courseId, { platform: 'YouTube', title: 'Link', url: '...' });
await courseApi.updateExternalLink(linkId, { title: 'Updated' });
await courseApi.deleteExternalLink(linkId);

// Time tracking
await courseApi.updateCourseActiveTime(courseId, 2.5); // 2.5 hours

// Study sessions
const session = await courseApi.startStudySession(courseId, moduleId);
await courseApi.stopStudySession(sessionId, 'Session notes');
const sessions = await courseApi.getCourseSessions(courseId);
```

### Schedule Management

```javascript
import { scheduleApi } from "../../services";

// Get events
const events = await scheduleApi.getScheduleEvents({
  from: "2024-01-01",
  to: "2024-12-31",
});

// Create/Update/Delete events
await scheduleApi.createScheduleEvent({
  title: "Study Session",
  start: "...",
  end: "...",
});
await scheduleApi.updateScheduleEvent(eventId, { title: "Updated" });
await scheduleApi.deleteScheduleEvent(eventId);

// Auto-scheduling
const available = await scheduleApi.getAvailableModules();
await scheduleApi.autoScheduleModules("2024-01-01T09:00:00");

// Link modules to events
await scheduleApi.linkEventToModule(eventId, moduleId);
await scheduleApi.unlinkEventFromModule(eventId);
```

### Profile Management

```javascript
import { profileApi } from "../../services";

// Get profile
const profile = await profileApi.getProfile();

// Update profile info
await profileApi.updateProfile({ fullName: "John Doe", bio: "..." });

// Update preferences
await profileApi.updatePreferences({ theme: "dark", language: "en" });

// Change password
await profileApi.changePassword({ oldPassword: "...", newPassword: "..." });
```

### Progress Tracking

```javascript
import { progressApi } from "../../services";

// Get progress dashboard
const dashboard = await progressApi.getProgressDashboard();
```

## Error Handling

All API calls throw errors that can be caught and handled:

```javascript
try {
  const course = await courseApi.getCourse(id);
} catch (error) {
  console.error("Failed to load course:", error.message);
}
```

## Best Practices

1. **Use specific modules** - Import only what you need:

   ```javascript
   // Good
   import { courseApi } from "../../services";

   // Bad
   import api from "../../services";
   ```

2. **Handle errors** - Always wrap API calls in try-catch or .catch():

   ```javascript
   try {
     const data = await courseApi.getCourse(id);
   } catch (err) {
     setError(err.message);
   }
   ```

3. **Use async/await** - More readable than .then().catch():

   ```javascript
   // Good
   const data = await courseApi.getCourses();

   // Less readable
   courseApi.getCourses().then(data => {...});
   ```

4. **Pass full objects** - Use named parameters for clarity:

   ```javascript
   // Good
   await courseApi.createCourse({ title, description, modules });

   // Less clear
   await courseApi.createCourse(title, description, modules);
   ```

## Adding New Endpoints

To add a new endpoint:

1. Find the appropriate API file (or create a new one)
2. Add the method to the exported object:

   ```javascript
   export const courseApi = {
     async newMethod(param) {
       return http.get(`/api/endpoint/${param}`);
     },
   };
   ```

3. Export from `index.js`:
   ```javascript
   export { newApi } from "./newApi";
   ```
