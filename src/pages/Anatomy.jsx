// src/pages/Anatomy.jsx
import { useState } from "react";
import HeartModel from "../components/HeartModel";
import LungsModel from "../components/LungsModel";
import BrainModel from "../components/BrainModel";
import BodyModel from "../components/BodyModel";

import { Heart, Brain, Wind, User } from "lucide-react"; // Icons

export default function Anatomy() {
  const [tab, setTab] = useState("heart");

  const descriptions = {
    heart: "The heart pumps blood throughout the body, providing oxygen and nutrients.",
    lungs: "The lungs allow the exchange of oxygen and carbon dioxide during breathing.",
    brain: "The brain controls movement, emotions, memory, and all bodily functions.",
    body: "The full human body model helps you explore all anatomical systems together.",
  };

  return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* SIDEBAR */}
      <div className="w-64 hidden lg:block bg-white shadow rounded-2xl p-5 h-max sticky top-24">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Organs</h2>
        <ul className="space-y-3 text-sm">

          {/* HEART */}
          <li
            onClick={() => setTab("heart")}
            className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg transition 
              ${tab === "heart" ? "bg-sky-100 text-sky-700" : "hover:bg-slate-100"}
            `}
          >
            <Heart size={18} /> Heart
          </li>

          {/* LUNGS */}
          <li
            onClick={() => setTab("lungs")}
            className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg transition 
              ${tab === "lungs" ? "bg-sky-100 text-sky-700" : "hover:bg-slate-100"}
            `}
          >
            <Wind size={18} /> Lungs
          </li>

          {/* BRAIN */}
          <li
            onClick={() => setTab("brain")}
            className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg transition 
              ${tab === "brain" ? "bg-sky-100 text-sky-700" : "hover:bg-slate-100"}
            `}
          >
            <Brain size={18} /> Brain
          </li>

          {/* FULL BODY */}
          <li
            onClick={() => setTab("body")}
            className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg transition 
              ${tab === "body" ? "bg-sky-100 text-sky-700" : "hover:bg-slate-100"}
            `}
          >
            <User size={18} /> Full Body
          </li>

        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 text-center">
          3D Anatomy Viewer
        </h1>

        {/* Dynamic Small Description */}
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-8 text-sm">
          {descriptions[tab]}
        </p>

        {/* MOBILE TABS */}
        <div className="flex justify-center gap-4 mb-8 lg:hidden">
          
          <button
            onClick={() => setTab("heart")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition ${
              tab === "heart"
                ? "bg-sky-500 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Heart size={16} /> Heart
          </button>

          <button
            onClick={() => setTab("lungs")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition ${
              tab === "lungs"
                ? "bg-sky-500 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Wind size={16} /> Lungs
          </button>

          <button
            onClick={() => setTab("brain")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition ${
              tab === "brain"
                ? "bg-sky-500 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Brain size={16} /> Brain
          </button>

          <button
            onClick={() => setTab("body")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition ${
              tab === "body"
                ? "bg-sky-500 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User size={16} /> Body
          </button>

        </div>

        {/* Viewer */}
        <div className="rounded-3xl overflow-hidden shadow-xl max-w-3xl mx-auto bg-white p-2">
          {tab === "heart" && <HeartModel />}
          {tab === "lungs" && <LungsModel />}
          {tab === "brain" && <BrainModel />}
          {tab === "body" && <BodyModel />}
        </div>
      </div>
    </div>
  );
}
