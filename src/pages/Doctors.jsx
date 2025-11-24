// src/pages/Doctors.jsx
import { useState } from "react";

const doctors = [
  { name: "Dr. Sarah Williams", specialty: "Cardiology", years: 12, rating: 4.9 },
  { name: "Dr. Omar Khaled", specialty: "Internal Medicine", years: 9, rating: 4.8 },
  { name: "Dr. Lina Haddad", specialty: "Endocrinology", years: 7, rating: 4.9 },

  { name: "Dr. John Parker", specialty: "Neurology", years: 11, rating: 4.7 },
  { name: "Dr. Maria Lopez", specialty: "Dermatology", years: 6, rating: 4.8 },
  { name: "Dr. Ahmed Nour", specialty: "Orthopedics", years: 14, rating: 4.6 },
  { name: "Dr. Hana Youssef", specialty: "Pediatrics", years: 5, rating: 4.9 },
  { name: "Dr. Karim Abbas", specialty: "Surgery", years: 10, rating: 4.7 },
  { name: "Dr. Rita Nassar", specialty: "Family Medicine", years: 8, rating: 4.8 },
  { name: "Dr. Faisal Rahman", specialty: "Urology", years: 9, rating: 4.7 },
];

export default function Doctors() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const PER_PAGE = 10;

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const paginated = filtered.slice(start, start + PER_PAGE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Find Doctors</h1>

      <p className="text-slate-600 mb-6 max-w-xl">
        Browse our trusted doctors. You can search by name or specialty.  
        In the future, this page will load real data from the backend.
      </p>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search doctor or specialty..."
          value={search}
          onChange={handleSearch}
          className="w-full md:w-1/2 p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {paginated.map((d) => (
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

      <div className="flex justify-center mt-8 gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg border ${
            page === 1 ? "bg-slate-100 text-slate-400" : "bg-white hover:bg-slate-50"
          }`}
        >
          Prev
        </button>

        <span className="px-4 py-2 text-slate-700 font-semibold">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-lg border ${
            page === totalPages
              ? "bg-slate-100 text-slate-400"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
