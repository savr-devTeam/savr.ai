import React from "react";
import "./MealPlan.css";

/* ---------- Inline SVG icons ---------- */
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9Zm-2-5H7v1a1 1 0 1 1-2 0V5H5a1 1 0 0 0-1 1v2h16V6a1 1 0 0 0-1-1h-1V5a1 1 0 1 1-2 0V5Z"/>
  </svg>
);
const DotMenuIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="5" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <circle cx="19" cy="12" r="2" fill="currentColor"/>
  </svg>
);
const SortIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 7h12v2H3V7zm0 10h8v-2H3v2zm0-6h16v-2H3v2z"/></svg>
);
const LightningIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>
);
const ScaleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm-1 3h2v5h4v2h-6V8z"/></svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 5h18v2l-7 7v5l-4 2v-7L3 7V5z"/></svg>
);

/* ---------- UI bits ---------- */
const Pill = ({ children }) => <span className="mp-pill">{children}</span>;

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

/* ---------- Single export with topbar + layout ---------- */
export default function MealPlan() {
  return (
    <>
      {/* Brand header */}
      <header className="mp-topbar">
        <img src="/savricon.png" alt="Logo" className="mp-brand-logo" />
        <div className="mp-brand-name" />
          <span className="pacifico-regular">Savr</span>
      </header>

      {/* Page layout */}
      <div className="mp-root">
        {/* Sidebar */}
        <aside className="mp-sidebar">
          <div className="mp-sidebar-section">
            <h4 className="mp-sidebar-title">Quick Buttons</h4>
            <button className="mp-btn ghost">Clear Week</button>
            <button className="mp-btn ghost">Add New R...</button>
          </div>
          <div className="mp-sidebar-section">
            <h4 className="mp-sidebar-title">Pages</h4>
            <button className="mp-link">🍌 Groceries</button>
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
              <div className="mp-toolbar-spacer" />
              <button className="mp-icon-btn" title="Sort"><SortIcon/></button>
              <button className="mp-icon-btn" title="Quick add"><LightningIcon/></button>
              <button className="mp-icon-btn" title="Scale"><ScaleIcon/></button>
              <button className="mp-icon-btn" title="Filters"><FilterIcon/></button>
              <button className="mp-btn primary">New</button>
              <button className="mp-icon-btn" title="More"><DotMenuIcon/></button>
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
    </>
  );
}
