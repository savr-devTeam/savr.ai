import React, { useRef, useState, useEffect } from "react";
import "./Dashboard.css";
import "./GenerateMeals.css";
import { uploadReceipt, parseReceipt, analyzeReceipt } from '../services/api';

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9Zm-2-5H7v1a1 1 0 1 1-2 0V5H5a1 1 0 0 0-1 1v2h16V6a1 1 0 0 0-1-1h-1V5a1 1 0 1 1-2 0V5Z" />
  </svg>
);

const Pill = ({ children }) => <span className="mp-pill">{children}</span>;
const MacroRow = ({ cals, p, c, f }) => (
  <div className="mp-macros">C {cals}kcal | P {p}g | C {c}g | F {f}g</div>
);
const MealCard = ({ item }) => (
  <article className="mp-card">
    <div className="mp-card-img"><img src={item.img} alt={item.title} loading="lazy" /></div>
    <div className="mp-card-body">
      <h3 className="mp-card-title">{item.title}</h3>
      <Pill>{item.meal}</Pill>
      <MacroRow cals={item.cals} p={item.p} c={item.c} f={item.f} />
    </div>
  </article>
);

const STORAGE_KEY = "savr.week.v1";
const CHANNEL_NAME = "savr";
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS = ["Breakfast", "Lunch", "Dinner"];
const emptyWeek = () => DAY_LABELS.map(() => ({ Breakfast: null, Lunch: null, Dinner: null }));

function DayColumn({ label, day }) {
  const filled = Object.values(day).filter(Boolean).length;
  return (
    <section className="mp-day">
      <header className="mp-day-head">
        <span className="mp-day-name">{label}</span>
        <span className="mp-day-count">{filled}</span>
      </header>
      <div className="mp-day-list">
        {SLOTS.map((slot) => {
          const meal = day[slot];
          return (
            <div key={slot} className={`gm-drop ${meal ? "has" : "empty"}`}>
              {meal ? (
                <MealCard item={meal} />
              ) : (
                <div className="gm-empty-card">
                  <div className="gm-slot">{slot}</div>
                  <div className="gm-drop-hint">No meal yet</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function scanWithTextractApiGateway(file, sessionId) {
  try {
    const uploadResult = await uploadReceipt(file, sessionId);
    const parseResult = await parseReceipt(uploadResult.s3Key, sessionId);
    const items = parseResult.result?.items || [];
    return {
      items: items.map((item) => ({
        name: item.name,
        qty: item.quantity || null,
        unit: null,
      })),
    };
  } catch (error) {
    console.error("❌ Receipt scan error:", error);
    throw error;
  }
}

export default function MealPlan({ sessionId } = {}) {
  const [pantryItems, setPantryItems] = useState(() => {
    try {
      const saved = localStorage.getItem("savr_pantry_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newItem, setNewItem] = useState("");
  const [week, setWeek] = useState(emptyWeek());
  const [hasCustomPlan, setHasCustomPlan] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  useEffect(() => {
    localStorage.setItem("savr_pantry_items", JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length === 7) {
        setWeek(saved);
        setHasCustomPlan(true);
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (ev) => {
      if (ev?.data?.type === "week:update" && Array.isArray(ev.data.week)) {
        setWeek(ev.data.week);
        setHasCustomPlan(true);
      }
    };
    return () => bc.close();
  }, []);

  const addPantryItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setPantryItems((p) => [label, ...p]);
    setNewItem("");
  };
  const removePantryItem = (idx) =>
    setPantryItems((p) => p.filter((_, i) => i !== idx));

  const clearWeek = () => {
    localStorage.removeItem(STORAGE_KEY);
    setWeek(emptyWeek());
    setHasCustomPlan(false);
  };

  /* Scan modal state */
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [scanError, setScanError] = useState("");
  const fileInputRef = useRef(null);

  const openScan = () => {
    setScanOpen(true);
    setSelectedFile(null);
    setParsed([]);
    setScanError("");
  };

  const closeScan = () => setScanOpen(false);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setParsed([]);
    setScanError("");
  };

  useEffect(() => {
    if (!scanOpen && fileInputRef.current) fileInputRef.current.value = "";
  }, [scanOpen]);

  const runScan = async () => {
    if (!selectedFile) return;
    try {
      setIsParsing(true);
      setScanError("");

      const userSessionId = sessionId || 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      const { items } = await scanWithTextractApiGateway(selectedFile, userSessionId);
      setParsed(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Scan error:', err);
      setScanError("We couldn't read that receipt. Try another image/PDF.");
    } finally {
      setIsParsing(false);
    }
  };

  const removeParsedItem = (idx) => setParsed((p) => p.filter((_, i) => i !== idx));

  const addParsedToPantry = () => {
    if (!parsed.length) return;
    const labels = parsed.map((it) => `${it.name}${it.qty ? ` x${it.qty}` : ""}${it.unit ? ` ${it.unit}` : ""}`);
    setPantryItems((p) => [...labels, ...p]);
    closeScan();
  };

  return (
    <>
      {/* Brand header */}
      <header className="mp-topbar">
        <img src="/savricon.png" alt="Logo" className="mp-brand-logo" />
        <div className="mp-brand-name"><span className="pacifico-regular">Savr</span></div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="mp-root">
        <aside className="mp-sidebar">
          <div className="mp-sidecard">
            <h4 className="mp-sidebar-title">Quick Buttons</h4>
            <div className="mp-quick-buttons">
              <button className="mp-btn ghost" onClick={() => window.location.assign("/#GenerateMeals")}>
                <img src="/savricon.png" alt="" className="mp-savr-icon" />
                Generate Meal Plan
              </button>
              <button className="mp-btn ghost" onClick={clearWeek}>Clear Week</button>
              <button className="mp-btn ghost" onClick={openScan}>Scan Receipt</button>
            </div>
          </div>

          <div className="mp-sidecard vp">
            <h4 className="mp-sidecard-title">Virtual Pantry</h4>
            {pantryItems.length === 0 ? (
              <div className="mp-empty" aria-live="polite">
                No items in Virtual Pantry
              </div>
            ) : (
              <ul className="mp-pantry-list">
                {pantryItems.map((label, idx) => (
                  <li key={idx} className="mp-pantry-item">
                    <span className="mp-pantry-text">{label}</span>
                    <button
                      className="mp-icon-btn mp-icon-del"
                      aria-label={`Remove ${label}`}
                      onClick={() => removePantryItem(idx)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div
              className="mp-quickadd"
              onKeyDown={(e) => e.key === "Enter" && addPantryItem()}
            >
              <input
                className="mp-input"
                placeholder="Add Item"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <button
                className="mp-add-btn"
                aria-label="Add item"
                onClick={addPantryItem}
                disabled={!newItem.trim()}
              >
                +
              </button>
            </div>
          </div>
        </aside>

        <main className="mp-main">
          <header className="mp-header">
            <h1 className="mp-title">This Weeks Meal Plan {hasCustomPlan ? "" : ""}</h1>
            <div className="mp-toolbar">
              <button className="mp-chip"><CalendarIcon /><span>Weekly Plan</span></button>
              <button className="mp-chip" onClick={() => window.location.assign("/#GenerateMeals")}>
                <img src="/savricon.png" alt="" className="mp-savr-icon" />
                Generate Meal Plan
              </button>
              <div className="mp-toolbar-spacer" />
            </div>
          </header>
          <div className="mp-scroller">
            {week.map((day, i) => (
              <DayColumn key={DAY_LABELS[i]} label={DAY_LABELS[i]} day={day} />
            ))}
          </div>
        </main>
      </div>

      {/* Scan Modal */}
      {scanOpen && (
        <div
          className="mp-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-title"
          onClick={(e) => { if (e.target.classList.contains('mp-modal')) closeScan(); }}
        >
          <div className="mp-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="mp-modal-head">
              <h3 id="scan-title">Scan Receipt</h3>
              <button className="mp-icon-btn" onClick={closeScan} aria-label="Close">✕</button>
            </header>

            <div className="mp-modal-body">
              <div className="mp-upload-row">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={onFileChange} hidden />
                <button className="mp-btn" onClick={onPickFile}>{selectedFile ? "Change file" : "Choose file"}</button>
                <span className="mp-upload-name">{selectedFile ? selectedFile.name : "No file chosen"}</span>
                <button className="mp-btn primary" onClick={runScan} disabled={!selectedFile || isParsing}>
                  {isParsing ? "Scanning…" : "Parse receipt"}
                </button>
              </div>

              {scanError && <div className="mp-alert error">{scanError}</div>}

              {!!parsed.length && (
                <>
                  <h4 className="mp-review-title">Items found</h4>
                  <ul className="mp-review-list">
                    {parsed.map((it, idx) => (
                      <li key={idx} className="mp-review-item">
                        <span className="mp-review-text">
                          {it.name}{it.qty ? ` x${it.qty}` : ""}{it.unit ? ` ${it.unit}` : ""}
                        </span>
                        <button className="mp-icon-btn mp-icon-del" aria-label={`Remove ${it.name}`} onClick={() => removeParsedItem(idx)}>✕</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <footer className="mp-modal-foot">
              <button className="mp-btn ghost" onClick={closeScan}>Cancel</button>
              <button className="mp-btn primary" disabled={!parsed.length} onClick={addParsedToPantry}>Add to Pantry</button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
