// src/pages/About.jsx
export default function About() {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          About Dr.Online
        </h1>
        <p className="text-slate-600 mb-4">
          Dr.Online is a digital healthcare platform that connects patients,
          doctors, and medical knowledge in one trusted space. Our goal is to make
          evidence-based medicine accessible, understandable, and actionable for
          everyone.
        </p>
  
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900 mb-2">Our Mission</h2>
            <p className="text-sm text-slate-600">
              Empower patients with accurate, up-to-date information and provide
              doctors with tools to share research, discuss cases, and support
              their communities beyond the hospital walls.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900 mb-2">Why Dr.Online?</h2>
            <p className="text-sm text-slate-600">
              We focus on clarity, safety, and community. Every feature is built
              to reduce anxiety, shorten waiting times, and keep patients closer
              to reliable medical advice.
            </p>
          </div>
        </div>
      </div>
    );
  }
  