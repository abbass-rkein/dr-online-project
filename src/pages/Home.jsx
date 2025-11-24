// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Blue gradient background */}
        <div className="absolute inset-0 bg-liner-to-br from-sky-500 via-sky-600 to-blue-700 -z-10" />

        {/* Slanted white card like Figma */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 md:pt-24 md:pb-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text side */}
            <div className="space-y-6">
              <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-wide">
                Heal smarter, not harder
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Your trusted partner
                <br />
                <span className="text-sky-100">in digital healthcare.</span>
              </h1>

              <p className="text-sm sm:text-base text-sky-100/90 max-w-xl">
                Connect with certified doctors, follow the latest medical
                evidence, and discuss health topics with a trusted community –
                anytime, anywhere.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center rounded-full bg-white text-sky-600 font-semibold text-sm px-6 py-2.5 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-transform duration-200"
                >
                  Book an appointment
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 text-white font-semibold text-sm px-6 py-2.5 hover:bg-white/10 transition"
                >
                  Learn more
                </Link>
              </div>

              {/* Trusted by logos (placeholder) */}
              <div className="pt-4">
                <p className="text-xs uppercase tracking-wide text-sky-100/80 mb-3">
                  Trusted by patients worldwide
                </p>
                <div className="flex gap-4 items-center text-sky-100/80 text-xs">
                  <span>Apple</span>
                  <span>Google</span>
                  <span>Microsoft</span>
                  <span>Spotify</span>
                </div>
              </div>
            </div>

            {/* Right side – Doctor card */}
            <div className="relative">
              {/* Main card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform rotate-3 md:rotate-2 hover:rotate-0 transition-transform duration-300">
                {/* Circle behind image */}
                <div className="absolute -top-10 -right-10 h-40 w-40 bg-sky-100 rounded-full -z-10" />

                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Fake doctor image placeholder */}
                  <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-sky-300 to-blue-400 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    Dr
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">
                      Dr. Sarah Williams
                    </h3>
                    <p className="text-xs text-slate-500">
                      Consultant Cardiologist • 12 yrs experience
                    </p>
                  </div>

                  {/* Rating badge */}
                  <div className="flex items-center gap-3 bg-sky-50 rounded-2xl px-4 py-2">
                    <div className="flex -space-x-2">
                      <div className="h-6 w-6 rounded-full bg-slate-300 border-2 border-white" />
                      <div className="h-6 w-6 rounded-full bg-slate-300 border-2 border-white" />
                      <div className="h-6 w-6 rounded-full bg-slate-300 border-2 border-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-slate-800">
                        2400+ Happy Patients
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Rated 4.9/5 overall care
                      </p>
                    </div>
                  </div>

                  {/* Tag chips */}
                  <div className="flex flex-wrap gap-2 justify-center text-[11px]">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      Easy appointment booking
                    </span>
                    <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700">
                      Evidence-based advice
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating mini card */}
              <div className="absolute -left-4 bottom-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 animate-bounce">
                <div className="h-8 w-8 rounded-full bg-sky-500/10 flex items-center justify-center">
                  <span className="text-sky-600 text-lg">🩺</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Live doctor support
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Response in under 15 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* White curve bottom */}
        <div className="h-16 bg-slate-50 -mt-8 rounded-t-[40px]" />
      </section>

      {/* 3 steps section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          Easily book an appointment in 3 simple steps
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "1. Describe your concern",
              text: "Tell us what you're feeling in simple language.",
            },
            {
              title: "2. Match with a doctor",
              text: "We connect you to a specialist that fits your needs.",
            },
            {
              title: "3. Confirm your time",
              text: "Pick a slot that works for you and start your visit.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-1 transition"
            >
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
