import styles from "./CourseDetail.module.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrash, FaPlus, FaChevronRight, FaChevronDown, FaNotesMedical, FaCheck, FaTimes, FaSave, FaPencilAlt } from "react-icons/fa";
import api from "../../services/api";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [showAddModule, setShowAddModule] = useState(false);
  const [parentModuleId, setParentModuleId] = useState(null);
  const [newModuleData, setNewModuleData] = useState({
    title: '',
    estimatedHours: '',
    notes: ''
  });

  // Inline editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    subjectArea: '',
    learningObjectives: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);


  // Update edit data when course loads
  useEffect(() => {
    if (course) {
      setEditData({
        title: course.title || '',
        description: course.description || '',
        subjectArea: course.subjectArea || '',
        learningObjectives: course.learningObjectives || '',
        notes: course.notes || ''
      });
    }
  }, [course]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await api.getCourse(id);
      setCourse(data);
    } catch (err) {
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModuleCompletion = async (moduleId) => {
    try {
      await api.toggleModuleCompletion(moduleId);
      await fetchCourse(); // Refresh to update progress
    } catch (err) {
      setError("Failed to update module");
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (course) {
      setEditData({
        title: course.title || '',
        description: course.description || '',
        subjectArea: course.subjectArea || '',
        learningObjectives: course.learningObjectives || '',
        notes: course.notes || ''
      });
    }
  };

  const saveEditing = async () => {
    setSaving(true);
    try {
      await api.editCourse(course.id, {
        ...course,
        ...editData
      });
      await fetchCourse();
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };


  const toggleModuleExpansion = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleAddModule = (parentId = null) => {
    setParentModuleId(parentId);
    setNewModuleData({ title: '', estimatedHours: '', notes: '' });
    setShowAddModule(true);
  };

  const handleCreateModule = async () => {
    if (!newModuleData.title.trim() || !newModuleData.estimatedHours) {
      return;
    }

    try {
      // This would need to be implemented in the API
      // For now, we'll just close the modal
      setShowAddModule(false);
      setNewModuleData({ title: '', estimatedHours: '', notes: '' });
      // Refresh course data
      await fetchCourse();
    } catch (error) {
      console.error('Failed to create module:', error);
    }
  };

  const calculateProgress = () => {
    if (!course) return 0;
    const totalHours = course.totalEstimatedHours;
    const remainingHours = course.hoursRemaining;
    return totalHours > 0 ? ((totalHours - remainingHours) / totalHours) * 100 : 0;
  };

  const organizeModules = (modules) => {
    if (!modules) return [];

    // Create a map for quick lookup
    const moduleMap = new Map();
    const rootModules = [];

    // First pass: create map and identify root modules
    modules.forEach(module => {
      moduleMap.set(module.id, { ...module, subModules: [] });
    });

    // Second pass: build hierarchy
    modules.forEach(module => {
      const moduleWithSubs = moduleMap.get(module.id);
      if (module.parentModuleId) {
        const parent = moduleMap.get(module.parentModuleId);
        if (parent) {
          parent.subModules.push(moduleWithSubs);
          // Sort submodules by order
          parent.subModules.sort((a, b) => a.order - b.order);
        }
      } else {
        rootModules.push(moduleWithSubs);
      }
    });

    // Sort root modules by order
    return rootModules.sort((a, b) => a.order - b.order);
  };

  const renderModuleTree = (modules, level = 0, parentIndex = '') => {
    return modules.map((module, index) => {
      const moduleNumber = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;
      const hasChildren = module.subModules && module.subModules.length > 0;
      const isExpanded = expandedModules.has(module.id);

      return (
        <div key={module.id} className={styles.moduleTreeItem}>
          {/* Connection line for nested items */}
          {level > 0 && (
            <div className={styles.connectionLine} style={{ left: `${(level - 1) * 32 + 16}px` }}></div>
          )}

          <div
            className={`${styles.moduleCard} ${level > 0 ? styles.nestedModule : styles.mainModule} ${module.isCompleted ? styles.completed : ''}`}
            onClick={() => handleToggleModuleCompletion(module.id)}
          >
            <div className={styles.moduleHeader}>
              <div className={styles.moduleInfo}>
                <div className={styles.moduleMeta}>
                  <span className={`${styles.moduleNumber} ${level > 0 ? styles.subNumber : styles.mainNumber}`}>
                    {moduleNumber}
                  </span>
                  {hasChildren && (
                    <button
                      className={`${styles.expandBtn} ${isExpanded ? styles.expanded : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleExpansion(module.id);
                      }}
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                    </button>
                  )}
                  {/* Completion checkbox */}
                  <div className={styles.completionCheckbox}>
                    <input
                      type="checkbox"
                      checked={module.isCompleted || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleModuleCompletion(module.id);
                      }}
                      className={styles.checkbox}
                    />
                  </div>
                </div>
                <div className={styles.moduleContentArea}>
                  <h3 className={`${styles.moduleTitle} ${module.isCompleted ? styles.completedTitle : ''}`}>
                    {module.title}
                  </h3>
                  <div className={styles.moduleStats}>
                    <span className={styles.moduleHours}>
                      <span className={styles.timeIcon}>⏱️</span>
                      {module.estimatedHours}h
                    </span>
                    {module.isCompleted && (
                      <span className={styles.completedBadge}>
                        <span className={styles.checkIcon}>✓</span>
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.moduleActions}>
                <button
                  className={styles.addSubBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddModule(module.id);
                  }}
                  title="Add sub-module"
                >
                  <FaPlus />
                  <span className={styles.btnLabel}>Sub</span>
                </button>
              </div>
            </div>

            {/* Module notes */}
            {module.notes && (
              <div className={styles.moduleNotes}>
                <div className={styles.notesIcon}>📝</div>
                <div className={styles.notesContent}>
                  <p className={styles.notesText}>{module.notes}</p>
                </div>
              </div>
            )}

            {/* Nested sub-modules */}
            {hasChildren && isExpanded && (
              <div className={styles.subModulesContainer}>
                {renderModuleTree(module.subModules, level + 1, moduleNumber)}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading course...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          {error || "Course not found"}
          <button onClick={() => navigate("/app/course")} className={styles.backBtn}>
            <FaArrowLeft /> Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => navigate("/app/course")} className={styles.backBtn}>
          <FaArrowLeft /> Back to Courses
        </button>
        <div className={styles.headerContent}>
          <div className={styles.courseImage}>
            <div className={styles.imagePlaceholder}>
              {(isEditing ? editData.title : course.title).charAt(0).toUpperCase()}
            </div>
          </div>
          <div className={styles.courseInfo}>
            {isEditing ? (
              <input
                type="text"
                className={styles.titleInput}
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Course title"
              />
            ) : (
              <h1>{course.title}</h1>
            )}

            <div className={styles.meta}>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.subjectInput}
                  value={editData.subjectArea}
                  onChange={(e) => setEditData(prev => ({ ...prev, subjectArea: e.target.value }))}
                  placeholder="Subject area"
                />
              ) : (
                <span className={styles.subject}>{course.subjectArea}</span>
              )}
              <span className={styles.difficulty}>{course.difficulty}</span>
              <span className={styles.priority}>{course.priority}</span>
            </div>

            {isEditing ? (
              <textarea
                className={styles.descriptionInput}
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Course description"
                rows={2}
              />
            ) : (
              <p className={styles.description}>{course.description}</p>
            )}

            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
              <span className={styles.progressText}>
                {Math.round(progress)}% Complete • {course.hoursRemaining}h remaining
              </span>
            </div>
          </div>
          <div className={styles.actions}>
            {isEditing ? (
              <div className={styles.editActions}>
                <button
                  className={styles.saveBtn}
                  onClick={saveEditing}
                  disabled={saving}
                >
                  <FaSave /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            ) : (
              <button className={styles.editBtn} onClick={startEditing}>
                <FaPencilAlt /> Edit Course
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          {/* Learning Objectives */}
          {(course.learningObjectives || isEditing) && (
            <section className={styles.section}>
              <h2>Learning Objectives</h2>
              {isEditing ? (
                <textarea
                  className={styles.objectivesInput}
                  value={editData.learningObjectives}
                  onChange={(e) => setEditData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                  placeholder="What will you learn in this course?"
                  rows={3}
                />
              ) : (
                <p>{course.learningObjectives}</p>
              )}
            </section>
          )}

          {/* Course Modules */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Course Modules</h2>
              <button className={styles.addBtn}>
                <FaPlus /> Add Module
              </button>
            </div>
            <div className={styles.modulesTree}>
              {renderModuleTree(organizeModules(course.modules))}
            </div>
          </section>

          {/* Course Notes */}
          {(course.notes || isEditing) && (
            <section className={styles.section}>
              <h2>
                <FaNotesMedical /> Course Notes
              </h2>
              {isEditing ? (
                <textarea
                  className={styles.notesInput}
                  value={editData.notes}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes, resources, or reminders"
                  rows={4}
                />
              ) : (
                <div className={styles.notes}>
                  {course.notes}
                </div>
              )}
            </section>
          )}

          {/* External Links */}
          {course.externalLinks && course.externalLinks.length > 0 && (
            <section className={styles.section}>
              <h2>External Resources</h2>
              <div className={styles.linksList}>
                {course.externalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    <span className={styles.linkPlatform}>{link.platform}</span>
                    <span className={styles.linkTitle}>{link.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.quickActions}>
            <h3>📊 Course Progress</h3>
            <div className={styles.progressOverview}>
              <div className={styles.progressCircle}>
                <span className={styles.progressValue}>{Math.round(calculateProgress())}%</span>
                <span className={styles.progressLabel}>Complete</span>
              </div>
              <div className={styles.progressDetails}>
                <div className={styles.detailItem}>
                  <span>Total Hours:</span>
                  <span>{course.totalEstimatedHours}h</span>
                </div>
                <div className={styles.detailItem}>
                  <span>Completed:</span>
                  <span>{course.totalEstimatedHours - course.hoursRemaining}h</span>
                </div>
                <div className={styles.detailItem}>
                  <span>Remaining:</span>
                  <span>{course.hoursRemaining}h</span>
                </div>
              </div>
            </div>

            <div className={styles.studyTips}>
              <h4>💡 Study Tips</h4>
              <ul>
                <li>Click modules to mark as complete</li>
                <li>Use sub-modules for detailed breakdown</li>
                <li>Review course notes regularly</li>
                <li>Stay consistent with your learning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>
                  {parentModuleId ? 'Add sub-module' : 'Add module'}
                </p>
                <h2>{parentModuleId ? 'Create a sub-module' : 'Create a new module'}</h2>
              </div>
              <button
                className={styles.iconBtn}
                type="button"
                onClick={() => setShowAddModule(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalForm}>
              <label>
                Module title *
                <input
                  type="text"
                  placeholder="e.g. Introduction to React"
                  value={newModuleData.title}
                  onChange={(e) => setNewModuleData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>

              <label>
                Estimated hours *
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="2.5"
                  value={newModuleData.estimatedHours}
                  onChange={(e) => setNewModuleData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  required
                />
              </label>

              <label>
                Notes (optional)
                <textarea
                  placeholder="Additional notes or resources for this module"
                  rows={3}
                  value={newModuleData.notes}
                  onChange={(e) => setNewModuleData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </label>

              <div className={styles.formActions}>
                <button
                  className={styles.secondaryBtn}
                  type="button"
                  onClick={() => setShowAddModule(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  type="button"
                  onClick={handleCreateModule}
                  disabled={!newModuleData.title.trim() || !newModuleData.estimatedHours}
                >
                  Create Module
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
