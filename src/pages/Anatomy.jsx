// src/pages/Anatomy.jsx
import { useState } from "react";
import HeartModel from "../components/HeartModel";
import LungsModel from "../components/LungsModel";

export default function Anatomy() {
  const [tab, setTab] = useState("heart");

  return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* SIDEBAR */}
      <div className="w-64 hidden lg:block bg-white shadow rounded-2xl p-5 h-max sticky top-24">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Organs</h2>
        <ul className="space-y-2 text-sm">
          <li
            className="cursor-pointer hover:text-sky-600"
            onClick={() => setTab("heart")}
          >
            ❤️ Heart
          </li>
          <li
            className="cursor-pointer hover:text-sky-600"
            onClick={() => setTab("lungs")}
          >
            🫁 Lungs
          </li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 text-center">
          3D Anatomy Viewer
        </h1>

        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-8 text-sm">
          Explore interactive 3D models of the human body. Rotate, zoom, and
          study each organ from any angle.
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setTab("heart")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === "heart"
                ? "bg-sky-500 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ❤️ Heart
          </button>

          <button
            onClick={() => setTab("lungs")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === "lungs"
                ? "bg-sky-500 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            🫁 Lungs
          </button>
        </div>

        {/* Viewer */}
        <div className="rounded-3xl overflow-hidden shadow-xl max-w-3xl mx-auto bg-white p-2">
          {tab === "heart" && <HeartModel />}
          {tab === "lungs" && <LungsModel />}
        </div>
      </div>
    </div>
  );
}
