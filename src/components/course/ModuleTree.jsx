import { useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaSave,
  FaTimes,
  FaStickyNote,
  FaPlus,
  FaFolder,
} from "react-icons/fa";
import styles from "./ModuleTree.module.css";

function ModuleTree({ modules, onUpdate, onToggleCompletion, onAdd }) {
  const [expanded, setExpanded] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [addTarget, setAddTarget] = useState();
  const [addValues, setAddValues] = useState({
    title: "",
    estimatedHours: "",
    description: "",
    notes: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const buildTree = (list) => {
    const map = new Map();
    const roots = [];

    list.forEach((m) => map.set(m.id, { ...m, children: [] }));

    list.forEach((m) => {
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
    setAddTarget(null);
    setError("");
    setEditValues({
      title: module.title,
      description: module.description || "",
      estimatedHours: module.estimatedHours ?? "",
      notes: module.notes || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setPending(true);
    setError("");
    try {
      await onUpdate(editing, {
        title: editValues.title,
        description: editValues.description,
        estimatedHours: editValues.estimatedHours
          ? parseInt(editValues.estimatedHours, 10)
          : 0,
        notes: editValues.notes,
      });
      setEditing(null);
      setEditValues({});
    } catch (err) {
      setError(err?.message || "Failed to update module");
    } finally {
      setPending(false);
    }
  };

  const startAdd = (parentId = null) => {
    setAddTarget(parentId ?? null);
    setEditing(null);
    setError("");
    setAddValues({ title: "", estimatedHours: "", description: "", notes: "" });
    if (parentId) {
      setExpanded((prev) => new Set(prev).add(parentId));
    }
  };

  const handleAdd = async () => {
    if (!addValues.title.trim()) {
      setError("Module title is required");
      return;
    }

    setPending(true);
    setError("");
    try {
      await onAdd({
        title: addValues.title.trim(),
        estimatedHours: addValues.estimatedHours
          ? parseInt(addValues.estimatedHours, 10)
          : 0,
        description: addValues.description?.trim() || "",
        notes: addValues.notes?.trim() || "",
        parentModuleId: addTarget,
      });
      setAddTarget(undefined);
      setAddValues({
        title: "",
        estimatedHours: "",
        description: "",
        notes: "",
      });
    } catch (err) {
      setError(err?.message || "Failed to add module");
    } finally {
      setPending(false);
    }
  };

  const renderAddForm = (parentId) => (
    <div className={styles.addCard}>
      <div className={styles.addHeader}>
        <FaFolder />
        <span>{parentId ? "Add submodule" : "Add module"}</span>
      </div>
      <div className={styles.addGrid}>
        <input
          value={addValues.title}
          onChange={(e) =>
            setAddValues({ ...addValues, title: e.target.value })
          }
          placeholder="Module title"
          autoFocus
        />
        <input
          type="number"
          value={addValues.estimatedHours}
          onChange={(e) =>
            setAddValues({ ...addValues, estimatedHours: e.target.value })
          }
          placeholder="Hours"
          min="0"
          step="0.5"
        />
      </div>
      <textarea
        value={addValues.description}
        onChange={(e) =>
          setAddValues({ ...addValues, description: e.target.value })
        }
        placeholder="Description (optional)"
        rows={2}
      />
      <textarea
        value={addValues.notes}
        onChange={(e) => setAddValues({ ...addValues, notes: e.target.value })}
        placeholder="Notes (optional)"
        rows={2}
      />
      <div className={styles.actions}>
        <button type="button" onClick={handleAdd} disabled={pending}>
          <FaSave /> {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAddTarget(undefined);
            setError("");
          }}
        >
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );

  const renderModule = (module, depth = 0) => {
    const hasChildren = module.children?.length > 0;
    const isExpanded = expanded.has(module.id);
    const isEditing = editing === module.id;
    const isCompleted = module.isCompleted;
    const hours = module.estimatedHours ?? 0;

    return (
      <div
        key={module.id}
        className={`${styles.module} ${isCompleted ? styles.completed : ""}`}
      >
        <div
          className={styles.header}
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          <div className={styles.controls}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(module.id)}
                className={styles.expandBtn}
                aria-label={isExpanded ? "Collapse" : "Expand"}
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
              <div className={styles.editGrid}>
                <input
                  value={editValues.title}
                  onChange={(e) =>
                    setEditValues({ ...editValues, title: e.target.value })
                  }
                  placeholder="Module title"
                  autoFocus
                />
                <input
                  type="number"
                  value={editValues.estimatedHours}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      estimatedHours: e.target.value,
                    })
                  }
                  placeholder="Hours"
                  min="0"
                  step="0.5"
                />
              </div>
              <textarea
                value={editValues.description}
                onChange={(e) =>
                  setEditValues({ ...editValues, description: e.target.value })
                }
                placeholder="Description"
                rows={2}
              />
              <textarea
                value={editValues.notes}
                onChange={(e) =>
                  setEditValues({ ...editValues, notes: e.target.value })
                }
                placeholder="Notes"
                rows={2}
              />
              <div className={styles.actions}>
                <button type="button" onClick={handleSave} disabled={pending}>
                  <FaSave /> {pending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setEditing(null)}>
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.titleRow}>
                <div className={styles.titleGroup}>
                  <span className={styles.bullet} />
                  <span
                    className={`${styles.title} ${
                      isCompleted ? styles.strikethrough : ""
                    }`}
                  >
                    {module.title}
                  </span>
                </div>
                <div className={styles.badges}>
                  <span className={styles.hours}>{hours}h</span>
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
              <div className={styles.rowActions}>
                <button
                  onClick={() => handleEdit(module)}
                  className={styles.inlineBtn}
                  aria-label="Edit module"
                  title="Edit module"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => startAdd(module.id)}
                  className={styles.inlineBtn}
                  aria-label="Add submodule"
                  title="Add submodule"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          )}
        </div>

        {addTarget === module.id && (
          <div className={styles.children}>{renderAddForm(module.id)}</div>
        )}

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
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <FaFolder />
          <span>Module hierarchy</span>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => startAdd(null)}
        >
          <FaPlus /> Add module
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {addTarget === null && renderAddForm(null)}

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
