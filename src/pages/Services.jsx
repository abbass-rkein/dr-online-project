// src/pages/Services.jsx
import {
  BookOpen,
  MessageCircle,
  UserSearch,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";

export default function Services() {
  const services = [
    {
      title: "Evidence-Based Articles",
      desc: "Doctors share simplified explanations of the latest studies and guidelines for common conditions.",
      icon: <BookOpen size={26} className="text-sky-600" />,
    },
    {
      title: "Doctor–Patient Discussions",
      desc: "Open topics where patients can ask questions and doctors provide general educational responses.",
      icon: <MessageCircle size={26} className="text-sky-600" />,
    },
    {
      title: "Find the Right Doctor",
      desc: "Browse verified doctors by specialty, language, and experience.",
      icon: <UserSearch size={26} className="text-sky-600" />,
    },
    {
      title: "Appointment Booking",
      desc: "Schedule online or in-person visits with a few clicks (future backend feature).",
      icon: <CalendarCheck size={26} className="text-sky-600" />,
    },
    {
      title: "Secure Health Space",
      desc: "A private area for you to keep notes and track your symptoms (future expansion).",
      icon: <ShieldCheck size={26} className="text-sky-600" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Services & Features
      </h1>

      <p className="text-slate-600 mb-6 max-w-2xl">
        Dr.Online offers a clean, friendly medical interface inspired by the
        prototype you selected. These tools help patients learn, connect, and
        manage their healthcare journey.
      </p>

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.title}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:-translate-y-1 hover:shadow-lg transition group"
          >
            {/* Icon Wrapper */}
            <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center mb-4 group-hover:bg-sky-200 transition">
              {s.icon}
            </div>

            <h2 className="font-semibold text-slate-900 mb-2 text-base">
              {s.title}
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
