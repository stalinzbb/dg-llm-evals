import { useState } from "react";

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return `$${value.toFixed(6)}`;
}

export default function ResultCard({ result, onSaveRating }) {
  const [view, setView] = useState("cause");
  const [rating, setRating] = useState({
    clarity: 3,
    specificity: 3,
    fundraiserRelevance: 3,
    emotionalResonance: 3,
    brandSafety: 3,
    overall: 3,
    winner: false,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveRating({
        variantResultId: result.id,
        runId: result.runId,
        rubric: {
          clarity: Number(rating.clarity),
          specificity: Number(rating.specificity),
          fundraiserRelevance: Number(rating.fundraiserRelevance),
          emotionalResonance: Number(rating.emotionalResonance),
          brandSafety: Number(rating.brandSafety),
          overall: Number(rating.overall),
        },
        notes: rating.notes,
        winner: rating.winner,
      });
      setRating((current) => ({ ...current, notes: "" }));
    } finally {
      setSaving(false);
    }
  }

  const message = view === "cause" ? result.causeStatement : result.fullMessage;
  const characterCount =
    view === "cause"
      ? result.metrics?.causeOnlyCharacters || 0
      : result.metrics?.fullMessageCharacters || 0;

  return (
    <article className="result-card">
      <div className="result-meta-row">
        <div>
          <div className="result-title">{result.variantLabel}</div>
          <div className="field-help">
            {result.model} · {result.promptTemplateName || "Current draft recipe"} · result ID {result.id}
          </div>
        </div>
        <span className="badge">
          <strong>{result.provider}</strong>
          provider
        </span>
      </div>

      <div className="metric-strip">
        <span className="metric-pill">
          <strong>{result.metrics?.promptTokens ?? 0}</strong> input tokens
        </span>
        <span className="metric-pill">
          <strong>{result.metrics?.completionTokens ?? 0}</strong> output tokens
        </span>
        <span className="metric-pill">
          <strong>{formatCurrency(result.metrics?.estimatedCost ?? null)}</strong> est. cost
        </span>
        <span className="metric-pill">
          <strong>{result.metrics?.latencyMs ?? 0}ms</strong> latency
        </span>
      </div>

      <div className="message-toggle">
        <button
          className={view === "cause" ? "is-active" : ""}
          onClick={() => setView("cause")}
          type="button"
        >
          Cause only
        </button>
        <button
          className={view === "full" ? "is-active" : ""}
          onClick={() => setView("full")}
          type="button"
        >
          Full message
        </button>
      </div>

      <div className="message-frame">{result.error ? `Error: ${result.error}` : message}</div>

      <div className="status-line">
        <span>{characterCount} characters in this view</span>
        <span>{result.caseName}</span>
      </div>

      <div className="rating-grid" style={{ marginTop: 18 }}>
        <div className="inline-grid">
          {[
            ["clarity", "Clarity"],
            ["specificity", "Specificity"],
            ["fundraiserRelevance", "Fundraiser relevance"],
            ["emotionalResonance", "Emotional resonance"],
            ["brandSafety", "Brand safety"],
            ["overall", "Overall"],
          ].map(([key, label]) => (
            <div className="field-group" key={key}>
              <label htmlFor={`${result.id}-${key}`}>{label}</label>
              <select
                id={`${result.id}-${key}`}
                value={rating[key]}
                onChange={(event) =>
                  setRating((current) => ({ ...current, [key]: event.target.value }))
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="field-group">
          <label htmlFor={`${result.id}-notes`}>Review notes</label>
          <textarea
            id={`${result.id}-notes`}
            value={rating.notes}
            onChange={(event) =>
              setRating((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Why is this good or weak? What should change in the prompt?"
          />
        </div>
        <div className="utility-row">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <input
              checked={rating.winner}
              onChange={(event) =>
                setRating((current) => ({ ...current, winner: event.target.checked }))
              }
              type="checkbox"
            />
            Mark as preferred output
          </label>
          <button className="ghost-button" disabled={saving} onClick={handleSave} type="button">
            {saving ? "Saving…" : "Save rating"}
          </button>
        </div>
      </div>
    </article>
  );
}
