import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import "./GenerateMeals.css";
import { generateMealPlan } from "../services/api";

/* --- Small helpers / reused bits --- */
const Pill = ({ children }) => <span className="mp-pill">{children}</span>;

const MacroRow = ({ cals, p, c, f }) => (
  <div className="mp-macros">
    C {cals}kcal | P {p}g | C {c}g | F {f}g
  </div>
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
const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const SLOTS = ["Breakfast", "Lunch", "Dinner"];
const emptyWeek = () =>
  DAY_LABELS.map(() => ({ Breakfast: null, Lunch: null, Dinner: null }));

/* --- Page --- */
export default function GenerateMeals({ sessionId }) {
  const STORAGE_KEY = "savr.week.v1";
  const CHANNEL_NAME = "savr";

  /* Load pantry items from localStorage */
  const [pantryItems] = useState(() => {
    try {
      const saved = localStorage.getItem("savr_pantry_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [week, setWeek] = useState(emptyWeek());
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  /* ---------- Load saved plan ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length === 7) {
        setWeek(saved);
      }
    } catch { }
  }, []);

  /* ---------- Persist & broadcast ---------- */
  const bcRef = useRef(null);
  useEffect(() => {
    if ("BroadcastChannel" in window) {
      bcRef.current = new BroadcastChannel(CHANNEL_NAME);
    }
    return () => bcRef.current?.close();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(week));
    bcRef.current?.postMessage({ type: "week:update", week });
  }, [week]);

  /* ---------- Drag helpers ---------- */
  const onDragStart = (e, meal) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "suggestion", meal }));
  };

  const onDragStartFromSlot = (e, meal, fromDay, fromSlot) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "slot", meal, fromDay, fromSlot })
    );
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (dayIdx, slot, e) => {
    e.preventDefault();
    const json = e.dataTransfer.getData("application/json");
    if (!json) return;

    let payload;
    try {
      payload = JSON.parse(json);
    } catch {
      return;
    }

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

  /* ---------- AI Meal Generation ---------- */
  const generateWithAI = async () => {
    try {
      setIsGenerating(true);
      setError("");

      console.log("🤖 Generating meals with Claude AI...");
      console.log("Pantry items:", pantryItems);

      const response = await generateMealPlan(
        pantryItems,
        {
          budget: 100,
          dietaryRestrictions: "",
          nutritionGoal: "maintenance",
          caloricTarget: 2000,
          proteinTarget: 150,
          carbTarget: 200,
          fatTarget: 65,
        },
        sessionId || "anonymous"
      );

      console.log("✅ Meals generated:", response);
      const meals = response.meals || [];
      setSuggestions(meals);

      if (meals.length === 0)
        setError("No meals generated. Try adding more items to your pantry.");
    } catch (err) {
      console.error("❌ Error generating meals:", err);
      setError("Sorry — couldn't generate meals. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="mp-root gm-page">
      <main className="mp-main">
        {/* Top Navigation */}
        <header className="mp-topbar">
          <div className="mp-left">
            <img src="/savricon.png" alt="Logo" className="mp-brand-logo" />
            <span className="Anybody" className="gm-hero-title"
              style={{ marginLeft: "8px", marginTop: "8px", fontSize: "2rem", fontWeight: "bold" }}
            >Plan once. Eat better all week.</span>
          </div>

          <div className="mp-right">
            <button
              className="clear-btn"
              onClick={() => {
                if (window.confirm("Clear all meals and suggestions?")) {
                  setSuggestions([]);
                  setWeek(emptyWeek());
                  localStorage.removeItem("savr.week.v1");
                  localStorage.removeItem("savr.week.publishedAt");
                  console.log("🧹 Cleared all meal data");
                }
              }}
            >
              Clear All
            </button>

            <button
              className="save-MealPlan-btn"
              onClick={() => window.location.assign("/#Dashboard")}
              title="Save and return to Dashboard"
            >
              Save & View on Dashboard
            </button>
          </div>
        </header>

        {/* Split Layout */}
        <div className="gm-split">
          {/* LEFT: Suggestions */}
          <section className="gm-pane gm-left">
            <div className="gm-pane-head">
              <h3 className="gm-suggest-title">Suggestions</h3>
              <button
                className="ai-btn"
                onClick={generateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating…" : "Generate with Savr"}
              </button>
            </div>

            {!suggestions.length && (
              <div className="gm-pane-subhead">
                <p className="gm-hint">
                  Click “Generate with Savr” to get meal ideas.
                </p>
              </div>
            )}
            {error && (
              <div className="gm-pane-subhead">
                <div className="mp-alert error">{error}</div>
              </div>
            )}

            <div className="gm-pane-body">
              {["breakfast", "lunch", "dinner"].map((type) => {
                const meals = suggestions.filter(
                  (m) => m.meal?.toLowerCase() === type
                );
                if (!meals.length) return null;
                return (
                  <div className="gm-cat" key={type}>
                    <div className="gm-cat-title">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    <div className="gm-strip">
                      {meals.map((m, i) => (
                        <div
                          key={`${type}-${i}`}
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
                );
              })}
            </div>
          </section>

          {/* RIGHT: Weekly Board */}
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
                              onDragStart={(e) =>
                                onDragStartFromSlot(e, meal, dayIdx, slot)
                              }
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
      </main>
    </div>
  );
}

