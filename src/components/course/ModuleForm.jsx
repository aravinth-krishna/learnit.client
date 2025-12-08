import clsx from "clsx";
import { useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Field from "../ui/Field";
import styles from "./ModuleForm.module.css";

function ModuleForm({ modules, setModules }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const getDepthLabel = (module) => {
    let depth = 0;
    let current = module;
    const visited = new Set();

    while (current && current.parentModuleId) {
      if (visited.has(current.parentModuleId)) break;
      visited.add(current.parentModuleId);
      depth += 1;
      current = modules.find((m) => m.id === current.parentModuleId);
    }

    const prefix = depth > 0 ? "↳ ".repeat(depth) : "";
    return `${prefix}${
      module.title || `Module ${modules.indexOf(module) + 1}`
    }`;
  };

  const isDescendant = (maybeChildId, ancestorId, list) => {
    let current = list.find((m) => m.id === maybeChildId);
    const visited = new Set();

    while (current && current.parentModuleId) {
      if (visited.has(current.parentModuleId)) break;
      if (current.parentModuleId === ancestorId) return true;
      visited.add(current.parentModuleId);
      current = list.find((m) => m.id === current.parentModuleId);
    }

    return false;
  };

  const handleModuleChange = (index, field, value) => {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleParentChange = (index, nextParentId) => {
    setModules((prev) => {
      const target = prev[index];
      if (!target) return prev;

      const isInvalid =
        nextParentId &&
        (nextParentId === target.id ||
          isDescendant(nextParentId, target.id, prev));

      if (isInvalid) return prev;

      return prev.map((m, i) =>
        i === index ? { ...m, parentModuleId: nextParentId } : m
      );
    });
  };

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        title: "",
        duration: "",
        parentModuleId: null,
      },
    ]);
  };

  const addChild = (index, parentId) => {
    const newModule = {
      id: Date.now() + Math.random(),
      title: "",
      duration: "",
      parentModuleId: parentId,
    };

    setModules((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newModule);
      return next;
    });
  };

  const removeModule = (moduleId) => {
    setModules((prev) => {
      const idsToRemove = new Set([moduleId]);

      const collectDescendants = (parentId) => {
        prev.forEach((m) => {
          if (m.parentModuleId === parentId) {
            idsToRemove.add(m.id);
            collectDescendants(m.id);
          }
        });
      };

      collectDescendants(moduleId);
      return prev.filter((m) => !idsToRemove.has(m.id));
    });
  };

  const handleDragStart = (event, moduleId) => {
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(moduleId);
  };

  const handleDrop = (targetIndex) => {
    setModules((prev) => {
      if (!draggingId) return prev;

      const sourceIndex = prev.findIndex((m) => m.id === draggingId);
      if (sourceIndex === -1) return prev;

      const insertIndex =
        sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      if (insertIndex === sourceIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(insertIndex, 0, moved);
      return next;
    });

    setDragOverId(null);
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDraggingId(null);
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span>Course modules *</span>
        <Button type="button" variant="primary" onClick={addModule}>
          + Add module
        </Button>
      </div>

      <div className={styles.list}>
        {modules.map((module, index) => (
          <Card
            key={module.id || index}
            className={clsx(styles.card, {
              [styles.dropTarget]: dragOverId === module.id,
            })}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverId(module.id);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOverId(module.id);
            }}
            onDragLeave={() => {
              if (dragOverId === module.id) setDragOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
          >
            <div className={styles.dragRow}>
              <div
                className={styles.dragHandle}
                draggable
                onDragStart={(e) => handleDragStart(e, module.id)}
                onDragEnd={handleDragEnd}
                aria-label="Drag to reorder"
              >
                ≡
              </div>

              <Field label="Title" className={styles.fieldLabel}>
                <input
                  type="text"
                  placeholder="Module title"
                  value={module.title}
                  onChange={(e) =>
                    handleModuleChange(index, "title", e.target.value)
                  }
                  required
                />
              </Field>
            </div>

            <div className={styles.inlineFieldsSingleLine}>
              <Field label="Hours" className={styles.fieldLabel}>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={module.duration}
                  onChange={(e) =>
                    handleModuleChange(index, "duration", e.target.value)
                  }
                  min="0.5"
                  step="0.5"
                  required
                />
              </Field>

              <Field label="Parent" className={styles.fieldLabel}>
                <select
                  value={module.parentModuleId || ""}
                  onChange={(e) =>
                    handleParentChange(
                      index,
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Top level</option>
                  {modules
                    .filter((m) => m.id !== module.id)
                    .map((parent) => (
                      <option
                        key={parent.id}
                        value={parent.id}
                        disabled={isDescendant(parent.id, module.id, modules)}
                      >
                        {getDepthLabel(parent)}
                      </option>
                    ))}
                </select>
              </Field>
            </div>

            <div className={styles.actionsRow}>
              <span className={styles.hint}>
                Tip: Drag rows to reorder or use Add child to nest quickly.
              </span>
              <div className={styles.actionsRight}>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => addChild(index, module.id)}
                >
                  + Add child
                </Button>
                {modules.length > 1 && (
                  <Button
                    type="button"
                    variant="text"
                    className={styles.dangerText}
                    onClick={() => removeModule(module.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ModuleForm;
