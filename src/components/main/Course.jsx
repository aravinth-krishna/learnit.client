import styles from "./Course.module.css";
import {
  FaFilter,
  FaSearch,
  FaSort,
  FaPlay,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { IoIosAdd } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const filterGroups = {
  priority: ["Low", "Medium", "High"],
  difficulty: ["Beginner", "Intermediate", "Advanced"],
  duration: ["< 1 hour", "1-3 hours", "> 3 hours"],
};

const sortOptions = [
  { value: "createdAt", label: "Date Created" },
  { value: "title", label: "Title" },
  { value: "priority", label: "Priority" },
  { value: "difficulty", label: "Difficulty" },
  { value: "hours", label: "Total Hours" },
];

function Course() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    activeCourses: "00",
    weeklyFocus: "0 hrs",
    nextMilestone: "No courses yet",
  });

  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    priority: [],
    difficulty: [],
    duration: [],
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [createMode, setCreateMode] = useState("manual");
  const [modules, setModules] = useState([{ id: Date.now(), title: "", duration: "", parentModuleId: null }]);
  const [externalLinks, setExternalLinks] = useState([
    { platform: "", title: "", url: "" },
  ]);
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
  const [submitting, setSubmitting] = useState(false);

  // Fetch courses
  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [search, selectedFilters, sortBy, sortOrder]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        search: search || undefined,
        priority:
          selectedFilters.priority.length > 0
            ? selectedFilters.priority.join(",")
            : undefined,
        difficulty:
          selectedFilters.difficulty.length > 0
            ? selectedFilters.difficulty.join(",")
            : undefined,
        duration:
          selectedFilters.duration.length > 0
            ? selectedFilters.duration[0] // API expects single duration value
            : undefined,
        sortBy,
        sortOrder,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const data = await api.getCourses(params);
      setCourses(data);
    } catch (err) {
      setError(err.message || "Failed to load courses");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getCourseStats();
      setStats({
        activeCourses: data.activeCourses,
        weeklyFocus: data.weeklyFocus,
        nextMilestone: data.nextMilestone,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const toggleFilter = (group, option) => {
    setSelectedFilters((prev) => {
      const set = new Set(prev[group]);
      if (set.has(option)) {
        set.delete(option);
      } else {
        set.add(option);
      }
      return { ...prev, [group]: Array.from(set) };
    });
  };

  const resetFilters = () => {
    setSelectedFilters({ priority: [], difficulty: [], duration: [] });
    setSearch("");
  };

  const handleModuleChange = (index, field, value) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === index ? { ...module, [field]: value } : module
      )
    );
  };

  const addModule = (parentModuleId = null) =>
    setModules((prev) => [...prev, { id: Date.now() + Math.random(), title: "", duration: "", parentModuleId }]);

  const removeModule = (index) =>
    setModules((prev) => prev.filter((_, i) => i !== index));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    setSubmitting(true);
    setError("");

    try {
      // Validate modules
      const validModules = modules.filter(
        (m) => m.title.trim() !== "" && m.duration !== ""
      );

      if (validModules.length === 0) {
        setError("Please add at least one module");
        setSubmitting(false);
        return;
      }

      // Validate external links
      const validLinks = externalLinks.filter(
        (l) =>
          l.platform.trim() !== "" &&
          l.title.trim() !== "" &&
          l.url.trim() !== ""
      );

      const courseData = {
        title: formData.title,
        description: formData.description,
        subjectArea: formData.subjectArea,
        learningObjectives: formData.learningObjectives,
        difficulty: formData.difficulty,
        priority: formData.priority,
        totalEstimatedHours: parseInt(formData.totalEstimatedHours) || 0,
        targetCompletionDate: formData.targetCompletionDate || null,
        notes: formData.notes,
        modules: validModules.map((m) => ({
          title: m.title,
          estimatedHours: parseInt(m.duration) || 0,
          parentModuleId: m.parentModuleId,
        })),
        externalLinks: validLinks.map((l) => ({
          platform: l.platform,
          title: l.title,
          url: l.url,
        })),
      };

      await api.editCourse(editingCourse.id, courseData);

      // Refresh courses and close modal
      await fetchCourses();
      setShowEdit(false);
      setEditingCourse(null);

      // Reset form
      setFormData({
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
      setModules([{ id: Date.now(), title: "", duration: "", parentModuleId: null }]);
      setExternalLinks([{ platform: "", title: "", url: "" }]);
    } catch (err) {
      setError(err.message || "Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Validate modules
      const validModules = modules.filter(
        (m) => m.title.trim() !== "" && m.duration !== ""
      );

      if (validModules.length === 0) {
        setError("Please add at least one module");
        setSubmitting(false);
        return;
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        subjectArea: formData.subjectArea,
        learningObjectives: formData.learningObjectives,
        difficulty: formData.difficulty,
        priority: formData.priority,
        totalEstimatedHours: parseInt(formData.totalEstimatedHours) || 0,
        targetCompletionDate: formData.targetCompletionDate || null,
        modules: validModules.map((m) => ({
          title: m.title,
          estimatedHours: parseInt(m.duration) || 0,
          parentModuleId: m.parentModuleId,
        })),
      };

      await api.createCourse(courseData);

      // Reset form
      setFormData({
        title: "",
        description: "",
        subjectArea: "",
        learningObjectives: "",
        difficulty: "",
        priority: "",
        totalEstimatedHours: "",
        targetCompletionDate: "",
      });
      setModules([{ title: "", duration: "" }]);
      setShowCreate(false);

      // Refresh courses
      await fetchCourses();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCourse = async (courseId) => {
    try {
      const course = await api.getCourse(courseId);
      setEditingCourse(course);

      // Populate form with course data
      setFormData({
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

      setModules(
        course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          duration: m.estimatedHours.toString(),
          parentModuleId: m.parentModuleId,
        }))
      );

      setExternalLinks(
        course.externalLinks.length > 0
          ? course.externalLinks.map((l) => ({
              platform: l.platform,
              title: l.title,
              url: l.url,
            }))
          : [{ platform: "", title: "", url: "" }]
      );

      setShowEdit(true);
    } catch (err) {
      setError("Failed to load course for editing");
      console.error(err);
    }
  };


  const handleDeleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await api.deleteCourse(id);
      await fetchCourses();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete course");
    }
  };

  const getDurationCategory = (hours) => {
    if (hours < 1) return "< 1 hour";
    if (hours <= 3) return "1-3 hours";
    return "> 3 hours";
  };

  return (
    <section className={styles.page}>
      <header className={styles.pageHero}>
        <div>
          <p className={styles.kicker}>Course Management</p>
          <h1>Course workspace</h1>
          <p className={styles.subtle}>
            Create, organize, and track your learning courses.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            className={styles.secondaryBtn}
            type="button"
            onClick={resetFilters}
          >
            Clear filters
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <IoIosAdd size={18} />
            New course
          </button>
        </div>
      </header>

      {error && !loading && (
        <div
          className={styles.errorMessage}
          style={{
            color: "red",
            padding: "12px",
            border: "1px solid red",
            background: "#ffe6e6",
          }}
        >
          {error}
        </div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span>Active courses</span>
          <strong>{stats.activeCourses}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Weekly focus</span>
          <strong>{stats.weeklyFocus}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Next milestone</span>
          <strong>{stats.nextMilestone}</strong>
        </div>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.sortControls}>
          <FaSort />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <span className={styles.resultSummary}>
          {loading
            ? "Loading..."
            : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className={styles.filtersBar}>
        <span>
          <FaFilter /> Filters
        </span>
        <div className={styles.filterGroupsRow}>
          {Object.entries(filterGroups).map(([group, options]) => (
            <div key={group} className={styles.filterGroup}>
              <p>{group}</p>
              <div className={styles.chips}>
                {options.map((option) => {
                  const active = selectedFilters[group].includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.chip} ${
                        active ? styles.chipActive : ""
                      }`}
                      onClick={() => toggleFilter(group, option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.primaryColumn}>
          {loading ? (
            <div className={styles.emptyState}>
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No courses found. Create your first course to get started!</p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setShowCreate(true)}
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  duration={getDurationCategory(course.totalEstimatedHours)}
                  onDelete={handleDeleteCourse}
                  onEdit={handleEditCourse}
                  notes={course.notes}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Create course</p>
                <h2>Add a new course</h2>
              </div>
              <button
                className={styles.iconBtn}
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setError("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                type="button"
                className={`${styles.tab} ${styles.tabActive}`}
                onClick={() => setCreateMode("manual")}
              >
                Build manually
              </button>
              <button
                type="button"
                className={`${styles.tab} ${styles.tabDisabled}`}
                disabled
                title="AI features coming soon"
              >
                Ask AI (Coming Soon)
              </button>
            </div>

            {createMode === "manual" && (
              <form className={styles.modalForm} onSubmit={handleManualSubmit}>
                <div className={styles.formGrid}>
                  <label>
                    Course title *
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g. Machine Learning Foundations"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Subject area
                    <select
                      name="subjectArea"
                      value={formData.subjectArea}
                      onChange={handleInputChange}
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
                    placeholder="Brief description of the course"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Learning objectives
                  <textarea
                    name="learningObjectives"
                    placeholder="What will you achieve? e.g. Build ML models, understand algorithms"
                    rows={2}
                    value={formData.learningObjectives}
                    onChange={handleInputChange}
                  />
                </label>

                <div className={styles.formGrid}>
                  <label>
                    Difficulty level
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                    >
                      <option value="">Select priority</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <label>
                    Total estimated hours *
                    <input
                      type="number"
                      name="totalEstimatedHours"
                      min="1"
                      placeholder="24"
                      value={formData.totalEstimatedHours}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Target completion
                    <input
                      type="date"
                      name="targetCompletionDate"
                      value={formData.targetCompletionDate}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                <div className={styles.modulesHeader}>
                  <span>Course modules *</span>
                  <button type="button" onClick={addModule}>
                    + Add module
                  </button>
                </div>

                <div className={styles.modulesList}>
                  {modules.map((module, index) => (
                    <div key={module.id || index} className={styles.moduleRow}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <select
                          value={module.parentModuleId || ""}
                          onChange={(e) =>
                            handleModuleChange(index, "parentModuleId", e.target.value ? parseInt(e.target.value) : null)
                          }
                          style={{ marginBottom: '4px' }}
                        >
                          <option value="">Main Module</option>
                          {modules
                            .filter((m, i) => i !== index && !m.parentModuleId)
                            .map((parentModule) => (
                              <option key={parentModule.id} value={parentModule.id}>
                                ↳ {parentModule.title || `Module ${modules.indexOf(parentModule) + 1}`}
                              </option>
                            ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Module name"
                          value={module.title}
                          onChange={(e) =>
                            handleModuleChange(index, "title", e.target.value)
                          }
                          required
                        />
                      </div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Hours"
                        value={module.duration}
                        onChange={(e) =>
                          handleModuleChange(index, "duration", e.target.value)
                        }
                      />
                      {modules.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeModule(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{ color: "red", fontSize: "0.9rem" }}>
                    {error}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setError("");
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.primaryBtn}
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save course"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {showEdit && editingCourse && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Edit course</p>
                <h2>Update course details</h2>
              </div>
              <button
                className={styles.iconBtn}
                type="button"
                onClick={() => {
                  setShowEdit(false);
                  setEditingCourse(null);
                  setError("");
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className={styles.formGrid}>
                <label>
                  Course title *
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter course title"
                    required
                  />
                </label>
                <label>
                  Subject area
                  <input
                    type="text"
                    name="subjectArea"
                    value={formData.subjectArea}
                    onChange={handleInputChange}
                    placeholder="e.g., Web Development, Data Science"
                  />
                </label>
              </div>

              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the course"
                  rows="3"
                />
              </label>

              <label>
                Learning objectives
                <textarea
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  placeholder="What will you learn?"
                  rows="3"
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Difficulty *
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select difficulty</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
                <label>
                  Priority *
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>

              <div className={styles.formGrid}>
                <label>
                  Total hours *
                  <input
                    type="number"
                    name="totalEstimatedHours"
                    value={formData.totalEstimatedHours}
                    onChange={handleInputChange}
                    placeholder="120"
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
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <label>
                Course notes
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes, resources, or reminders"
                  rows="3"
                />
              </label>

              {/* External Links Section */}
              <div className={styles.section}>
                <div className={styles.modulesHeader}>
                  <span>External links</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExternalLinks((prev) => [
                        ...prev,
                        { platform: "", title: "", url: "" },
                      ])
                    }
                  >
                    + Add link
                  </button>
                </div>

                {externalLinks.map((link, index) => (
                  <div key={index} className={styles.moduleRow}>
                    <div className={styles.formGrid}>
                      <select
                        value={link.platform}
                        onChange={(e) => {
                          const newLinks = [...externalLinks];
                          newLinks[index].platform = e.target.value;
                          setExternalLinks(newLinks);
                        }}
                        placeholder="Platform"
                      >
                        <option value="">Select platform</option>
                        <option value="Udemy">Udemy</option>
                        <option value="Coursera">Coursera</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Website">Website</option>
                        <option value="GitHub">GitHub</option>
                        <option value="Documentation">Documentation</option>
                      </select>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => {
                          const newLinks = [...externalLinks];
                          newLinks[index].title = e.target.value;
                          setExternalLinks(newLinks);
                        }}
                        placeholder="Link title"
                      />
                    </div>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...externalLinks];
                        newLinks[index].url = e.target.value;
                        setExternalLinks(newLinks);
                      }}
                      placeholder="https://..."
                    />
                    {externalLinks.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() =>
                          setExternalLinks((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Course Modules Section */}
              <div className={styles.section}>
                <div className={styles.modulesHeader}>
                  <span>Course modules *</span>
                  <button type="button" onClick={addModule}>
                    + Add module
                  </button>
                </div>

                {modules.map((module, index) => (
                  <div key={module.id || index} className={styles.moduleRow}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select
                        value={module.parentModuleId || ""}
                        onChange={(e) => {
                          const newModules = [...modules];
                          newModules[index].parentModuleId = e.target.value ? parseInt(e.target.value) : null;
                          setModules(newModules);
                        }}
                        style={{ marginBottom: '4px' }}
                      >
                        <option value="">Main Module</option>
                        {modules
                          .filter((m, i) => i !== index && !m.parentModuleId)
                          .map((parentModule) => (
                            <option key={parentModule.id} value={parentModule.id}>
                              ↳ {parentModule.title || `Module ${modules.indexOf(parentModule) + 1}`}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => {
                          const newModules = [...modules];
                          newModules[index].title = e.target.value;
                          setModules(newModules);
                        }}
                        placeholder="Module title"
                        required
                      />
                    </div>
                    <input
                      type="number"
                      value={module.duration}
                      onChange={(e) => {
                        const newModules = [...modules];
                        newModules[index].duration = e.target.value;
                        setModules(newModules);
                      }}
                      placeholder="Hours"
                      min="0.5"
                      step="0.5"
                      required
                    />
                    {modules.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeModule(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>{error}</div>
              )}

              <div className={styles.formActions}>
                <button
                  className={styles.secondaryBtn}
                  type="button"
                  onClick={() => {
                    setShowEdit(false);
                    setEditingCourse(null);
                    setError("");
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Update course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function CourseCard({
  id,
  title,
  description,
  hoursRemaining,
  totalEstimatedHours,
  priority,
  difficulty,
  onDelete,
  onEdit,
}) {
  const navigate = useNavigate();
  const progress =
    totalEstimatedHours > 0
      ? ((totalEstimatedHours - hoursRemaining) / totalEstimatedHours) * 100
      : 0;

  const handlePlayClick = (e) => {
    e.stopPropagation();
    navigate(`/app/course/${id}`);
  };

  return (
    <article className={styles.courseCard}>
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardImage}>
          <div className={styles.imagePlaceholder}>
            <span className={styles.courseInitial}>{title.charAt(0).toUpperCase()}</span>
          </div>
          <button
            className={styles.playButton}
            onClick={handlePlayClick}
            title="Open Course"
          >
            <FaPlay />
          </button>
        </div>

        {/* Badges */}
        <div className={styles.cardBadges}>
          {priority && (
            <span className={`${styles.badge} ${styles[priority.toLowerCase()]}`}>
              {priority}
            </span>
          )}
          {difficulty && (
            <span className={`${styles.badge} ${styles[difficulty.toLowerCase()]}`}>
              {difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>

        <p className={styles.cardDescription}>
          {description || "No description"}
        </p>

        {/* Progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.progressText}>
            <span className={styles.progressPercent}>{Math.round(progress)}%</span>
            <span className={styles.hoursLeft}>{hoursRemaining}h left</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.cardActions}>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayClick(e);
            }}
          >
            <FaPlay /> Continue
          </button>
          <div className={styles.actionIcons}>
            <button
              className={styles.iconBtn}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              className={styles.iconBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default Course;
