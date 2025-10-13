import React from "react";
import "./App.css"; // optional, if you have it

export default function Home({ onNavigate }) {
  return (
    <section className="bg-[#f9f4ed] min-h-screen flex flex-col md:flex-row items-center justify-center px-8 md:px-16">
      {/* Left Section */}
      <div className="max-w-xl md:w-1/2 space-y-6">
        {/* Logo */}
        <h1 className="text-5xl font-bold font-serif text-gray-900">
          <span className="border-b-4 border-blue-500 pb-1">Savr</span>
        </h1>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          Never Worry About What to Make for Your Next Meal Again
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-base leading-relaxed">
          Tired of spending hours planning your meals for the week?
          <br />
          That’s why we created Savr — the AI kitchen companion that turns your
          ingredients into instant, delicious recipes made just for you.
        </p>

        {/* Button */}
        <button
          className="bg-[#f86842] hover:bg-[#e35732] text-white font-semibold py-3 px-6 rounded-md transition-all duration-200"
          onClick={() => onNavigate("meal-plan")}
        >
          Start Planning
        </button>
      </div>

      {/* Right Section */}
      <div className="mt-10 md:mt-0 md:w-1/2 flex justify-center">
        <img
          src="/laptop-mockup.jpg"
          alt="Savr app preview"
          className="w-[90%] md:w-[80%] drop-shadow-xl"
        />
      </div>
    </section>
  );
}
