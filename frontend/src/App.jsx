
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CircleCheck,
  LoaderCircle,
  ScanSearch,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  History,
  RotateCcw,
  Search,
  Clock3,
  ChevronRight,
  FileSearch,
} from "lucide-react";
import "./App.css";

const API = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const initialForm = {
  step: 100,
  type: "TRANSFER",
  amount: 500000,
  oldbalanceOrg: 500000,
  newbalanceOrig: 0,
  oldbalanceDest: 0,
  newbalanceDest: 500000,
};

const transactionTypes = [
  "TRANSFER",
  "CASH_OUT",
  "CASH_IN",
  "PAYMENT",
  "DEBIT",
];

const fields = [
  ["step", "Transaction step"],
  ["amount", "Transaction amount"],
  ["oldbalanceOrg", "Origin balance before"],
  ["newbalanceOrig", "Origin balance after"],
  ["oldbalanceDest", "Destination balance before"],
  ["newbalanceDest", "Destination balance after"],
];

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function Stat({ label, value, note, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function ExplanationList({ explanations = [] }) {
  if (!explanations.length) {
    return (
      <div className="no-explanations">
        No feature explanations were returned by the API.
      </div>
    );
  }

  return (
    <section className="explanation-section">
      <h3>Why this score?</h3>
      <p className="explanation-caption">
        Features influencing this model's output. These are explanations,
        not proof of fraud.
      </p>

      {explanations.map((item, index) => {
        const impact = Number(item.impact);
        const positive = impact > 0;
        const negative = impact < 0;
        const feature = item.feature.replace(/^(num__|cat__)/, "");

        return (
          <div className="explanation-item" key={`${item.feature}-${index}`}>
            <div className="explanation-label">
              <strong>{feature}</strong>
              <span
                className={
                  positive
                    ? "impact-up"
                    : negative
                    ? "impact-down"
                    : "impact-neutral"
                }
              >
                {positive ? (
                  <TrendingUp size={13} />
                ) : negative ? (
                  <TrendingDown size={13} />
                ) : null}
                {positive ? "+" : ""}
                {impact.toFixed(4)}
              </span>
            </div>
            <p>{item.direction}</p>
          </div>
        );
      })}
    </section>
  );
}

function TransactionForm({
  form,
  setForm,
  onSubmit,
  loading,
  error,
  onReset,
  submitLabel = "Analyze transaction",
}) {
  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "type" ? value : value === "" ? "" : Number(value),
    }));
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Transaction details</h2>
          <p>Enter the transaction values to assess its risk.</p>
        </div>
        <ScanSearch size={21} />
      </div>

      <form onSubmit={onSubmit}>
        <label className="field">
          Transaction type
          <select name="type" value={form.type} onChange={updateField}>
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          {fields.map(([name, label]) => (
            <label className="field" key={name}>
              {label}
              <input
                type="number"
                name={name}
                min="0"
                step="any"
                value={form[name]}
                onChange={updateField}
                required
              />
            </label>
          ))}
        </div>

        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={18} />
                Analyzing...
              </>
            ) : (
              <>
                {submitLabel}
                <ArrowUpRight size={18} />
              </>
            )}
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={onReset}
            disabled={loading}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}

function RiskResult({ result }) {
  if (!result) {
    return (
      <section className="panel result-panel">
        <div className="panel-heading">
          <div>
            <h2>Risk assessment</h2>
            <p>Your prediction will appear here.</p>
          </div>
          <ShieldCheck size={22} />
        </div>

        <div className="empty-state">
          <div className="empty-icon">
            <ShieldCheck size={32} />
          </div>
          <strong>Ready for analysis</strong>
          <p>
            Submit a transaction to see its score, model decision, and
            feature explanations.
          </p>
        </div>
      </section>
    );
  }

  const score = Number(result.risk_score) || 0;
  const highRisk = result.risk_level === "HIGH";

  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <div>
          <h2>Risk assessment</h2>
          <p>Prediction from the connected model.</p>
        </div>
        <ShieldCheck size={22} />
      </div>

      <div className={`risk-badge ${highRisk ? "high" : "low"}`}>
        {highRisk ? (
          <AlertTriangle size={17} />
        ) : (
          <ShieldCheck size={17} />
        )}
        {result.risk_level} RISK
      </div>

      <div className="score">
        {score.toFixed(2)}
        <span>%</span>
      </div>

      <div className="score-caption">
        Model score — not a calibrated probability
      </div>

      <div
        className="meter"
        role="progressbar"
        aria-label="Model risk score"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`meter-fill ${highRisk ? "high" : ""}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      <div className="result-detail">
        <span>Model decision</span>
        <strong>
          {result.prediction === 1 ? "Flagged for review" : "Not flagged"}
        </strong>
      </div>

      <div className="result-detail">
        <span>Decision threshold</span>
        <strong>{(Number(result.threshold) * 100).toFixed(0)}%</strong>
      </div>

      {result.risk_summary && (
        <div className="risk-summary">
          <h3>Risk summary</h3>
          <p>{result.risk_summary.headline}</p>
          <p className="summary-caution">{result.risk_summary.caution}</p>
        </div>
      )}

      <ExplanationList explanations={result.explanations} />

      <div className="disclaimer">{result.disclaimer}</div>
    </section>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("Checking");
  const [activePage, setActivePage] = useState("overview");
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);

  const checkApi = useCallback(async () => {
    try {
      await axios.get(`${API}/health`, { timeout: 5000 });
      setApiStatus("Connected");
    } catch {
      setApiStatus("Offline");
    }
  }, []);

  useEffect(() => {
    checkApi();
  }, [checkApi]);

  async function analyzeTransaction(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setSelectedHistory(null);

    try {
      const response = await axios.post(`${API}/predict`, form, {
        timeout: 30000,
      });

      const analysis = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        transaction: { ...form },
        result: response.data,
      };

      setResult(response.data);
      setHistory((previous) => [analysis, ...previous].slice(0, 100));
      setApiStatus("Connected");
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail
          ? JSON.stringify(detail)
          : "Could not reach the API. Check that FastAPI is running."
      );
      checkApi();
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ ...initialForm });
    setResult(null);
    setError("");
    setSelectedHistory(null);
  }

  function openHistoryItem(item) {
    setSelectedHistory(item);
    setForm({ ...item.transaction });
    setResult(item.result);
    setError("");
    setActivePage("analysis");
  }

  const filteredHistory = history.filter((item) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;

    return (
      item.transaction.type.toLowerCase().includes(query) ||
      item.result.risk_level.toLowerCase().includes(query) ||
      String(item.transaction.amount).includes(query)
    );
  });

  const highRiskCount = history.filter(
    (item) => item.result.risk_level === "HIGH"
  ).length;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <strong>RiskLens AI</strong>
            <span>Financial Intelligence</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button
          type="button"
          className={`nav-item ${activePage === "overview" ? "active" : ""}`}
          onClick={() => setActivePage("overview")}
        >
          <LayoutDashboard size={18} />
          Risk overview
        </button>

        <button
          type="button"
          className={`nav-item ${activePage === "analysis" ? "active" : ""}`}
          onClick={() => {
            setActivePage("analysis");
            setSelectedHistory(null);
          }}
        >
          <ScanSearch size={18} />
          Transaction analysis
        </button>

        <button
          type="button"
          className={`nav-item ${activePage === "history" ? "active" : ""}`}
          onClick={() => setActivePage("history")}
        >
          <History size={18} />
          Analysis history
          <span className="nav-count">{history.length}</span>
        </button>

        <div className="sidebar-bottom">
          <span
            className={`status-dot ${
              apiStatus === "Connected" ? "online" : ""
            }`}
          />
          <div>
            <strong>API {apiStatus}</strong>
            <span>Local model service</span>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">RISK INTELLIGENCE PLATFORM</div>
            <h1>
              {activePage === "overview"
                ? "Transaction risk overview"
                : activePage === "analysis"
                ? "Transaction analysis"
                : "Analysis history"}
            </h1>
            <p>
              {activePage === "overview"
                ? "Monitor model activity and review transaction risk."
                : activePage === "analysis"
                ? "Submit a transaction and inspect the model's assessment."
                : "Review transactions analyzed in this browser session."}
            </p>
          </div>

          <div className="live-pill">
            <span
              className={`status-dot ${
                apiStatus === "Connected" ? "online" : ""
              }`}
            />
            {apiStatus === "Connected" ? "API connected" : apiStatus}
          </div>
        </header>

        {activePage === "overview" && (
          <>
            <div className="stat-grid">
              <Stat
                label="Prediction service"
                value={apiStatus}
                note="FastAPI health endpoint"
                icon={CircleCheck}
              />
              <Stat
                label="Analyzed this session"
                value={history.length}
                note="Stored in current browser memory"
                icon={Activity}
              />
              <Stat
                label="Flagged high risk"
                value={highRiskCount}
                note="Prototype model decisions"
                icon={AlertTriangle}
              />
            </div>

            <div className="overview-grid">
              <section className="panel overview-action">
                <div className="overview-icon">
                  <FileSearch size={25} />
                </div>
                <h2>Analyze a transaction</h2>
                <p>
                  Enter transaction details to get a model score, decision,
                  and SHAP feature explanations.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    resetForm();
                    setActivePage("analysis");
                  }}
                >
                  Start analysis <ArrowUpRight size={18} />
                </button>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent analyses</h2>
                    <p>Your latest transactions in this session.</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setActivePage("history")}
                  >
                    View all <ChevronRight size={15} />
                  </button>
                </div>

                {history.length === 0 ? (
                  <div className="history-empty">
                    <Clock3 size={24} />
                    <p>No transactions analyzed yet.</p>
                  </div>
                ) : (
                  history.slice(0, 5).map((item) => (
                    <button
                      type="button"
                      className="recent-item"
                      key={item.id}
                      onClick={() => openHistoryItem(item)}
                    >
                      <span className="recent-icon">
                        <Activity size={17} />
                      </span>
                      <span className="recent-info">
                        <strong>{item.transaction.type}</strong>
                        <small>
                          ₹{formatAmount(item.transaction.amount)} ·{" "}
                          {formatTime(item.createdAt)}
                        </small>
                      </span>
                      <span
                        className={`mini-risk ${
                          item.result.risk_level === "HIGH" ? "high" : "low"
                        }`}
                      >
                        {item.result.risk_level}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))
                )}
              </section>
            </div>
          </>
        )}

        {activePage === "analysis" && (
          <div className="content-grid">
            <TransactionForm
              form={form}
              setForm={setForm}
              onSubmit={analyzeTransaction}
              loading={loading}
              error={error}
              onReset={resetForm}
              submitLabel="Analyze transaction"
            />
            <RiskResult result={result} />
          </div>
        )}

        {activePage === "history" && (
          <section className="panel history-panel">
            <div className="panel-heading">
              <div>
                <h2>Transaction history</h2>
                <p>
                  {history.length} analysis
                  {history.length === 1 ? "" : "es"} in this session.
                </p>
              </div>
              <History size={22} />
            </div>

            <label className="history-search">
              <Search size={17} />
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search transaction type, risk level, or amount..."
              />
            </label>

            {filteredHistory.length === 0 ? (
              <div className="history-empty large">
                <FileSearch size={30} />
                <strong>
                  {history.length === 0
                    ? "No analyses yet"
                    : "No matching transactions"}
                </strong>
                <p>
                  {history.length === 0
                    ? "Run a transaction analysis to create your first history entry."
                    : "Try another search term."}
                </p>
                {history.length === 0 && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActivePage("analysis")}
                  >
                    Analyze a transaction
                  </button>
                )}
              </div>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Amount</th>
                      <th>Risk score</th>
                      <th>Decision</th>
                      <th>Time</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.transaction.type}</strong>
                          <small>Step {item.transaction.step}</small>
                        </td>
                        <td>₹{formatAmount(item.transaction.amount)}</td>
                        <td>{Number(item.result.risk_score).toFixed(2)}%</td>
                        <td>
                          <span
                            className={`mini-risk ${
                              item.result.risk_level === "HIGH"
                                ? "high"
                                : "low"
                            }`}
                          >
                            {item.result.risk_level}
                          </span>
                        </td>
                        <td>{formatTime(item.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="view-button"
                            onClick={() => openHistoryItem(item)}
                          >
                            View <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {history.length > 0 && (
              <div className="history-footer">
                <span>
                  History is temporary and clears when this page session ends.
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setHistory([]);
                    setResult(null);
                    setSelectedHistory(null);
                  }}
                >
                  <RotateCcw size={15} />
                  Clear history
                </button>
              </div>
            )}
          </section>
        )}

        <footer>
          <span>RiskLens AI · Experimental fraud detection</span>
          <span>For demonstration and research only</span>
        </footer>
      </section>
    </main>
  );
}
