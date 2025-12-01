import styles from "./Course.module.css";
import { FaFilter, FaSearch } from "react-icons/fa";
import { useMemo, useState } from "react";
import { IoIosAdd } from "react-icons/io";

const filterGroups = {
  priority: ["Low", "Medium", "High"],
  difficulty: ["Beginner", "Intermediate", "Advanced"],
  duration: ["< 1 hour", "1-3 hours", "> 3 hours"],
};

const catalog = [
  {
    title: "React Basics",
    description: "Learn the fundamentals of modern React.",
    hoursRemaining: 12,
    imageSrc: "/src/assets/default-course.png",
    priority: "Medium",
    difficulty: "Beginner",
    duration: "1-3 hours",
  },
  {
    title: "Advanced JavaScript",
    description: "Deep dive into closures, scopes, and patterns.",
    hoursRemaining: 8,
    imageSrc: "/src/assets/default-course.png",
    priority: "High",
    difficulty: "Advanced",
    duration: "> 3 hours",
  },
  {
    title: "Web Development",
    description: "Full-stack web development toolkit.",
    hoursRemaining: 15,
    imageSrc: "/src/assets/default-course.png",
    priority: "Medium",
    difficulty: "Intermediate",
    duration: "> 3 hours",
  },
  {
    title: "Design Systems",
    description: "Crafting consistent UI experiences.",
    hoursRemaining: 6,
    imageSrc: "/src/assets/default-course.png",
    priority: "Low",
    difficulty: "Beginner",
    duration: "< 1 hour",
  },
];

const quickStats = [
  { label: "Active courses", value: "04" },
  { label: "Weekly focus", value: "12 hrs" },
  { label: "Next milestone", value: "UI Systems · Thu" },
];

const aiPlan = {
  summary:
    "You have 3 deep-work blocks this week. AI suggests pairing React Basics with Advanced JS for better retention.",
  focusToday: ["React Basics – Components", "JavaScript – Async Exercises"],
  backlog: ["Machine Learning intro outline", "DBMS schema revision"],
};

function Course() {
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    priority: [],
    difficulty: [],
    duration: [],
  });
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState("manual");
  const [modules, setModules] = useState([{ title: "", duration: "" }]);
  const [aiPrompt, setAiPrompt] = useState(
    "Build a 3 week plan for Machine Learning foundations."
  );

  const filteredCourses = useMemo(() => {
    return catalog.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase());

      const matchesFilters = Object.entries(selectedFilters).every(
        ([group, values]) =>
          values.length === 0 || values.includes(course[group])
      );

      return matchesSearch && matchesFilters;
    });
  }, [search, selectedFilters]);

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

  const resetFilters = () =>
    setSelectedFilters({ priority: [], difficulty: [], duration: [] });

  const handleModuleChange = (index, field, value) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === index ? { ...module, [field]: value } : module
      )
    );
  };

  const addModule = () =>
    setModules((prev) => [...prev, { title: "", duration: "" }]);

  const removeModule = (index) =>
    setModules((prev) => prev.filter((_, i) => i !== index));

  const handleManualSubmit = (e) => {
    e.preventDefault();
    alert("Course saved with modules (mock).");
    setShowCreate(false);
    setModules([{ title: "", duration: "" }]);
  };

  const handleAiGenerate = (e) => {
    e.preventDefault();
    alert("AI generation requested with prompt:\n" + aiPrompt);
    setShowCreate(false);
  };

  return (
    <section className={styles.page}>
      <header className={styles.pageHero}>
        <div>
          <p className={styles.kicker}>AI planner</p>
          <h1>Course workspace</h1>
          <p className={styles.subtle}>
            Curate modules, track effort, and let AI balance your study load.
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

      <div className={styles.statsRow}>
        {quickStats.map((item) => (
          <div key={item.label} className={styles.statCard}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search or jump to a module"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className={styles.resultSummary}>
          {filteredCourses.length} course
          {filteredCourses.length === 1 ? "" : "s"} in focus
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
          <div className={styles.aiSummary}>
            <div>
              <p className={styles.kicker}>AI summary</p>
              <p>{aiPlan.summary}</p>
            </div>
            <div className={styles.focusLists}>
              <div>
                <h4>Today</h4>
                <ul>
                  {aiPlan.focusToday.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Backlog nudges</h4>
                <ul>
                  {aiPlan.backlog.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.courseGrid}>
            {filteredCourses.length === 0 && (
              <div className={styles.emptyState}>
                <p>No courses match your filters.</p>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            )}

            {filteredCourses.map((course) => (
              <CourseCard key={course.title} {...course} />
            ))}
          </div>
        </div>

        <aside className={styles.aiPanel}>
          <div className={styles.panelSection}>
            <h3>Quick plan</h3>
            <p>
              Plug availability and let the planner auto-build a balanced study
              queue with suggested durations.
            </p>
            <button className={styles.primaryBtn} type="button">
              Generate schedule
            </button>
          </div>

          <div className={styles.panelSection}>
            <h3>Import syllabus</h3>
            <p>
              Drop a link or markdown outline and AI will split it into
              sessions.
            </p>
            <button className={styles.secondaryBtn} type="button">
              Paste outline
            </button>
          </div>
        </aside>
      </div>

      {showCreate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Create course</p>
                <h2>Kick off a new track</h2>
              </div>
              <button
                className={styles.iconBtn}
                type="button"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalTabs}>
              {["manual", "ai"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.tab} ${
                    createMode === mode ? styles.tabActive : ""
                  }`}
                  onClick={() => setCreateMode(mode)}
                >
                  {mode === "manual" ? "Build manually" : "Ask AI"}
                </button>
              ))}
            </div>

            {createMode === "manual" ? (
              <form className={styles.modalForm} onSubmit={handleManualSubmit}>
                <div className={styles.formGrid}>
                  <label>
                    Course title *
                    <input
                      type="text"
                      placeholder="e.g. Machine Learning Foundations"
                      required
                    />
                  </label>
                  <label>
                    Subject area
                    <select>
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
                  Learning objectives
                  <textarea
                    placeholder="What will you achieve? e.g. Build ML models, understand algorithms, deploy applications"
                    rows={2}
                  />
                </label>

                <div className={styles.formGrid}>
                  <label>
                    Difficulty level
                    <select>
                      <option value="">Select difficulty</option>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </label>
                  <label>
                    Priority
                    <select>
                      <option value="">Select priority</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <label>
                    Total estimated hours
                    <input type="number" min="1" placeholder="24" />
                  </label>
                  <label>
                    Target completion
                    <input type="date" />
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
                    <div key={index} className={styles.moduleRow}>
                      <input
                        type="text"
                        placeholder="Module name"
                        value={module.title}
                        onChange={(e) =>
                          handleModuleChange(index, "title", e.target.value)
                        }
                        required
                      />
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

                <div className={styles.formActions}>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>
                  <button className={styles.primaryBtn} type="submit">
                    Save course
                  </button>
                </div>
              </form>
            ) : (
              <form className={styles.modalForm} onSubmit={handleAiGenerate}>
                <p className={styles.subtle}>
                  Describe the skills, timeframe, or existing syllabus you want
                  AI to shape into modules.
                </p>
                <textarea
                  rows={6}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <div className={styles.formActions}>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>
                  <button className={styles.primaryBtn} type="submit">
                    Generate with AI
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CourseCard({
  title,
  description,
  hoursRemaining,
  imageSrc,
  priority,
  difficulty,
}) {
  return (
    <article className={styles.courseCard}>
      <img src={imageSrc} alt="" />
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span>{priority}</span>
          <span>{difficulty}</span>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        <span className={styles.hours}>{hoursRemaining} hrs remaining</span>
      </div>
    </article>
  );
}

export default Course;
