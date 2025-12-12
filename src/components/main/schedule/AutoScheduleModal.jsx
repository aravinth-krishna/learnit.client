import React from "react";
import styles from "../Schedule.module.css";

export function AutoScheduleModal({
  isOpen,
  autoOptions,
  onChange,
  onClose,
  onSubmit,
  loading,
  error,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.kicker}>Auto-plan</p>
            <h2>Tailor your schedule</h2>
            <p className={styles.subtle}>
              Uses your profile preferences by default; tweak the knobs below
              for this run.
            </p>
          </div>
          <button className={styles.iconBtn} type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalForm}>
          <label>
            Start from
            <input
              type="datetime-local"
              value={autoOptions.startDateTime}
              onChange={(e) => onChange({ startDateTime: e.target.value })}
            />
          </label>

          <div className={styles.formGrid}>
            <label>
              Day start hour
              <input
                type="number"
                min="5"
                max="12"
                value={autoOptions.preferredStartHour}
                onChange={(e) =>
                  onChange({ preferredStartHour: Number(e.target.value) || 8 })
                }
              />
            </label>
            <label>
              Day end hour
              <input
                type="number"
                min={autoOptions.preferredStartHour + 2}
                max="22"
                value={autoOptions.preferredEndHour}
                onChange={(e) =>
                  onChange({
                    preferredEndHour:
                      Number(e.target.value) || autoOptions.preferredEndHour,
                  })
                }
              />
            </label>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={autoOptions.includeWeekends}
              onChange={(e) => onChange({ includeWeekends: e.target.checked })}
            />
            Allow weekends
          </label>

          <div className={styles.formGrid}>
            <label>
              Max daily hours
              <input
                type="number"
                min="3"
                max="8"
                value={autoOptions.maxDailyHours}
                onChange={(e) =>
                  onChange({
                    maxDailyHours:
                      Number(e.target.value) || autoOptions.maxDailyHours,
                  })
                }
              />
            </label>
            <label>
              Max session minutes
              <input
                type="number"
                min="30"
                max="180"
                step="15"
                value={autoOptions.maxSessionMinutes}
                onChange={(e) =>
                  onChange({
                    maxSessionMinutes:
                      Number(e.target.value) || autoOptions.maxSessionMinutes,
                  })
                }
              />
            </label>
            <label>
              Buffer between blocks (min)
              <input
                type="number"
                min="5"
                max="45"
                value={autoOptions.bufferMinutes}
                onChange={(e) =>
                  onChange({
                    bufferMinutes:
                      Number(e.target.value) || autoOptions.bufferMinutes,
                  })
                }
              />
            </label>
            <label>
              Weekly cap (hours)
              <input
                type="number"
                min="0"
                max="60"
                value={autoOptions.weeklyLimitHours}
                onChange={(e) =>
                  onChange({ weeklyLimitHours: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <label>
            Focus preference
            <select
              value={autoOptions.focusPreference}
              onChange={(e) => onChange({ focusPreference: e.target.value })}
            >
              <option value="balanced">Balanced</option>
              <option value="morning">Mornings</option>
              <option value="evening">Evenings</option>
            </select>
          </label>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formActions}>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={onSubmit}
              disabled={loading}
            >
              Run auto-schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
