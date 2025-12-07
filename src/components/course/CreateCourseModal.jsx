import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import ModuleForm from "./ModuleForm";
import styles from "./CreateCourseModal.module.css";

function CreateCourseModal({ onSave, onCancel, loading }) {
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
  const [modules, setModules] = useState([
    { id: Date.now(), title: "", duration: "", parentModuleId: null },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        modules: validModules.map((m) => ({
          title: m.title,
          estimatedHours: parseInt(m.duration) || 0,
          parentModuleId: m.parentModuleId,
        })),
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
            <p className={styles.kicker}>Create course</p>
            <h2>Add a new course</h2>
          </div>
          <button onClick={onCancel} className={styles.closeBtn}>
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label>
              Course title *
              <input
                type="text"
                name="title"
                placeholder="e.g. Machine Learning Foundations"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Subject area
              <select
                name="subjectArea"
                value={formData.subjectArea}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option>Programming</option>
                <option>Data Science</option>
                <option>Web Development</option>
                <option>Design</option>
                <option>Business</option>
                <option>Science</option>
                <option>Mathematics</option>
                <option>Language</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              placeholder="Brief description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
            />
          </label>

          <label>
            Learning objectives
            <textarea
              name="learningObjectives"
              placeholder="What will you achieve?"
              rows={2}
              value={formData.learningObjectives}
              onChange={handleChange}
            />
          </label>

          <div className={styles.grid}>
            <label>
              Difficulty level
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <option value="">Select difficulty</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label>
              Priority
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="">Select priority</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>

          <div className={styles.grid}>
            <label>
              Total hours *
              <input
                type="number"
                name="totalEstimatedHours"
                min="1"
                placeholder="24"
                value={formData.totalEstimatedHours}
                onChange={handleChange}
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
              {submitting ? "Saving..." : "Save course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourseModal;
