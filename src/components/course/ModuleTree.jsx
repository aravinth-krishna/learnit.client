import { useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSave, FaStickyNote, FaTimes } from "react-icons/fa";
import styles from "./ModuleTree.module.css";

const emptyModule = {
  title: "",
  estimatedHours: "",
  description: "",
  notes: "",
};

function ModuleTree({ modules = [], onUpdate, onToggleCompletion, onAdd }) {
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(emptyModule);
  const [addTarget, setAddTarget] = useState(undefined);
  const [addValues, setAddValues] = useState(emptyModule);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const sortByOrder = (list) =>
    [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const roots = useMemo(
    () => sortByOrder(modules.filter((m) => !m.parentModuleId)),
    [modules]
  );

  const childrenMap = useMemo(() => {
    const grouped = modules
      .filter((m) => m.parentModuleId)
      .reduce((acc, m) => {
        acc[m.parentModuleId] = acc[m.parentModuleId] || [];
        acc[m.parentModuleId].push(m);
        return acc;
      }, {});

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortByOrder(grouped[key]);
    });

    return grouped;
  }, [modules]);

  const startAdd = (parentId = null) => {
    setAddTarget(parentId);
    setError("");
    setEditingId(null);
    setAddValues(emptyModule);
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
        parentModuleId: addTarget ?? null,
      });
      setAddTarget(undefined);
      setAddValues(emptyModule);
    } catch (err) {
      setError(err?.message || "Failed to add module");
    } finally {
      setPending(false);
    }
  };

  const startEdit = (module) => {
    setEditingId(module.id);
    setAddTarget(undefined);
    setError("");
    setFormValues({
      title: module.title,
      estimatedHours: module.estimatedHours ?? "",
      description: module.description || "",
      notes: module.notes || "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setPending(true);
    setError("");
    try {
      await onUpdate(editingId, {
        title: formValues.title,
        description: formValues.description,
        estimatedHours: formValues.estimatedHours
          ? parseInt(formValues.estimatedHours, 10)
          : 0,
        notes: formValues.notes,
      });
      setEditingId(null);
      setFormValues(emptyModule);
    } catch (err) {
      setError(err?.message || "Failed to update module");
    } finally {
      setPending(false);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormValues(emptyModule);
  };

  const cancelAdd = () => {
    setAddTarget(undefined);
    setAddValues(emptyModule);
    setError("");
  };

  const renderAddCard = (parentId) => (
    <div className={styles.addCard}>
      <div className={styles.addHeader}>
        <span>{parentId ? "Add sub-module" : "Add module"}</span>
        <span className={styles.addHint}>
          {parentId ? "One level deep" : "Top level"}
        </span>
      </div>
      <div className={styles.rowInputs}>
        <input
          value={addValues.title}
          onChange={(e) =>
            setAddValues({ ...addValues, title: e.target.value })
          }
          placeholder="Title"
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
        <button type="button" onClick={cancelAdd}>
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );

  const renderDisplayRow = (module, isChild = false) => (
    <div className={`${styles.displayRow} ${isChild ? styles.childRow : ""}`}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={!!module.isCompleted}
          onChange={() => onToggleCompletion(module.id)}
        />
        <span className={styles.title}>{module.title}</span>
      </label>
      <div className={styles.meta}>
        <span className={styles.badge}>{module.estimatedHours ?? 0}h</span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => startEdit(module)}
          aria-label="Edit module"
        >
          <FaEdit />
        </button>
        {!isChild && (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => startAdd(module.id)}
            aria-label="Add sub-module"
          >
            <FaPlus />
          </button>
        )}
      </div>
      {(module.description || module.notes) && (
        <div className={styles.details}>
          {module.description && <p>{module.description}</p>}
          {module.notes && (
            <span className={styles.note}>
              <FaStickyNote /> {module.notes}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderEditRow = (isChild = false) => (
    <div className={`${styles.editCard} ${isChild ? styles.childRow : ""}`}>
      <div className={styles.rowInputs}>
        <input
          value={formValues.title}
          onChange={(e) =>
            setFormValues({ ...formValues, title: e.target.value })
          }
          placeholder="Title"
          autoFocus
        />
        <input
          type="number"
          value={formValues.estimatedHours}
          onChange={(e) =>
            setFormValues({ ...formValues, estimatedHours: e.target.value })
          }
          placeholder="Hours"
          min="0"
          step="0.5"
        />
      </div>
      <textarea
        value={formValues.description}
        onChange={(e) =>
          setFormValues({ ...formValues, description: e.target.value })
        }
        placeholder="Description"
        rows={2}
      />
      <textarea
        value={formValues.notes}
        onChange={(e) =>
          setFormValues({ ...formValues, notes: e.target.value })
        }
        placeholder="Notes"
        rows={2}
      />
      <div className={styles.actions}>
        <button type="button" onClick={handleSave} disabled={pending}>
          <FaSave /> {pending ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={cancelEditing}>
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );

  const renderRoot = (root) => {
    const children = childrenMap[root.id] || [];
    const isEditing = editingId === root.id;

    return (
      <div key={root.id} className={styles.moduleCard}>
        {isEditing ? renderEditRow(false) : renderDisplayRow(root, false)}

        {addTarget === root.id && renderAddCard(root.id)}

        <div className={styles.subList}>
          <div className={styles.subHeader}>Sub-modules</div>
          {children.length === 0 && (
            <div className={styles.subEmpty}>None yet</div>
          )}
          {children.map((child) => (
            <div key={child.id} className={styles.subItem}>
              {editingId === child.id
                ? renderEditRow(true)
                : renderDisplayRow(child, true)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Modules</p>
          <p className={styles.subtitle}>
            Root modules with a single sub-module level.
          </p>
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

      {addTarget === null && renderAddCard(null)}

      {roots.length === 0 ? (
        <div className={styles.empty}>No modules yet.</div>
      ) : (
        <div className={styles.list}>
          {roots.map((root) => renderRoot(root))}
        </div>
      )}
    </div>
  );
}

export default ModuleTree;
