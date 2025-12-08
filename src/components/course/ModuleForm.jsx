import Button from "../ui/Button";
import Card from "../ui/Card";
import Field from "../ui/Field";
import styles from "./ModuleForm.module.css";

function ModuleForm({ modules, setModules }) {
  const updateRoot = (id, field, value) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const updateSub = (rootId, subId, field, value) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === rootId
          ? {
              ...m,
              subModules: m.subModules.map((s) =>
                s.id === subId ? { ...s, [field]: value } : s
              ),
            }
          : m
      )
    );
  };

  const addRoot = () => {
    setModules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "", duration: "", subModules: [] },
    ]);
  };

  const addSub = (rootId) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === rootId
          ? {
              ...m,
              subModules: [
                ...m.subModules,
                { id: crypto.randomUUID(), title: "", duration: "" },
              ],
            }
          : m
      )
    );
  };

  const removeRoot = (rootId) => {
    setModules((prev) => prev.filter((m) => m.id !== rootId));
  };

  const removeSub = (rootId, subId) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === rootId
          ? { ...m, subModules: m.subModules.filter((s) => s.id !== subId) }
          : m
      )
    );
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span>Course modules *</span>
        <Button type="button" variant="primary" onClick={addRoot}>
          + Add module
        </Button>
      </div>

      <div className={styles.list}>
        {modules.map((module) => (
          <Card key={module.id} className={styles.card}>
            <Field label="Module title">
              <input
                type="text"
                value={module.title}
                onChange={(e) => updateRoot(module.id, "title", e.target.value)}
                placeholder="Module title"
                required
              />
            </Field>

            <div className={styles.inlineFieldsSingleLine}>
              <Field label="Hours (whole)">
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={module.duration}
                  onChange={(e) =>
                    updateRoot(module.id, "duration", e.target.value)
                  }
                  min="0"
                  step="1"
                  required
                />
              </Field>
            </div>

            <div className={styles.subHeaderRow}>
              <span>Sub-modules (one level)</span>
              <Button
                type="button"
                variant="text"
                onClick={() => addSub(module.id)}
              >
                + Add sub-module
              </Button>
            </div>

            {(module.subModules || []).length === 0 && (
              <p className={styles.muted}>No sub-modules yet.</p>
            )}

            {(module.subModules || []).map((sub) => (
              <div key={sub.id} className={styles.subCard}>
                <Field label="Title">
                  <input
                    type="text"
                    value={sub.title}
                    onChange={(e) =>
                      updateSub(module.id, sub.id, "title", e.target.value)
                    }
                    placeholder="Sub-module title"
                    required
                  />
                </Field>
                <Field label="Hours (whole)">
                  <input
                    type="number"
                    value={sub.duration}
                    onChange={(e) =>
                      updateSub(module.id, sub.id, "duration", e.target.value)
                    }
                    placeholder="e.g. 1"
                    min="0"
                    step="1"
                    required
                  />
                </Field>
                <div className={styles.actionsRow}>
                  <Button
                    type="button"
                    variant="text"
                    className={styles.dangerText}
                    onClick={() => removeSub(module.id, sub.id)}
                  >
                    Remove sub-module
                  </Button>
                </div>
              </div>
            ))}

            <div className={styles.actionsRow}>
              {modules.length > 1 && (
                <Button
                  type="button"
                  variant="text"
                  className={styles.dangerText}
                  onClick={() => removeRoot(module.id)}
                >
                  Remove module
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ModuleForm;
