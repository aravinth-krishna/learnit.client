import styles from "./ModuleForm.module.css";

function ModuleForm({ modules, setModules }) {
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
          <div key={module.id || index} className={styles.row}>
            <div className={styles.inputs}>
              <select
                value={module.parentModuleId || ""}
                onChange={(e) =>
                  handleModuleChange(
                    index,
                    "parentModuleId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              >
                <option value="">Main Module</option>
                {modules
                  .filter((m, i) => i !== index && !m.parentModuleId)
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      ↳{" "}
                      {parent.title || `Module ${modules.indexOf(parent) + 1}`}
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
              placeholder="Hours"
              value={module.duration}
              onChange={(e) =>
                handleModuleChange(index, "duration", e.target.value)
              }
              min="0.5"
              step="0.5"
              required
            />
            {modules.length > 1 && (
              <button
                type="button"
                onClick={() => removeModule(index)}
                className={styles.removeBtn}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModuleForm;
