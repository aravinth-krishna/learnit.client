import { useState, useEffect } from "react";
import { profileApi } from "../../services";
import { useTheme } from "../../context/ThemeContext.jsx";
import styles from "./Profile.module.css";

function Profile() {
  const { isDarkMode, setDarkMode } = useTheme();

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
  });

  const [preferences, setPreferences] = useState({
    studySpeed: "normal",
    maxSessionMinutes: 60,
    weeklyStudyLimitHours: 10,
    darkMode: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    loadProfile();
  }, []);

  // Sync theme context when preferences are loaded
  useEffect(() => {
    setDarkMode(preferences.darkMode);
  }, [preferences.darkMode, setDarkMode]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await profileApi.getProfile();
      setProfile(data.profile || data);
      setPreferences(
        data.preferences || {
          studySpeed: "normal",
          maxSessionMinutes: 60,
          weeklyStudyLimitHours: 10,
          darkMode: false,
        }
      );
    } catch (err) {
      setError("Failed to load profile");
      console.error("Profile loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await profileApi.updateProfile(profile);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await profileApi.updatePreferences(preferences);
      setSuccess("Preferences updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update preferences");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }

    try {
      setSaving(true);
      await profileApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to change password");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.profile}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.kicker}>Account</p>
            <h1>Your profile</h1>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--muted)",
          }}
        >
          Loading profile...
        </div>
      </section>
    );
  }

  return (
    <section className={styles.profile}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Account</p>
          <h1>Your profile</h1>
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {success && <div className={styles.successMessage}>{success}</div>}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeSection === "profile" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("profile")}
        >
          Profile Info
        </button>
        <button
          className={`${styles.tab} ${
            activeSection === "preferences" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("preferences")}
        >
          Preferences
        </button>
        <button
          className={`${styles.tab} ${
            activeSection === "security" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("security")}
        >
          Security
        </button>
      </div>

      {activeSection === "profile" && (
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.kicker}>Basics</p>
              <h2>User information</h2>
            </div>

            <form onSubmit={handleProfileUpdate}>
              <label>
                Full Name
                <input
                  type="text"
                  value={profile.fullName}
                  placeholder="Your name"
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={profile.email}
                  placeholder="Your email"
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </label>

              <div className={styles.cardActions}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeSection === "preferences" && (
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.kicker}>Study</p>
              <h2>Learning preferences</h2>
            </div>

            <form onSubmit={handlePreferencesUpdate}>
              <label>
                Preferred Study Speed
                <select
                  value={preferences.studySpeed}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      studySpeed: e.target.value,
                    }))
                  }
                >
                  <option value="slow">Slow & Deep</option>
                  <option value="normal">Balanced</option>
                  <option value="fast">Fast Paced</option>
                </select>
              </label>

              <label>
                Max Session Time (minutes)
                <input
                  value={preferences.maxSessionMinutes}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      maxSessionMinutes: Number(e.target.value),
                    }))
                  }
                  type="number"
                  min="15"
                  max="240"
                  placeholder="60"
                />
              </label>

              <label className={styles.rangeLabel}>
                Weekly Study Limit:{" "}
                <strong>{preferences.weeklyStudyLimitHours} hrs</strong>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={preferences.weeklyStudyLimitHours}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      weeklyStudyLimitHours: Number(e.target.value),
                    }))
                  }
                />
              </label>

              <div className={styles.cardActions}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Preferences"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.kicker}>Display</p>
              <h2>Theme settings</h2>
            </div>

            <div className={styles.toggleRow}>
              <div>
                <p>Dark mode</p>
                <small>Great for late study sessions.</small>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    setDarkMode(enabled); // Immediate UI update
                    setPreferences((prev) => ({ ...prev, darkMode: enabled }));

                    // Update backend
                    try {
                      await profileApi.updatePreferences({
                        ...preferences,
                        darkMode: enabled,
                      });
                    } catch (err) {
                      // Revert on error
                      setDarkMode(!enabled);
                      setPreferences((prev) => ({
                        ...prev,
                        darkMode: !enabled,
                      }));
                      setError("Failed to update theme preference");
                      setTimeout(() => setError(""), 3000);
                    }
                  }}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.displayNote}>
              <span />
              <p>Changes apply immediately across the entire app.</p>
            </div>
          </section>
        </div>
      )}

      {activeSection === "security" && (
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.kicker}>Security</p>
              <h2>Change password</h2>
            </div>

            <form onSubmit={handlePasswordChange}>
              <label>
                Current Password
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  value={passwordData.newPassword}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  minLength="6"
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  minLength="6"
                />
              </label>

              <div className={styles.cardActions}>
                <button
                  type="submit"
                  className={styles.dangerBtn}
                  disabled={saving}
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

export default Profile;
