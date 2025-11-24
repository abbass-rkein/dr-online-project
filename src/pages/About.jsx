// src/pages/About.jsx
import { HeartPulse, Users, ShieldCheck, Stethoscope } from "lucide-react";

export default function About() {
  return (
    <div className="bg-slate-50 pb-16">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-sky-600 to-blue-700 text-white py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            About Dr.Online
          </h1>
          <p className="max-w-2xl text-sm sm:text-base opacity-90">
            Your trusted digital healthcare companion — bringing doctors, medical
            knowledge, and safe patient communication together in one modern
            platform.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Mission */}
          <div className="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <HeartPulse className="text-sky-600" size={22} />
              <h2 className="font-semibold text-slate-900 text-lg">Our Mission</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              To empower people with reliable, evidence-based healthcare
              information and to give doctors a clean, modern space where they can
              educate, guide, and support patients beyond traditional clinic walls.
            </p>
          </div>

          {/* Why Dr.Online */}
          <div className="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-sky-600" size={22} />
              <h2 className="font-semibold text-slate-900 text-lg">Why Dr.Online?</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              We prioritize clarity, safety, and accessibility. Every part of the
              platform is designed to reduce stress, shorten waiting times, and
              bring patients closer to reliable medical advice — anytime,
              anywhere.
            </p>
          </div>
        </div>

        {/* VALUES SECTION */}
        <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6 text-center">
          What We Stand For
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition">
            <Users className="mx-auto mb-3 text-sky-600" size={28} />
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">Community First</h3>
            <p className="text-xs text-slate-600">
              A safe place for patients and doctors to connect respectfully.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition">
            <Stethoscope className="mx-auto mb-3 text-sky-600" size={28} />
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">
              Verified Doctors
            </h3>
            <p className="text-xs text-slate-600">
              Every doctor is authenticated for your confidence and safety.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition">
            <ShieldCheck className="mx-auto mb-3 text-sky-600" size={28} />
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">
              Evidence-Based Care
            </h3>
            <p className="text-xs text-slate-600">
              All shared knowledge follows modern research and medical guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
