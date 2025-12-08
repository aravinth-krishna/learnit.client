import { useState } from "react";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Modal from "../ui/Modal";
import ui from "../ui/ui.module.css";
import ModuleForm from "./ModuleForm";
import styles from "./CreateCourseModal.module.css";

function CreateCourseModal({ onSave, onCancel }) {
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
    { id: crypto.randomUUID(), title: "", duration: "", subModules: [] },
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

    const toHours = (value) => {
      const num = parseFloat(value);
      return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
    };

    const modulesPayload = validModules.map((m, idx) => ({
      tempId: idx + 1,
      title: m.title,
      estimatedHours: toHours(m.duration),
      notes: "",
      subModules: (m.subModules || [])
        .filter((s) => s.title.trim() && s.duration)
        .map((s, subIdx) => ({
          title: s.title,
          estimatedHours: toHours(s.duration),
          description: "",
          notes: "",
          order: subIdx,
        })),
    }));

    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        totalEstimatedHours: parseInt(formData.totalEstimatedHours) || 0,
        modules: modulesPayload,
        externalLinks: [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal kicker="Create course" title="Add a new course" onClose={onCancel}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={ui.formGrid}>
          <Field label="Course title *">
            <input
              type="text"
              name="title"
              placeholder="e.g. Machine Learning Foundations"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Field>
          <Field label="Subject area">
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
          </Field>
        </div>

        <Field label="Description">
          <textarea
            name="description"
            placeholder="Brief description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
          />
        </Field>

        <Field label="Learning objectives">
          <textarea
            name="learningObjectives"
            placeholder="What will you achieve?"
            rows={2}
            value={formData.learningObjectives}
            onChange={handleChange}
          />
        </Field>

        <div className={ui.formGrid}>
          <Field label="Difficulty level">
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
          </Field>
          <Field label="Priority">
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
          </Field>
        </div>

        <div className={ui.formGrid}>
          <Field label="Total hours *">
            <input
              type="number"
              name="totalEstimatedHours"
              min="1"
              placeholder="24"
              value={formData.totalEstimatedHours}
              onChange={handleChange}
              required
            />
          </Field>
          <Field label="Target completion">
            <input
              type="date"
              name="targetCompletionDate"
              value={formData.targetCompletionDate}
              onChange={handleChange}
            />
          </Field>
        </div>

        <ModuleForm modules={modules} setModules={setModules} />

        {error && <div className={ui.errorBanner}>{error}</div>}

        <div className={ui.modalActions}>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateCourseModal;
