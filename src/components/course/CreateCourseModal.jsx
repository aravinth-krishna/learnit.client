import { useState } from "react";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Modal from "../ui/Modal";
import ui from "../ui/ui.module.css";
import ModuleForm from "./ModuleForm";
import { aiApi } from "../../services";
import styles from "./CreateCourseModal.module.css";

const toHoursString = (value, fallback = "1") => {
  const num = Number.parseFloat(value);
  if (Number.isFinite(num) && num > 0) return Math.round(num).toString();
  return fallback;
};

const normalizeLearningObjectives = (val) => {
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof val === "string") return val.trim();
  return "";
};

const fallbackDate = () =>
  new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);

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
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError("");
    try {
      const draft = await aiApi.createCourse(aiPrompt.trim());
      console.log("[AI create-course draft]", draft);

      const clampOption = (val, options, fallback) => {
        if (!val) return fallback;
        const found = options.find(
          (opt) => opt.toLowerCase() === val.toLowerCase()
        );
        return found || fallback;
      };

      const normalizeSubject = (val) => {
        const subjects = [
          "Programming",
          "Data Science",
          "Web Development",
          "Design",
          "Business",
          "Science",
          "Mathematics",
          "Language",
          "Other",
        ];
        if (!val) return "Other";
        const exact = subjects.find(
          (s) => s.toLowerCase() === val.toLowerCase()
        );
        return exact || "Other";
      };

      const difficulty = clampOption(
        draft.difficulty,
        ["Beginner", "Intermediate", "Advanced"],
        "Intermediate"
      );

      const priority = clampOption(
        draft.priority,
        ["High", "Medium", "Low"],
        "Medium"
      );

      const subjectArea = normalizeSubject(draft.subjectArea);

      const modulesFallback = () => {
        const subject = subjectArea === "Other" ? "Course" : subjectArea;
        return ["Foundations", "Applied Practice", "Project"]
          .map((title, idx) => ({
            id: crypto.randomUUID(),
            title: `${subject} ${title}`,
            duration: "3",
            subModules: [
              { id: crypto.randomUUID(), title: "Lesson 1", duration: "1" },
              { id: crypto.randomUUID(), title: "Lesson 2", duration: "1" },
            ],
          }))
          .map((m, idx) => ({ ...m, order: idx }));
      };

      const learningObjectives = normalizeLearningObjectives(
        draft.learningObjectives
      );

      const safeModules = (draft.modules || []).map((m, idx) => {
        const hours = Number.parseFloat(m.estimatedHours);
        const duration = Number.isFinite(hours) && hours > 0 ? hours : 2;
        const subModules = (m.subModules || []).map((s, subIdx) => {
          const sh = Number.parseFloat(s.estimatedHours);
          const subDuration = Number.isFinite(sh) && sh > 0 ? sh : 1;
          return {
            id: crypto.randomUUID(),
            title: s.title?.trim() || `Lesson ${subIdx + 1}`,
            duration: toHoursString(subDuration, "1"),
          };
        });

        return {
          id: crypto.randomUUID(),
          title: m.title?.trim() || `Module ${idx + 1}`,
          duration: toHoursString(duration, "2"),
          subModules: subModules.length
            ? subModules
            : [
                { id: crypto.randomUUID(), title: "Lesson 1", duration: "1" },
                { id: crypto.randomUUID(), title: "Lesson 2", duration: "1" },
              ],
        };
      });

      let usableModules = safeModules;
      if (safeModules.length < 3) {
        const fillers = modulesFallback().slice(0, 3 - safeModules.length);
        usableModules = [...safeModules, ...fillers];
      }

      const moduleDurationTotal = usableModules.reduce((sum, m) => {
        const hours = Number.parseFloat(m.duration);
        return Number.isFinite(hours) && hours > 0 ? sum + hours : sum;
      }, 0);
      const totalHours = Number.parseInt(draft.totalEstimatedHours, 10);

      const targetDate = draft.targetCompletionDate
        ? draft.targetCompletionDate.slice(0, 10)
        : fallbackDate();

      setFormData((prev) => ({
        ...prev,
        title: draft.title?.trim() || prev.title,
        description: draft.description?.trim() || prev.description,
        difficulty,
        priority,
        learningObjectives:
          learningObjectives || prev.learningObjectives || "Learning goals",
        subjectArea,
        totalEstimatedHours:
          Number.isFinite(totalHours) && totalHours > 0
            ? totalHours.toString()
            : moduleDurationTotal > 0
            ? Math.round(moduleDurationTotal).toString()
            : prev.totalEstimatedHours || "",
        targetCompletionDate: targetDate,
        notes: draft.notes?.trim() || prev.notes,
      }));
      setModules(usableModules);

      setActiveTab("manual");
    } catch (err) {
      setError(err.message || "Failed to generate course");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Modal kicker="Create course" title="Add a new course" onClose={onCancel}>
      <div className={ui.tabs}>
        <button
          type="button"
          className={`${ui.tab} ${activeTab === "manual" ? ui.active : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          Manual
        </button>
        <button
          type="button"
          className={`${ui.tab} ${activeTab === "ai" ? ui.active : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          Ask AI
        </button>
      </div>

      {activeTab === "ai" && (
        <div className={styles.aiPane}>
          <p>Describe the course you want. We’ll draft the structure.</p>
          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., A 4-week React course with hooks, routing, and a capstone project"
          />
          <div className={ui.modalActions}>
            <Button
              type="button"
              variant="primary"
              onClick={handleAiGenerate}
              disabled={aiLoading}
            >
              {aiLoading ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
        </div>
      )}

      {activeTab === "manual" && (
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
      )}
    </Modal>
  );
}

export default CreateCourseModal;
