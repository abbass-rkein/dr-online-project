// src/pages/Services.jsx
export default function Services() {
    const services = [
      {
        title: "Evidence-Based Articles",
        desc: "Doctors share simplified explanations of the latest studies and guidelines for common conditions.",
      },
      {
        title: "Doctor–Patient Discussions",
        desc: "Open topics where patients can ask questions and doctors provide general educational responses.",
      },
      {
        title: "Find the Right Doctor",
        desc: "Browse verified doctors by specialty, language, and experience.",
      },
      {
        title: "Appointment Booking",
        desc: "Schedule online or in-person visits with a few clicks (future backend feature).",
      },
      {
        title: "Secure Health Space",
        desc: "A private area for you to keep notes and track your symptoms (future expansion).",
      },
    ];
  
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Services & Features
        </h1>
        <p className="text-slate-600 mb-6 max-w-2xl">
          Dr.Online is designed to work like the Figma prototype you chose: a
          clean, friendly medical interface for learning, booking, and talking to
          healthcare professionals.
        </p>
  
        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:-translate-y-1 hover:shadow-md transition"
            >
              <h2 className="font-semibold text-slate-900 mb-2 text-sm">
                {s.title}
              </h2>
              <p className="text-xs text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  