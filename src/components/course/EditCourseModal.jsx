import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "./EditCourseModal.module.css";

function EditCourseModal({ course, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description,
    subjectArea: course.subjectArea,
    learningObjectives: course.learningObjectives,
    difficulty: course.difficulty,
    priority: course.priority,
    totalEstimatedHours: course.totalEstimatedHours.toString(),
    targetCompletionDate: course.targetCompletionDate?.split("T")[0] || "",
    notes: course.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...formData,
      totalEstimatedHours: parseInt(formData.totalEstimatedHours) || 0,
    });
    setSaving(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>Edit Course</h2>
          <button onClick={onCancel}>
            <FaTimes />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label>
              Title
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </label>

            <label>
              Subject
              <input
                value={formData.subjectArea}
                onChange={(e) =>
                  setFormData({ ...formData, subjectArea: e.target.value })
                }
              />
            </label>

            <label>
              Difficulty
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value })
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label>
              Priority
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label>
              Total Hours
              <input
                type="number"
                value={formData.totalEstimatedHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalEstimatedHours: e.target.value,
                  })
                }
                min="1"
                required
              />
            </label>

            <label>
              Target Date
              <input
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetCompletionDate: e.target.value,
                  })
                }
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </label>

          <label>
            Learning Objectives
            <textarea
              value={formData.learningObjectives}
              onChange={(e) =>
                setFormData({ ...formData, learningObjectives: e.target.value })
              }
              rows={3}
            />
          </label>

          <label>
            Notes
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
            />
          </label>

          <footer className={styles.footer}>
            <button type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default EditCourseModal;
