import React, { useRef, useState, useEffect } from "react";
import "./Dashboard.css";
import { uploadReceipt, parseReceipt, analyzeReceiptAI } from '../services/api';

/* ---------- SVGs ---------- */
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9Zm-2-5H7v1a1 1 0 1 1-2 0V5H5a1 1 0 0 0-1 1v2h16V6a1 1 0 0 0-1-1h-1V5a1 1 0 1 1-2 0V5Z" />
  </svg>
);

const Pill = ({ children }) => <span className="mp-pill">{children}</span>;

/* ---------- Demo data ---------- */
const foods = {
  monday: [
    { title: "Yogurt with Banana & Cinnamon", meal: "Breakfast", cals: 260, p: 12, c: 42, f: 4, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop" },
    { title: "Lentil Soup", meal: "Lunch", cals: 380, p: 22, c: 60, f: 6, img: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop" },
    { title: "Baked Salmon & Veggies", meal: "Dinner", cals: 520, p: 35, c: 28, f: 26, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop" },
  ],
  tuesday: [
    { title: "Yogurt with Banana & Cinnamon", meal: "Breakfast", cals: 260, p: 12, c: 42, f: 4, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop" },
    { title: "Lentil Soup", meal: "Lunch", cals: 380, p: 22, c: 60, f: 6, img: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop" },
    { title: "Chicken Stir-Fry", meal: "Dinner", cals: 540, p: 36, c: 55, f: 16, img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop" },
  ],
  wednesday: [
    { title: "Scrambled Eggs & Spinach", meal: "Breakfast", cals: 240, p: 18, c: 4, f: 14, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop" },
    { title: "Chickpea Pita Salad", meal: "Lunch", cals: 430, p: 18, c: 70, f: 9, img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" },
    { title: "Beef & Broccoli Rice Bowl", meal: "Dinner", cals: 610, p: 34, c: 68, f: 20, img: "https://images.unsplash.com/photo-1544025163-2509f02c57d9?q=80&w=800&auto=format&fit=crop" },
  ],
  thursday: [
    { title: "Bagel with Butter & Apples", meal: "Breakfast", cals: 350, p: 9, c: 55, f: 12, img: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=800&auto=format&fit=crop" },
    { title: "Turkey Sandwich", meal: "Lunch", cals: 370, p: 26, c: 48, f: 8, img: "https://images.unsplash.com/photo-1544025162-8a1f9f65b3d3?q=80&w=800&auto=format&fit=crop" },
    { title: "Shrimp Tacos", meal: "Dinner", cals: 520, p: 30, c: 52, f: 20, img: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=800&auto=format&fit=crop" },
  ],
  friday: [
    { title: "Omelette with Peppers", meal: "Breakfast", cals: 300, p: 18, c: 6, f: 18, img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=800&auto=format&fit=crop" },
    { title: "Black Bean Bowl", meal: "Lunch", cals: 420, p: 16, c: 58, f: 10, img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop" },
    { title: "Margherita Pizza (Thin Crust)", meal: "Dinner", cals: 630, p: 24, c: 78, f: 24, img: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=800&auto=format&fit=crop" },
  ],
  saturday: [
    { title: "Avocado Toast", meal: "Breakfast", cals: 310, p: 10, c: 35, f: 14, img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop" },
    { title: "Grilled Chicken Bowl", meal: "Lunch", cals: 450, p: 34, c: 50, f: 12, img: "https://images.unsplash.com/photo-1514511547113-bff19f1f0b38?q=80&w=800&auto=format&fit=crop" },
    { title: "Spaghetti & Meatballs", meal: "Dinner", cals: 700, p: 32, c: 82, f: 26, img: "https://images.unsplash.com/photo-1605470208304-4562d18e84a5?q=80&w=800&auto=format&fit=crop" },
  ],
  sunday: [
    { title: "Overnight Oats", meal: "Breakfast", cals: 290, p: 11, c: 48, f: 6, img: "https://images.unsplash.com/photo-1572441710534-780c9f25926d?q=80&w=800&auto=format&fit=crop" },
    { title: "Veggie Pasta", meal: "Lunch", cals: 520, p: 20, c: 72, f: 14, img: "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8bbf?q=80&w=800&auto=format&fit=crop" },
    { title: "Roast Chicken & Potatoes", meal: "Dinner", cals: 640, p: 42, c: 48, f: 26, img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" },
  ],
};

const MacroRow = ({ cals, p, c, f }) => (
  <div className="mp-macros">C {cals}kcal | P {p}g | C {c}g | F {f}g</div>
);

const MealCard = ({ item }) => (
  <article className="mp-card">
    <div className="mp-card-img">
      <img src={item.img} alt="meal" loading="lazy" />
    </div>
    <div className="mp-card-body">
      <h3 className="mp-card-title">{item.title}</h3>
      <Pill>{item.meal}</Pill>
      <MacroRow cals={item.cals} p={item.p} c={item.c} f={item.f} />
    </div>
  </article>
);

const DayColumn = ({ label, items }) => (
  <section className="mp-day">
    <header className="mp-day-head">
      <span className="mp-day-name">{label}</span>
      <span className="mp-day-count">{items.length}</span>
    </header>
    <div className="mp-day-list">
      {items.map((it, idx) => (
        <MealCard item={it} key={idx} />
      ))}
    </div>
  </section>
);

/* ---------- CALL YOUR API GATEWAY (AnalyzeExpense) ---------- */
/* Replace SCAN_ENDPOINT with your real endpoint. Return shape: { items: [{name, qty?, unit?}, ...] } */
const SCAN_ENDPOINT = "https://<api-id>.execute-api.<region>.amazonaws.com/scan-receipt";

async function scanWithTextractApiGateway(file) {
  try {
    // Step 1: Upload to S3 (gets presigned URL and uploads)
    console.log('Uploading receipt to S3...');
    const uploadResult = await uploadReceipt(file, sessionId);

    // Step 2: Wait for S3 trigger to invoke Textract (automatic)
    // Give it 3-5 seconds to process
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Parse receipt (calls your Lambda)
    console.log('Parsing receipt with Textract...');
    const parseResult = await parseReceipt(uploadResult.s3Key, sessionId);

    // Step 4: Format items for display
    const items = parseResult.result?.items || [];
    return { items };

  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
}
/* ---------- Main component ---------- */
export default function MealPlan() {
  /* Virtual Pantry */
  const [pantryItems, setPantryItems] = useState([]);
  const [newItem, setNewItem] = useState("");

  const addPantryItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setPantryItems((prev) => [label, ...prev]);
    setNewItem("");
  };
  const removePantryItem = (idx) =>
    setPantryItems((prev) => prev.filter((_, i) => i !== idx));

  /* Receipt Scan Modal */
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsed, setParsed] = useState([]);       // [{name, qty?, unit?}]
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

  const runScan = async () => {
    if (!selectedFile) return;
    try {
      setIsParsing(true);
      setScanError("");

      // Get sessionId from props
      const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

      const { items } = await scanWithTextractApiGateway(selectedFile, sessionId);
      setParsed(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Scan error:', err);
      setScanError("We couldn't read that receipt. Try another image/PDF.");
    } finally {
      setIsParsing(false);
    }
  };

  const removeParsedItem = (idx) => {
    setParsed((prev) => prev.filter((_, i) => i !== idx));
  };

  const addParsedToPantry = () => {
    if (!parsed.length) return;
    // Format label (simple; tweak as you like)
    const labels = parsed.map((it) => {
      const qty = it.qty ? ` x${it.qty}${it.unit ? " " + it.unit : ""}` : "";
      return `${it.name}${qty}`;
    });
    setPantryItems((prev) => [...labels, ...prev]);
    closeScan();
  };

  /* Clean up modal file input value when closing */
  useEffect(() => {
    if (!scanOpen && fileInputRef.current) fileInputRef.current.value = "";
  }, [scanOpen]);

  return (
    <>
      {/* Brand header */}
      <header className="mp-topbar">
        <img src="/savricon.png" alt="Logo" className="mp-brand-logo" />
        <div className="mp-brand-name">
          <span className="pacifico-regular">Savr</span>
        </div>
      </header>

      {/* Page layout */}
      <div className="mp-root">
        {/* Sidebar */}
        <aside className="mp-sidebar">
          {/* Quick Buttons */}
          <div className="mp-sidecard">
            <h4 className="mp-sidebar-title">Quick Buttons</h4>
            <div className="mp-quick-buttons">
              <button className="mp-btn ghost">
                <img src="/savricon.png" alt="" className="mp-savr-icon" />
                Generate Meal Plan
              </button>
              <button className="mp-btn ghost">Clear Week</button>

              {/* OPEN MODAL INSTEAD OF DIRECT UPLOAD */}
              <button className="mp-btn ghost" onClick={openScan}>
                Scan Receipt
              </button>
            </div>
          </div>

          {/* Virtual Pantry */}
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
                      title="Remove"
                      onClick={() => removePantryItem(idx)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                        <path
                          fill="currentColor"
                          d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 0 0 5.7 7.1L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              className="mp-quickadd"
              onKeyDown={(e) => {
                if (e.key === "Enter") addPantryItem();
              }}
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

        {/* Main */}
        <main className="mp-main">
          <header className="mp-header">
            <h1 className="mp-title">Meal Plan</h1>
            <div className="mp-toolbar">
              <button className="mp-chip">
                <CalendarIcon />
                <span>Weekly Plan</span>
              </button>
              <button className="mp-chip">
                <img src="/savricon.png" className="mp-savr-icon" alt="" />
                Generate Meal Plan
              </button>
              <div className="mp-toolbar-spacer" />
            </div>
          </header>

          <div className="mp-scroller">
            <DayColumn label="Monday" items={foods.monday} />
            <DayColumn label="Tuesday" items={foods.tuesday} />
            <DayColumn label="Wednesday" items={foods.wednesday} />
            <DayColumn label="Thursday" items={foods.thursday} />
            <DayColumn label="Friday" items={foods.friday} />
            <DayColumn label="Saturday" items={foods.saturday} />
            <DayColumn label="Sunday" items={foods.sunday} />
          </div>
        </main>
      </div>

      {/* ---------- Modal: Scan Receipt ---------- */}
      {scanOpen && (
        <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="scan-title" onClick={(e) => { if (e.target.classList.contains('mp-modal')) closeScan(); }}>
          <div className="mp-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="mp-modal-head">
              <h3 id="scan-title">Scan Receipt</h3>
              <button className="mp-icon-btn" onClick={closeScan} aria-label="Close">
                ✕
              </button>
            </header>

            <div className="mp-modal-body">
              {/* Step 1: pick file */}
              <div className="mp-upload-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={onFileChange}
                  hidden
                />
                <button className="mp-btn" onClick={onPickFile}>
                  {selectedFile ? "Change file" : "Choose file"}
                </button>
                <span className="mp-upload-name">
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </span>
                <button
                  className="mp-btn primary"
                  onClick={runScan}
                  disabled={!selectedFile || isParsing}
                >
                  {isParsing ? "Scanning…" : "Scan with AI"}
                </button>
              </div>

              {scanError && <div className="mp-alert error">{scanError}</div>}

              {/* Step 2: review items */}
              {!!parsed.length && (
                <>
                  <h4 className="mp-review-title">Items found</h4>
                  <ul className="mp-review-list">
                    {parsed.map((it, idx) => (
                      <li key={idx} className="mp-review-item">
                        <span className="mp-review-text">
                          {it.name}
                          {it.qty ? ` x${it.qty}` : ""}
                          {it.unit ? ` ${it.unit}` : ""}
                        </span>
                        <button
                          className="mp-icon-btn mp-icon-del"
                          aria-label={`Remove ${it.name}`}
                          onClick={() => removeParsedItem(idx)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <footer className="mp-modal-foot">
              <button className="mp-btn ghost" onClick={closeScan}>Cancel</button>
              <button
                className="mp-btn primary"
                disabled={!parsed.length}
                onClick={addParsedToPantry}
              >
                Add to Pantry
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
