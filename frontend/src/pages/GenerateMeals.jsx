import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import "./GenerateMeals.css";

/* --- Small helpers / reused bits --- */
const Pill = ({ children }) => <span className="mp-pill">{children}</span>;
const MacroRow = ({ cals, p, c, f }) => (
  <div className="mp-macros">C {cals}kcal | P {p}g | C {c}g | F {f}g</div>
);
const MealCard = ({ item }) => (
  <article className="mp-card">
    <div className="mp-card-img">
      <img src={item.img} alt={item.title} loading="lazy" draggable={false} />
    </div>
    <div className="mp-card-body">
      <h3 className="mp-card-title">{item.title}</h3>
      <Pill>{item.meal}</Pill>
      <MacroRow cals={item.cals} p={item.p} c={item.c} f={item.f} />
    </div>
  </article>
);

/* ---- Days / slots scaffold ---- */
const DAY_LABELS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SLOTS = ["Breakfast", "Lunch", "Dinner"];
const emptyWeek = () => DAY_LABELS.map(() => ({ Breakfast:null, Lunch:null, Dinner:null }));

/* Replace with your real endpoint later */
const GENERATE_ENDPOINT = "https://<api-id>.execute-api.<region>.amazonaws.com/generate-meals";

/* Storage + channel keys */
const STORAGE_KEY = "savr.week.v1";
const CHANNEL_NAME = "savr";

/* --- Page (DRAFT workflow) --- */
export default function GenerateMeals() {
  // Draft you are editing here
  const [week, setWeek] = useState(emptyWeek());
  // Snapshot of what’s currently on the dashboard
  const [savedWeek, setSavedWeek] = useState(emptyWeek());

  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // 1) Load current dashboard plan -> both draft and snapshot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const w = JSON.parse(raw);
        if (Array.isArray(w) && w.length === 7) {
          setWeek(w);
          setSavedWeek(w);
        }
      }
    } catch {}
  }, []);

  // 2) Setup broadcaster (don’t send until the user saves)
  const bcRef = useRef(null);
  useEffect(() => {
    if ("BroadcastChannel" in window) {
      bcRef.current = new BroadcastChannel(CHANNEL_NAME);
    }
    return () => bcRef.current?.close();
  }, []);

  /* ---------- SAVE / REVERT / CLEAR ---------- */
  const saveAndView = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(week));
    bcRef.current?.postMessage({ type: "week:update", week });
    window.location.assign("/#Dashboard"); // back to dashboard
  };


  const clearAll = () => {
    setWeek(() => emptyWeek()); // brand new structure
  };

  /* ---------- Drag helpers ---------- */
  const onDragStart = (e, meal) => {
    e.dataTransfer.setData("text/plain", "suggestion");
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "suggestion", meal }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const onDragStartFromSlot = (e, meal, fromDay, fromSlot) => {
    e.dataTransfer.setData("text/plain", "slot");
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "slot", meal, fromDay, fromSlot })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (dayIdx, slot, e) => {
    e.preventDefault();
    const json = e.dataTransfer.getData("application/json");
    if (!json) return;

    let payload;
    try { payload = JSON.parse(json); } catch { return; }

    setWeek((prev) => {
      const next = prev.map((d) => ({ ...d }));

      if (payload.type === "suggestion") {
        next[dayIdx][slot] = payload.meal;
        return next;
      }

      if (payload.type === "slot") {
        const { fromDay, fromSlot } = payload;
        if (fromDay === dayIdx && fromSlot === slot) return next;
        const srcMeal = next[fromDay][fromSlot];
        const destMeal = next[dayIdx][slot];
        next[dayIdx][slot] = srcMeal;
        next[fromDay][fromSlot] = destMeal ?? null;
        return next;
      }

      if (payload && payload.title) next[dayIdx][slot] = payload;
      return next;
    });
  };

  const clearSlot = (dayIdx, slot) => {
    setWeek((prev) => {
      const next = prev.map((d) => ({ ...d }));
      next[dayIdx][slot] = null;
      return next;
    });
  };

  // Suggestions (mock)
  const generateWithAI = async () => {
    try {
      setIsGenerating(true);
      setError("");
      // const res = await fetch(GENERATE_ENDPOINT, { method: "POST" });
      // const { meals } = await res.json();
      const meals = MOCK_MEALS;
      setSuggestions(meals);
    } catch {
      setError("Sorry—couldn't generate meals. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <header className="mp-topbar">
        <img src="/savricon.png" alt="Logo" className="mp-brand-logo" />
        <div className="mp-brand-name"><span className="pacifico-regular">Savr</span></div>
      </header>

      <div className="mp-root gm-page">
        <main className="mp-main">
          <header className="mp-header">
            <h1 className="mp-title">🍽️ Plan once. Eat better all week</h1>
            <div className="mp-toolbar">
              <button className="ai-btn danger" onClick={clearAll} title="Clear this draft plan">
                Clear All
              </button>
              <button
                className="ai-btn primary save-btn"
                onClick={saveAndView}
                title="Publish this plan to the dashboard"
              >
                Save & View on Dashboard
              </button>
            </div>
          </header>

          {/* ------- SPLIT PANES ------- */}
          <div className="gm-split">
            {/* LEFT: Suggestions */}
            <section className="gm-pane gm-left">
              <div className="gm-pane-head">
                <h3 className="gm-suggest-title">Suggestions</h3>
                <button className="ai-btn" onClick={generateWithAI} disabled={isGenerating}>
                  {isGenerating ? "Generating…" : "Generate with Savr"}
                </button>
              </div>

              {!suggestions.length && (
                <div className="gm-pane-subhead">
                  <p className="gm-hint">Click “Generate with AI” to get meal ideas.</p>
                </div>
              )}
              {error && (
                <div className="gm-pane-subhead">
                  <div className="mp-alert error">{error}</div>
                </div>
              )}

              <div className="gm-pane-body">
                {(() => {
                  const byType = (t) => suggestions.filter((m) => m.meal?.toLowerCase() === t);
                  const rows = [
                    { key: "breakfast", label: "Breakfast", data: byType("breakfast") },
                    { key: "lunch",     label: "Lunch",     data: byType("lunch") },
                    { key: "dinner",    label: "Dinner",    data: byType("dinner") },
                  ];
                  return rows.map(({ key, label, data }) =>
                    data.length ? (
                      <div className="gm-cat" key={key}>
                        <div className="gm-cat-title">{label}</div>
                        <div className="gm-strip">
                          {data.map((m, i) => (
                            <div
                              key={`${key}-${i}`}
                              className="gm-mini"
                              draggable
                              onDragStart={(e) => onDragStart(e, m)}
                              title="Drag to a day on the right"
                            >
                              <MealCard item={m} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  );
                })()}
              </div>
            </section>

            {/* RIGHT: Week board */}
            <section className="gm-pane gm-right" onDragOver={onDragOver}>
              <div className="gm-weekbox">
                {week.map((day, dayIdx) => (
                  <section className="mp-day" key={DAY_LABELS[dayIdx]}>
                    <header className="mp-day-head">
                      <span className="mp-day-name">{DAY_LABELS[dayIdx]}</span>
                      <span className="mp-day-count">
                        {Object.values(day).filter(Boolean).length}
                      </span>
                    </header>

                    <div className="mp-day-list">
                      {SLOTS.map((slot) => {
                        const meal = day[slot];
                        return (
                          <div
                            key={slot}
                            className={`gm-drop ${meal ? "has" : "empty"}`}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(dayIdx, slot, e)}
                          >
                            {meal ? (
                              <div
                                className="gm-filled"
                                draggable
                                onDragStart={(e) => onDragStartFromSlot(e, meal, dayIdx, slot)}
                                title="Drag to move or swap"
                              >
                                <MealCard item={meal} />
                                <button
                                  className="mp-icon-btn gm-clear"
                                  aria-label="Clear slot"
                                  onClick={() => clearSlot(dayIdx, slot)}
                                  title="Remove"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="gm-empty-card">
                                <div className="gm-slot">{slot}</div>
                                <div className="gm-drop-hint">Drop meal here</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </div>
          {/* ------- /SPLIT PANES ------- */}
        </main>
      </div>
    </>
  );
}

/* --------- Demo meals (replace with API data) ---------- */
const MOCK_MEALS = [
  { title: "Yogurt with Banana & Cinnamon", meal: "Breakfast", cals: 260, p: 12, c: 42, f: 4, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop" },
  { title: "Scrambled Eggs & Spinach",      meal: "Breakfast", cals: 240, p: 18, c: 4,  f: 14, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop" },
  { title: "Lentil Soup",                    meal: "Lunch",     cals: 380, p: 22, c: 60, f: 6,  img: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop" },
  { title: "Chickpea Pita Salad",            meal: "Lunch",     cals: 430, p: 18, c: 70, f: 9,  img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" },
  { title: "Chicken Stir-Fry",               meal: "Dinner",    cals: 540, p: 36, c: 55, f: 16, img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop" },
  { title: "Beef & Broccoli Rice Bowl",      meal: "Dinner",    cals: 610, p: 34, c: 68, f: 20, img: "https://images.unsplash.com/photo-1544025163-2509f02c57d9?q=80&w=800&auto=format&fit=crop" },
  { title: "Bagel with Butter & Apples",     meal: "Breakfast", cals: 350, p: 9,  c: 55, f: 12, img: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=800&auto=format&fit=crop" },
  { title: "Turkey Sandwich",                meal: "Lunch",     cals: 370, p: 26, c: 48, f: 8,  img: "https://images.unsplash.com/photo-1544025162-8a1f9f65b3d3?q=80&w=800&auto=format&fit=crop" },
  { title: "Shrimp Tacos",                   meal: "Dinner",    cals: 520, p: 30, c: 52, f: 20, img: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=800&auto=format&fit=crop" },
];
