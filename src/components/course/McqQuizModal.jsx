import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import ui from "../ui/ui.module.css";
import styles from "./McqQuizModal.module.css";
import { aiApi } from "../../services";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function McqQuizModal({
  courseTitle = "",
  moduleTitle,
  questionCount = 5,
  durationSeconds = 60,
  busy = false,
  onClose,
  onMarkComplete,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passed, setPassed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  const normalizedCount = clamp(Number(questionCount) || 5, 3, 8);
  const normalizedDuration = clamp(Number(durationSeconds) || 60, 30, 300);

  useEffect(() => {
    let cancelled = false;

    const fetchQuiz = async () => {
      setLoading(true);
      setError("");
      setQuiz(null);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      setPassed(false);

      try {
        const res = await aiApi.moduleQuiz({
          courseTitle: courseTitle || "",
          moduleTitle,
          questionCount: normalizedCount,
          durationSeconds: normalizedDuration,
        });

        const data = res?.data ?? res;
        if (cancelled) return;

        setQuiz(data);
        setTimeLeft(
          clamp(Number(data?.durationSeconds) || normalizedDuration, 30, 300)
        );
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Failed to generate quiz");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuiz();

    return () => {
      cancelled = true;
    };
  }, [courseTitle, moduleTitle, normalizedCount, normalizedDuration]);

  const questions = useMemo(() => {
    if (!quiz?.questions || !Array.isArray(quiz.questions)) return [];
    return quiz.questions;
  }, [quiz]);

  const passingScore = useMemo(() => {
    const raw = Number(quiz?.passingScore);
    if (Number.isFinite(raw) && raw > 0 && raw <= 100) return raw;
    return 60;
  }, [quiz]);

  const expired = timeLeft <= 0;

  useEffect(() => {
    if (loading || !questions.length || submitted) return;
    if (expired) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading, questions.length, submitted, expired]);

  const allAnswered = useMemo(() => {
    if (!questions.length) return false;
    return questions.every((_, idx) => answers[idx] !== undefined);
  }, [questions, answers]);

  const onPick = (qIndex, optionIndex) => {
    if (submitted || expired) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!questions.length || !allAnswered || expired) return;

    const correct = questions.reduce((acc, q, idx) => {
      const picked = answers[idx];
      const correctIndex = Number(q?.correctIndex);
      return acc + (picked === correctIndex ? 1 : 0);
    }, 0);

    const pct = Math.round((correct * 100) / questions.length);
    setScore(pct);
    setSubmitted(true);
    setPassed(pct >= passingScore);
  };

  const actions = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={busy}>
        Close
      </Button>
      {!submitted ? (
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={busy || loading || !allAnswered || expired}
        >
          Submit
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={onMarkComplete}
          disabled={busy || !passed}
        >
          Mark complete
        </Button>
      )}
    </>
  );

  return (
    <Modal
      kicker="Quick check"
      title={`Quiz: ${moduleTitle}`}
      onClose={onClose}
      actions={actions}
      className={styles.panel}
    >
      <div className={styles.metaRow}>
        <span className={styles.pill}>
          Time left: {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </span>
        <span className={styles.pill}>Pass: {passingScore}%</span>
      </div>

      {loading && <div className={styles.muted}>Generating questions…</div>}
      {!loading && error && <div className={ui.errorBanner}>{error}</div>}

      {!loading && !error && expired && !submitted && (
        <div className={ui.errorBanner}>Time's up. Try again.</div>
      )}

      {!loading && !error && submitted && (
        <div className={passed ? styles.successBanner : ui.errorBanner}>
          Score: {score}% {passed ? "— Passed" : "— Not passed"}
        </div>
      )}

      {!loading && !error && questions.length > 0 && (
        <ol className={styles.list}>
          {questions.map((q, qIndex) => (
            <li key={`q-${qIndex}`} className={styles.questionCard}>
              <p className={styles.questionText}>{q?.question}</p>
              <div className={styles.options}>
                {(q?.options || []).map((opt, oIndex) => {
                  const checked = answers[qIndex] === oIndex;
                  const disabled = submitted || expired;
                  return (
                    <label
                      key={`q-${qIndex}-o-${oIndex}`}
                      className={styles.optionRow}
                    >
                      <input
                        type="radio"
                        name={`q-${qIndex}`}
                        checked={checked}
                        onChange={() => onPick(qIndex, oIndex)}
                        disabled={disabled}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}

      {!loading && !error && submitted && !passed && (
        <p className={styles.muted}>
          Close this quiz and click the module again to retry.
        </p>
      )}
    </Modal>
  );
}

export default McqQuizModal;
