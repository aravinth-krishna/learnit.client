import { useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaSave,
  FaTimes,
  FaStickyNote,
} from "react-icons/fa";
import styles from "./ModuleTree.module.css";

function ModuleTree({ modules, onUpdate, onToggleCompletion }) {
  const [expanded, setExpanded] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});

  const buildTree = (modules) => {
    const map = new Map();
    const roots = [];

    modules.forEach((m) => map.set(m.id, { ...m, children: [] }));

    modules.forEach((m) => {
      const node = map.get(m.id);
      if (m.parentModuleId && map.has(m.parentModuleId)) {
        map.get(m.parentModuleId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sort = (arr) => {
      arr.sort((a, b) => (a.order || 0) - (b.order || 0));
      arr.forEach((m) => m.children.length && sort(m.children));
    };

    sort(roots);
    return roots;
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEdit = (module) => {
    setEditing(module.id);
    setEditValues({
      title: module.title,
      description: module.description || "",
    });
  };

  const handleSave = () => {
    onUpdate(editing, editValues);
    setEditing(null);
    setEditValues({});
  };

  const renderModule = (module, depth = 0) => {
    const hasChildren = module.children?.length > 0;
    const isExpanded = expanded.has(module.id);
    const isEditing = editing === module.id;
    const isCompleted = module.isCompleted;

    return (
      <div
        key={module.id}
        className={`${styles.module} ${isCompleted ? styles.completed : ""}`}
      >
        <div
          className={styles.header}
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          <div className={styles.controls}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(module.id)}
                className={styles.expandBtn}
              >
                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </button>
            ) : (
              <span className={styles.spacer} />
            )}

            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => onToggleCompletion(module.id)}
              className={styles.checkbox}
            />
          </div>

          {isEditing ? (
            <div className={styles.editForm}>
              <input
                value={editValues.title}
                onChange={(e) =>
                  setEditValues({ ...editValues, title: e.target.value })
                }
                placeholder="Module title"
                autoFocus
              />
              <textarea
                value={editValues.description}
                onChange={(e) =>
                  setEditValues({ ...editValues, description: e.target.value })
                }
                placeholder="Description"
                rows={2}
              />
              <div className={styles.actions}>
                <button onClick={handleSave}>
                  <FaSave />
                </button>
                <button onClick={() => setEditing(null)}>
                  <FaTimes />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.titleRow}>
                <span
                  className={`${styles.title} ${
                    isCompleted ? styles.strikethrough : ""
                  }`}
                >
                  {module.title}
                </span>
                <div className={styles.badges}>
                  <span className={styles.hours}>{module.estimatedHours}h</span>
                  {isCompleted && <span className={styles.done}>✓</span>}
                </div>
              </div>
              {module.description && (
                <p className={styles.desc}>{module.description}</p>
              )}
              {module.notes && (
                <div className={styles.notes}>
                  <FaStickyNote /> {module.notes}
                </div>
              )}
            </div>
          )}

          {!isEditing && (
            <button
              onClick={() => handleEdit(module)}
              className={styles.editBtn}
            >
              <FaEdit />
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className={styles.children}>
            {module.children.map((child) => renderModule(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(modules);

  return (
    <div className={styles.tree}>
      {tree.length === 0 ? (
        <div className={styles.empty}>
          <span>📚</span>
          <p>No modules yet</p>
        </div>
      ) : (
        tree.map((m) => renderModule(m))
      )}
    </div>
  );
}

export default ModuleTree;
