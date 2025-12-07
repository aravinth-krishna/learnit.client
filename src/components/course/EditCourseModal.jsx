import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import ModuleForm from "./ModuleForm";
import styles from "./EditCourseModal.module.css";

function EditCourseModal({ course, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectArea: "",
    learningObjectives: "",
    difficulty: "",
    priority: "",
    totalEstimatedHours: "",
    targetCompletionDate: "",
    notes: "",
  });
  const [modules, setModules] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
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
      setModules(
        (course.modules || []).map((m) => ({
          id: m.id,
          title: m.title,
          duration: m.estimatedHours.toString(),
          parentModuleId: m.parentModuleId,
        }))
      );
      setExternalLinks(course.externalLinks || []);
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validModules = modules.filter((m) => m.title.trim() && m.duration);
    if (validModules.length === 0) {
      setError("Please add at least one module");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        totalEstimatedHours: parseInt(formData.totalEstimatedHours) || 0,
        modules: modules
          .filter((m) => m.title.trim() && m.duration)
          .map((m) => ({
            title: m.title,
            estimatedHours: parseInt(m.duration) || 0,
            parentModuleId: m.parentModuleId,
          })),
        externalLinks,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Edit course</p>
            <h2>Update course details</h2>
          </div>
          <button onClick={onCancel} className={styles.closeBtn}>
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label>
              Title *
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Subject area
              <input
                type="text"
                name="subjectArea"
                value={formData.subjectArea}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
            />
          </label>

          <label>
            Learning objectives
            <textarea
              name="learningObjectives"
              value={formData.learningObjectives}
              onChange={handleChange}
              rows={2}
            />
          </label>

          <div className={styles.grid}>
            <label>
              Difficulty
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                required
              >
                <option value="">Select difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label>
              Priority
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>

          <div className={styles.grid}>
            <label>
              Total hours *
              <input
                type="number"
                name="totalEstimatedHours"
                value={formData.totalEstimatedHours}
                onChange={handleChange}
                min="1"
                required
              />
            </label>
            <label>
              Target completion
              <input
                type="date"
                name="targetCompletionDate"
                value={formData.targetCompletionDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <ModuleForm modules={modules} setModules={setModules} />

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitBtn}
            >
              {submitting ? "Updating..." : "Update course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCourseModal;
