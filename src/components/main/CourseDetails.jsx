import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaExternalLinkAlt,
  FaClock,
  FaBook,
  FaStickyNote,
  FaLink,
  FaCog,
} from "react-icons/fa";
import api from "../../services/api";
import styles from "./CourseDetails.module.css";

const PLATFORMS = ["Udemy", "Coursera", "YouTube", "Website"];

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [activeTime, setActiveTime] = useState(0); // in seconds
  const [isPageActive, setIsPageActive] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);
  const lastActiveTimeRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  // Active time tracking
  useEffect(() => {
    if (!course || !isPageActive) return;

    // Start tracking when page becomes active
    startTimeRef.current = Date.now();
    lastActiveTimeRef.current = Date.now();

    // Track active time every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - lastActiveTimeRef.current) / 1000; // seconds

      // Only count if user was active (less than 5 minutes since last activity)
      if (timeDiff < 300) {
        setActiveTime((prev) => {
          const newTime = prev + 1;
          activeTimeRef.current = newTime;
          // Update backend every 30 seconds
          if (newTime % 30 === 0) {
            updateActiveTime(newTime);
          }
          return newTime;
        });
      }

      lastActiveTimeRef.current = now;
    }, 1000);

    // Track user activity
    const handleActivity = () => {
      lastActiveTimeRef.current = Date.now();
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPageActive(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Save time when page becomes hidden
        updateActiveTime(activeTime);
      } else {
        setIsPageActive(true);
        lastActiveTimeRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Save time on unmount - use ref to get current value
      if (activeTimeRef.current > 0) {
        updateActiveTime(activeTimeRef.current);
      }
    };
  }, [course, isPageActive, id]);

  const activeTimeRef = useRef(0);

  const updateActiveTime = async (seconds) => {
    try {
      const hours = seconds / 3600;
      await api.updateCourseActiveTime(id, hours);
    } catch (err) {
      console.error("Failed to update active time:", err);
    }
  };

  // Fetch course data
  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getCourse(id);
      setCourse(data);
      setActiveTime(0); // Reset active time when course loads
      activeTimeRef.current = 0;
    } catch (err) {
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      title: course.title,
      description: course.description,
      subjectArea: course.subjectArea,
      learningObjectives: course.learningObjectives,
      difficulty: course.difficulty,
      priority: course.priority,
      totalEstimatedHours: course.totalEstimatedHours.toString(),
      targetCompletionDate: course.targetCompletionDate
        ? course.targetCompletionDate.split("T")[0]
        : "",
      notes: course.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveCourse = async () => {
    try {
      setSaving(true);
      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        subjectArea: editFormData.subjectArea,
        learningObjectives: editFormData.learningObjectives,
        difficulty: editFormData.difficulty,
        priority: editFormData.priority,
        totalEstimatedHours: parseInt(editFormData.totalEstimatedHours) || 0,
        targetCompletionDate: editFormData.targetCompletionDate || null,
        notes: editFormData.notes,
      };

      await api.updateCourse(id, updateData);
      setCourse((prev) => ({ ...prev, ...updateData }));
      setShowEditModal(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    try {
      const updateData = { [field]: value };
      await api.updateCourse(id, updateData);
      setCourse((prev) => ({ ...prev, [field]: value }));
      setEditingField(null);
    } catch (err) {
      setError(err.message || "Failed to update course");
    }
  };

  const handleModuleUpdate = async (moduleId, updates) => {
    try {
      await api.updateModule(moduleId, updates);
      await fetchCourse(); // Refresh to get updated module structure
    } catch (err) {
      setError(err.message || "Failed to update module");
    }
  };

  const handleToggleModuleCompletion = async (moduleId) => {
    try {
      await api.toggleModuleCompletion(moduleId);
      await fetchCourse();
    } catch (err) {
      setError(err.message || "Failed to toggle module completion");
    }
  };

  const handleAddExternalLink = async () => {
    try {
      const newLink = {
        platform: "Website",
        title: "",
        url: "",
      };
      await api.addExternalLink(id, newLink);
      await fetchCourse();
    } catch (err) {
      setError(err.message || "Failed to add external link");
    }
  };

  const handleUpdateExternalLink = async (linkId, updates) => {
    try {
      await api.updateExternalLink(linkId, updates);
      await fetchCourse();
    } catch (err) {
      setError(err.message || "Failed to update external link");
    }
  };

  const handleDeleteExternalLink = async (linkId) => {
    try {
      await api.deleteExternalLink(linkId);
      await fetchCourse();
    } catch (err) {
      setError(err.message || "Failed to delete external link");
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const calculateProgress = () => {
    if (!course || course.totalEstimatedHours === 0) return 0;
    return Math.round(
      ((course.totalEstimatedHours - course.hoursRemaining) /
        course.totalEstimatedHours) *
        100
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading course details...</div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate("/app/course")} className={styles.backBtn}>
          <FaArrowLeft /> Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate("/app/course")} className={styles.backBtn}>
            <FaArrowLeft /> Back to Courses
          </button>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.courseTitle}>
            <h1>{course.title}</h1>
            <div className={styles.courseMeta}>
              <span className={`${styles.badge} ${styles[course.difficulty?.toLowerCase()]}`}>
                {course.difficulty}
              </span>
              <span className={`${styles.badge} ${styles[course.priority?.toLowerCase()]}`}>
                {course.priority}
              </span>
              <span className={styles.metaText}>
                {course.totalEstimatedHours}h • {Math.round(calculateProgress())}% complete
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.activeTime}>
            <FaClock /> {formatTime(activeTime)}
          </div>
          <button onClick={handleOpenEditModal} className={styles.editCourseBtn}>
            <FaCog /> Edit Course
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.mainContent}>
          {/* Modules Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FaBook /> Course Modules
              </h2>
            </div>
            <ModuleTree
              modules={course.modules || []}
              onUpdate={handleModuleUpdate}
              onToggleCompletion={handleToggleModuleCompletion}
            />
          </section>

          {/* Course Notes Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FaStickyNote /> Course Notes
            </h2>
            <EditableField
              value={course.notes || ""}
              editing={editingField === "notes"}
              onEdit={() => setEditingField("notes")}
              onCancel={() => setEditingField(null)}
              onSave={(value) => handleFieldUpdate("notes", value)}
              multiline
              placeholder="Add your course notes here..."
            />
          </section>
        </div>

        <div className={styles.sidebar}>
          {/* Progress Overview */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FaClock /> Progress Overview
            </h2>
            <div className={styles.progressCard}>
              <div className={styles.progressCircle}>
                <div className={styles.progressValue}>{Math.round(calculateProgress())}%</div>
                <div className={styles.progressLabel}>Complete</div>
              </div>
              <div className={styles.progressStats}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{course.totalEstimatedHours - course.hoursRemaining}</div>
                  <div className={styles.statLabel}>Hours Done</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{course.hoursRemaining}</div>
                  <div className={styles.statLabel}>Hours Left</div>
                </div>
              </div>
            </div>
          </section>

          {/* Course Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FaBook /> Course Details
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Subject Area</label>
                <div className={styles.value}>{course.subjectArea || "Not specified"}</div>
              </div>

              <div className={styles.infoItem}>
                <label>Learning Objectives</label>
                <div className={styles.value}>
                  {course.learningObjectives ? (
                    <pre className={styles.objectivesText}>{course.learningObjectives}</pre>
                  ) : (
                    "Not specified"
                  )}
                </div>
              </div>

              <div className={styles.infoItem}>
                <label>Target Completion</label>
                <div className={styles.value}>
                  {course.targetCompletionDate
                    ? new Date(course.targetCompletionDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No target date"}
                </div>
              </div>

              <div className={styles.infoItem}>
                <label>Last Studied</label>
                <div className={styles.value}>
                  {course.lastStudiedAt
                    ? new Date(course.lastStudiedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Never"}
                </div>
              </div>
            </div>
          </section>

          {/* External Links Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FaLink /> Learning Resources
              </h2>
              <button
                onClick={handleAddExternalLink}
                className={styles.addBtn}
                title="Add External Link"
              >
                <FaPlus /> Add
              </button>
            </div>
            <ExternalLinksList
              links={course.externalLinks || []}
              onUpdate={handleUpdateExternalLink}
              onDelete={handleDeleteExternalLink}
            />
          </section>
        </div>
      </div>

      {/* Edit Course Modal */}
      {showEditModal && (
        <EditCourseModal
          course={course}
          formData={editFormData}
          setFormData={setEditFormData}
          onSave={handleSaveCourse}
          onCancel={() => setShowEditModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  editing,
  onEdit,
  onCancel,
  onSave,
  multiline = false,
  type = "text",
  options = [],
  placeholder = "",
}) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value, editing]);

  const handleSave = () => {
    onSave(editValue);
  };

  if (!editing) {
    return (
      <div className={styles.infoItem}>
        {label && <label>{label}</label>}
        <div className={styles.valueContainer}>
          <div className={styles.value}>
            {multiline ? (
              <pre className={styles.multilineValue}>{value || placeholder}</pre>
            ) : (
              value || <span className={styles.placeholder}>{placeholder}</span>
            )}
          </div>
          <button onClick={onEdit} className={styles.editBtn} title="Edit">
            <FaEdit />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.infoItem}>
      {label && <label>{label}</label>}
      <div className={styles.editContainer}>
        {type === "select" ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={styles.editInput}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={styles.editTextarea}
            rows={4}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={styles.editInput}
            placeholder={placeholder}
          />
        )}
        <div className={styles.editActions}>
          <button onClick={handleSave} className={styles.saveBtn} title="Save">
            <FaSave />
          </button>
          <button onClick={onCancel} className={styles.cancelBtn} title="Cancel">
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleTree({ modules, onUpdate, onToggleCompletion }) {
  const [expanded, setExpanded] = useState(new Set([modules.find(m => !m.parentModuleId)?.id].filter(Boolean)));
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [draggedModule, setDraggedModule] = useState(null);

  // Build tree structure
  const buildTree = (modules) => {
    const moduleMap = new Map();
    const rootModules = [];

    // First pass: create map
    modules.forEach((module) => {
      moduleMap.set(module.id, { ...module, children: [] });
    });

    // Second pass: build tree
    modules.forEach((module) => {
      const node = moduleMap.get(module.id);
      if (module.parentModuleId) {
        const parent = moduleMap.get(module.parentModuleId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootModules.push(node);
        }
      } else {
        rootModules.push(node);
      }
    });

    // Sort by order
    const sortModules = (mods) => {
      mods.sort((a, b) => a.order - b.order);
      mods.forEach((mod) => {
        if (mod.children.length > 0) {
          sortModules(mod.children);
        }
      });
    };

    sortModules(rootModules);
    return rootModules;
  };

  const tree = buildTree(modules);

  const toggleExpand = (moduleId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getIndentationStyle = (depth) => {
    return {
      paddingLeft: `${depth * 32}px`,
      position: 'relative'
    };
  };

  const getConnectorStyle = (depth, isLast = false) => {
    if (depth === 0) return {};

    return {
      position: 'absolute',
      left: `${(depth - 1) * 32 + 16}px`,
      top: 0,
      bottom: 0,
      width: '2px',
      background: isLast ? 'transparent' : 'var(--border)',
      zIndex: 1
    };
  };

  const renderModule = (module, depth = 0, isLastSibling = false) => {
    const hasChildren = module.children && module.children.length > 0;
    const isExpanded = expanded.has(module.id);
    const isEditing = editing === module.id;
    const isCompleted = module.isCompleted || false;

    return (
      <div
        key={module.id}
        className={`${styles.moduleItem} ${isCompleted ? styles.moduleCompleted : ''}`}
        style={getIndentationStyle(depth)}
        draggable
        onDragStart={(e) => setDraggedModule(module.id)}
        onDragEnd={() => setDraggedModule(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedModule && draggedModule !== module.id) {
            // Handle reordering logic here if needed
            console.log(`Move module ${draggedModule} to position of ${module.id}`);
          }
        }}
      >
        {/* Connector line */}
        {depth > 0 && (
          <div style={getConnectorStyle(depth, isLastSibling)} />
        )}

        <div className={styles.moduleHeader}>
          <div className={styles.moduleControls}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(module.id)}
                className={styles.expandBtn}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </button>
            ) : (
              <span className={styles.expandSpacer} />
            )}

            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => onToggleCompletion(module.id)}
              className={styles.completionCheckbox}
              title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            />
          </div>

          {isEditing ? (
            <div className={styles.moduleEditForm}>
              <input
                type="text"
                value={editValues.title || module.title}
                onChange={(e) =>
                  setEditValues({ ...editValues, title: e.target.value })
                }
                className={styles.moduleTitleInput}
                placeholder="Module title"
                autoFocus
              />
              <textarea
                value={editValues.description !== undefined ? editValues.description : (module.description || "")}
                onChange={(e) =>
                  setEditValues({ ...editValues, description: e.target.value })
                }
                className={styles.moduleDescInput}
                placeholder="Module description (optional)"
                rows={2}
              />
              <div className={styles.moduleEditActions}>
                <button
                  onClick={() => {
                    onUpdate(module.id, editValues);
                    setEditing(null);
                    setEditValues({});
                  }}
                  className={styles.saveBtn}
                  title="Save changes"
                >
                  <FaSave />
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setEditValues({});
                  }}
                  className={styles.cancelBtn}
                  title="Cancel editing"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.moduleContent}>
              <div className={styles.moduleTitleContainer}>
                <div className={`${styles.moduleTitle} ${isCompleted ? styles.completedTitle : ''}`}>
                  {module.title}
                </div>
                <div className={styles.moduleBadges}>
                  <span className={styles.hoursBadge}>
                    {module.estimatedHours}h
                  </span>
                  {isCompleted && (
                    <span className={styles.completedBadge}>
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>

              {module.description && (
                <div className={styles.moduleDescription}>
                  {module.description}
                </div>
              )}

              {module.notes && (
                <div className={styles.moduleNotes}>
                  <FaStickyNote /> {module.notes}
                </div>
              )}
            </div>
          )}

          {!isEditing && (
            <button
              onClick={() => {
                setEditing(module.id);
                setEditValues({
                  title: module.title,
                  description: module.description || "",
                });
              }}
              className={styles.editBtn}
              title="Edit module"
            >
              <FaEdit />
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className={styles.moduleChildren}>
            {module.children.map((child, index) =>
              renderModule(child, depth + 1, index === module.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.moduleTree}>
      {tree.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <p>No modules added yet</p>
          <small>Click "Edit Course" to add your first module</small>
        </div>
      ) : (
        tree.map((module, index) => renderModule(module, 0, index === tree.length - 1))
      )}
    </div>
  );
}

function ExternalLinksList({ links, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleStartEdit = (link) => {
    setEditing(link.id);
    setEditValues({
      platform: link.platform,
      title: link.title,
      url: link.url,
    });
  };

  const handleSave = (linkId) => {
    onUpdate(linkId, editValues);
    setEditing(null);
    setEditValues({});
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case "udemy":
        return "🎓";
      case "coursera":
        return "📚";
      case "youtube":
        return "▶️";
      default:
        return "🔗";
    }
  };

  if (links.length === 0) {
    return (
      <div className={styles.emptyState}>No external links added yet</div>
    );
  }

  return (
    <div className={styles.linksList}>
      {links.map((link) => (
        <div key={link.id} className={styles.linkItem}>
          {editing === link.id ? (
            <div className={styles.linkEditForm}>
              <select
                value={editValues.platform}
                onChange={(e) =>
                  setEditValues({ ...editValues, platform: e.target.value })
                }
                className={styles.linkSelect}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues({ ...editValues, title: e.target.value })
                }
                placeholder="Link title"
                className={styles.linkInput}
              />
              <input
                type="url"
                value={editValues.url}
                onChange={(e) =>
                  setEditValues({ ...editValues, url: e.target.value })
                }
                placeholder="https://..."
                className={styles.linkInput}
              />
              <div className={styles.linkEditActions}>
                <button
                  onClick={() => handleSave(link.id)}
                  className={styles.saveBtn}
                >
                  <FaSave />
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setEditValues({});
                  }}
                  className={styles.cancelBtn}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.linkContent}>
                <span className={styles.linkIcon}>
                  {getPlatformIcon(link.platform)}
                </span>
                <div className={styles.linkInfo}>
                  <div className={styles.linkPlatform}>{link.platform}</div>
                  <div className={styles.linkTitle}>{link.title || "Untitled"}</div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkUrl}
                  >
                    {link.url} <FaExternalLinkAlt />
                  </a>
                </div>
              </div>
              <div className={styles.linkActions}>
                <button
                  onClick={() => handleStartEdit(link)}
                  className={styles.editBtn}
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => onDelete(link.id)}
                  className={styles.deleteBtn}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function EditCourseModal({ course, formData, setFormData, onSave, onCancel, saving }) {
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Edit Course</h2>
          <button onClick={onCancel} className={styles.modalCloseBtn}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Subject Area</label>
              <input
                type="text"
                value={formData.subjectArea}
                onChange={(e) => handleInputChange("subjectArea", e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Learning Objectives</label>
              <textarea
                value={formData.learningObjectives}
                onChange={(e) => handleInputChange("learningObjectives", e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange("difficulty", e.target.value)}
                className={styles.formSelect}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className={styles.formSelect}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Total Hours</label>
              <input
                type="number"
                value={formData.totalEstimatedHours}
                onChange={(e) => handleInputChange("totalEstimatedHours", e.target.value)}
                className={styles.formInput}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Target Completion Date</label>
              <input
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) => handleInputChange("targetCompletionDate", e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className={styles.formTextarea}
              rows={4}
              placeholder="Add course notes..."
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onCancel} className={styles.cancelBtn} disabled={saving}>
            Cancel
          </button>
          <button onClick={onSave} className={styles.saveBtn} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseDetails;

