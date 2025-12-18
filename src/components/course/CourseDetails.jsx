import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaClock,
  FaBook,
  FaStickyNote,
  FaLink,
  FaCog,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { courseApi } from "../../services";
import Button from "../ui/Button";
import ui from "../ui/ui.module.css";
import ModuleTree from "./ModuleTree";
import ExternalLinks from "./ExternalLinks";
import ProgressCard from "./ProgressCard";
import EditCourseModal from "./EditCourseModal";
import styles from "./CourseDetails.module.css";

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) setLoading(true);
      const data = await courseApi.getCourse(id);
      setCourse(data);
      setNoteDraft(data.notes || "");
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUpdateCourse = async (updates) => {
    try {
      await courseApi.updateCourse(id, updates);
      setCourse((prev) => ({ ...prev, ...updates }));
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setError("");
    try {
      await courseApi.updateCourse(id, { notes: noteDraft });
      setCourse((prev) => (prev ? { ...prev, notes: noteDraft } : prev));
      setEditingNotes(false);
    } catch (err) {
      setError(err.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const moduleTotals = () => {
    const flat = flatModules;
    const total = flat.length;
    const completed = flat.filter((m) => m.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  const handleToggleModules = async (moduleIds, targetCompleted) => {
    try {
      setError("");

      // Optimistic local update to avoid page reload flicker
      setCourse((prev) => {
        if (!prev) return prev;
        const ids = new Set(moduleIds);

        const updatedModules = (prev.modules || []).map((mod) => {
          const topHit = ids.has(mod.id);
          const updatedSubs = (mod.subModules || []).map((sm) => ({
            ...sm,
            isCompleted:
              ids.has(sm.id) || topHit ? targetCompleted : sm.isCompleted,
          }));

          return {
            ...mod,
            isCompleted: topHit ? targetCompleted : mod.isCompleted,
            subModules: updatedSubs,
          };
        });

        return { ...prev, modules: updatedModules };
      });

      const moduleMap = new Map(flatModules.map((m) => [m.id, m]));
      const toToggle = moduleIds.filter(
        (mid) => moduleMap.get(mid)?.isCompleted !== targetCompleted
      );

      await Promise.all(
        toToggle.map((mid) => courseApi.toggleModuleCompletion(mid))
      );

      // Refresh quietly to ensure totals stay accurate
      fetchCourse({ silent: true });
    } catch (err) {
      setError(err?.message || "Failed to update module");
      fetchCourse({ silent: true });
    }
  };

  const flatModules = useMemo(() => {
    if (!course?.modules) return [];
    const roots = course.modules || [];
    const result = [];
    roots.forEach((root) => {
      result.push({ ...root, parentModuleId: null });
      (root.subModules || []).forEach((sub) => {
        result.push({ ...sub, parentModuleId: root.id });
      });
    });
    return result;
  }, [course]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error && !course) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={() => navigate("/app/course")}>
          <FaArrowLeft /> Back
        </Button>

        <div className={styles.title}>
          <h1>{course.title}</h1>
          <div className={styles.meta}>
            <span
              className={`${styles.badge} ${
                styles[course.difficulty?.toLowerCase()]
              }`}
            >
              {course.difficulty}
            </span>
            <span
              className={`${styles.badge} ${
                styles[course.priority?.toLowerCase()]
              }`}
            >
              {course.priority}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.timer}>
            <FaClock /> {moduleTotals().completed}/{moduleTotals().total}{" "}
            modules · {moduleTotals().percent}%
          </div>
          <Button variant="primary" onClick={() => setShowEditModal(true)}>
            <FaCog /> Edit
          </Button>
        </div>
      </header>

      {error && <div className={ui.errorBanner}>{error}</div>}

      <div className={styles.content}>
        <main className={styles.main}>
          <section className={styles.section}>
            <h2>
              <FaBook /> Course Modules
            </h2>
            <ModuleTree
              modules={flatModules}
              onUpdate={async (moduleId, updates) => {
                await courseApi.updateModule(moduleId, updates);
                fetchCourse();
              }}
              onToggleCompletion={handleToggleModules}
              onAdd={async (payload) => {
                await courseApi.createModule(id, payload);
                fetchCourse();
              }}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>
                <FaStickyNote /> Notes
              </h2>
              <div className={styles.noteActions}>
                {editingNotes ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      <FaSave /> {savingNotes ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingNotes(false);
                        setNoteDraft(course?.notes || "");
                      }}
                    >
                      <FaTimes /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => setEditingNotes(true)}>
                    <FaEdit /> Edit
                  </Button>
                )}
              </div>
            </div>

            {editingNotes ? (
              <div className={styles.notesEditor}>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={8}
                  placeholder="Write notes in Markdown..."
                />
                <p className={styles.noteHint}>
                  Markdown supported (bold, lists, links).
                </p>
              </div>
            ) : (
              <div className={styles.notePreview}>
                {noteDraft?.trim() ? (
                  <ReactMarkdown>{noteDraft}</ReactMarkdown>
                ) : (
                  <p className={styles.notesEmpty}>
                    No notes yet. Click Edit to add some.
                  </p>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h2>
              <FaClock /> Progress
            </h2>
            <ProgressCard
              progressPercentage={course.progressPercentage}
              completedModules={course.completedModules}
              totalModules={course.totalModules}
              totalHours={course.totalEstimatedHours}
              completedHours={course.completedHours}
              hoursRemaining={course.hoursRemaining}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>
                <FaLink /> Resources
              </h2>
              <Button
                variant="primary"
                onClick={async () => {
                  setError("");
                  try {
                    const created = await courseApi.addExternalLink(id, {
                      platform: "Website",
                      title: "",
                      url: "",
                    });

                    setCourse((prev) => {
                      if (!prev) return prev;
                      const existing = prev.externalLinks || [];
                      return {
                        ...prev,
                        externalLinks: [...existing, created],
                      };
                    });
                  } catch (err) {
                    setError(err?.message || "Failed to add external link");
                  }
                }}
              >
                + Add
              </Button>
            </div>
            <ExternalLinks
              links={course.externalLinks || []}
              onUpdate={async (linkId, updates) => {
                await courseApi.updateExternalLink(linkId, updates);
                fetchCourse();
              }}
              onDelete={async (linkId) => {
                await courseApi.deleteExternalLink(linkId);
                fetchCourse();
              }}
            />
          </section>
        </aside>
      </div>

      {showEditModal && (
        <EditCourseModal
          course={course}
          onSave={handleUpdateCourse}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

export default CourseDetails;
