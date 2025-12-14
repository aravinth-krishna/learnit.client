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
            <h2>Quick schedule</h2>
            <p className={styles.subtle}>
              Choose your day window and block size; we will place focused
              sessions without overlaps.
            </p>
          </div>
          <button className={styles.iconBtn} type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.modalGrid}>
            <label className={styles.fieldCard}>
              <span>Start date</span>
              <input
                type="date"
                value={autoOptions.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
              />
            </label>
            <label className={styles.fieldCard}>
              <span>Day start</span>
              <input
                type="time"
                value={autoOptions.dayStart}
                onChange={(e) => onChange({ dayStart: e.target.value })}
              />
            </label>
            <label className={styles.fieldCard}>
              <span>Day end</span>
              <input
                type="time"
                value={autoOptions.dayEnd}
                onChange={(e) => onChange({ dayEnd: e.target.value })}
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

          <div className={styles.inlineTriple}>
            <label className={styles.fieldCard}>
              <span>Max session minutes</span>
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
            <label className={styles.fieldCard}>
              <span>Buffer (min)</span>
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
            <label className={styles.fieldCard}>
              <span>Weekly cap (hours)</span>
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
