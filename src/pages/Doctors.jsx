// src/pages/Doctors.jsx
const doctors = [
    {
      name: "Dr. Sarah Williams",
      specialty: "Cardiology",
      years: 12,
      rating: 4.9,
    },
    {
      name: "Dr. Omar Khaled",
      specialty: "Internal Medicine",
      years: 9,
      rating: 4.8,
    },
    {
      name: "Dr. Lina Haddad",
      specialty: "Endocrinology",
      years: 7,
      rating: 4.9,
    },
  ];
  
  export default function Doctors() {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Find Doctors</h1>
        <p className="text-slate-600 mb-6 max-w-xl">
          Browse a sample list of our trusted doctors. In a future backend phase,
          this page will pull real data from the database.
        </p>
  
        <div className="grid gap-6 md:grid-cols-3">
          {doctors.map((d) => (
            <div
              key={d.name}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-md transition"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-sky-300 to-blue-400 flex items-center justify-center text-white font-semibold text-xl mb-3">
                {d.name.split(" ")[1][0]}
              </div>
              <h2 className="font-semibold text-slate-900 text-sm mb-1">
                {d.name}
              </h2>
              <p className="text-xs text-slate-500 mb-1">{d.specialty}</p>
              <p className="text-xs text-slate-500 mb-3">
                {d.years} years experience
              </p>
              <div className="text-xs text-amber-500 font-semibold">
                ⭐ {d.rating} rating
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  