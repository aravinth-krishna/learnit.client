import styles from "./ModuleForm.module.css";

function ModuleForm({ modules, setModules }) {
  const getDepthLabel = (module) => {
    let depth = 0;
    let current = module;
    const visited = new Set();

    while (current?.parentModuleId) {
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

  const handleModuleChange = (index, field, value) => {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
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

  const removeModule = (index) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span>Course modules *</span>
        <button type="button" onClick={addModule} className={styles.addBtn}>
          + Add module
        </button>
      </div>

      <div className={styles.list}>
        {modules.map((module, index) => (
          <div key={module.id || index} className={styles.card}>
            <label className={styles.fieldLabel}>
              Title
              <input
                type="text"
                placeholder="Module title"
                value={module.title}
                onChange={(e) =>
                  handleModuleChange(index, "title", e.target.value)
                }
                required
              />
            </label>

            <div className={styles.inlineFields}>
              <label className={styles.fieldLabel}>
                Hours
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
              </label>

              <label className={styles.fieldLabel}>
                Parent
                <select
                  value={module.parentModuleId || ""}
                  onChange={(e) =>
                    handleModuleChange(
                      index,
                      "parentModuleId",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Top level</option>
                  {modules
                    .filter((m, i) => i !== index)
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {getDepthLabel(parent)}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className={styles.actionsRow}>
              <span className={styles.hint}>
                Tip: Use Add child to nest quickly.
              </span>
              <div className={styles.actionsRight}>
                <button
                  type="button"
                  className={styles.textBtn}
                  onClick={() => addChild(index, module.id)}
                >
                  + Add child
                </button>
                {modules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModule(index)}
                    className={styles.textBtnDanger}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModuleForm;
