// src/pages/DoctorProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getToken, onAuthChanged } from "../lib/auth.js";

const API = "http://localhost:5000";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border bg-slate-50 text-slate-700 border-slate-100">
      {children}
    </span>
  );
}

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dt);
  }
}

export default function DoctorProfile() {
  const { doctorId } = useParams();

  // ✅ token comes from shared auth lib and updates on login/logout
  const [token, setTokenState] = useState(() => getToken());
  useEffect(() => {
    const unsub = onAuthChanged(() => setTokenState(getToken()));
    return unsub;
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState(null);

  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsErr, setSlotsErr] = useState("");
  const [slots, setSlots] = useState([]);

  // booking state
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [mode, setMode] = useState("ONLINE");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookErr, setBookErr] = useState("");
  const [bookOk, setBookOk] = useState("");

  async function loadDoctor() {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/public/doctors/${doctorId}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to load doctor");
      setDoc(j.data);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots() {
    setSlotsErr("");
    setSlotsLoading(true);
    try {
      const r = await fetch(`${API}/api/public/doctors/${doctorId}/slots`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to load slots");
      setSlots(j.data || []);
    } catch (e) {
      setSlotsErr(String(e.message || e));
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      await Promise.all([loadDoctor(), loadSlots()]);
      if (!alive) return;
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  async function bookAppointment() {
    setBookErr("");
    setBookOk("");

    if (!selectedSlotId) {
      setBookErr("Please select a slot first.");
      return;
    }

    if (!token) {
      setBookErr("You must be logged in as a patient to book.");
      return;
    }

    setBooking(true);
    try {
      const payload = {
        doctor_id: Number(doctorId),
        slot_id: Number(selectedSlotId),
        mode,
        patient_notes: notes.trim() || "",
      };

      const r = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.ok) {
        if (r.status === 401) throw new Error("Please login to book.");
        if (r.status === 403)
          throw new Error("Only PATIENT accounts can book.");
        if (r.status === 409)
          throw new Error("This slot was just booked. Pick another one.");
        throw new Error(j.error || "Booking failed");
      }

      setBookOk(`Booked ✅ ${fmt(j.appointment_at)}`);
      setSelectedSlotId(null);
      setNotes("");
      setMode("ONLINE");

      // refresh slots so booked one disappears
      await loadSlots();
    } catch (e) {
      setBookErr(String(e.message || e));
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
          <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
          <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-1/2 bg-slate-200 rounded mb-6" />
          <div className="h-24 w-full bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/doctors" className="text-sm text-sky-700 hover:underline">
          ← Back to doctors
        </Link>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/doctors" className="text-sm text-sky-700 hover:underline">
          ← Back to doctors
        </Link>
        <div className="mt-4 text-slate-600">Doctor not found.</div>
      </div>
    );
  }

  const initial =
    (doc.full_name || "D").split(" ")[1]?.[0] ||
    (doc.full_name || "D")[0] ||
    "D";

  const selectedSlot = slots.find(
    (s) => Number(s.slot_id) === Number(selectedSlotId)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/doctors" className="text-sm text-sky-700 hover:underline">
        ← Back to doctors
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Left: doctor card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-sky-300 to-blue-400 flex items-center justify-center text-white font-semibold text-xl">
              {initial}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {doc.full_name}
                {doc.is_verified ? (
                  <span className="ml-3 text-sm text-emerald-600 font-semibold">
                    • Verified
                  </span>
                ) : null}
              </h1>

              <p className="text-slate-600 mt-1">{doc.title || "Doctor"}</p>

              <div className="mt-3 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                <span>{doc.years_experience ?? 0} years experience</span>
                <span>Country: {doc.country || "—"}</span>
                <span>Fee: {doc.consultation_fee ?? "—"}</span>
                <span>
                  ⭐ {Number(doc.rating || 0).toFixed(1)} (
                  {doc.rating_count || 0})
                </span>
              </div>

              {doc.bio ? (
                <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                  {doc.bio}
                </p>
              ) : null}

              <div className="mt-5">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Specialties
                </div>
                <div className="flex flex-wrap gap-2">
                  {(doc.specialties || []).map((s) => (
                    <Pill key={s.specialty_id}>{s.name}</Pill>
                  ))}
                  {!doc.specialties?.length && <Pill>—</Pill>}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Languages
                </div>
                <div className="flex flex-wrap gap-2">
                  {(doc.languages || []).map((l) => (
                    <Pill key={l.language_id}>{l.name}</Pill>
                  ))}
                  {!doc.languages?.length && <Pill>—</Pill>}
                </div>
              </div>
            </div>
          </div>

          {/* Slots list */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Available slots
              </h2>
              <button
                onClick={loadSlots}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Refresh
              </button>
            </div>

            {slotsErr ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {slotsErr}
              </div>
            ) : slotsLoading ? (
              <div className="mt-3 text-sm text-slate-500">Loading slots…</div>
            ) : slots.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {slots.slice(0, 14).map((s) => {
                  const active = Number(selectedSlotId) === Number(s.slot_id);
                  return (
                    <button
                      key={s.slot_id}
                      onClick={() => {
                        setBookErr("");
                        setBookOk("");
                        setSelectedSlotId(s.slot_id);
                      }}
                      className={`text-left px-4 py-3 rounded-xl border transition ${
                        active
                          ? "border-sky-400 bg-sky-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {fmt(s.start_at)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Ends: {fmt(s.end_at)}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                No upcoming slots right now.
              </div>
            )}
          </div>
        </div>

        {/* Right: booking box */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900">Book appointment</h2>
          <p className="text-sm text-slate-600 mt-1">
            Select a slot, choose consultation type, then confirm.
          </p>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Selected slot
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              {selectedSlot ? (
                <>
                  <div className="font-semibold text-slate-900">
                    {fmt(selectedSlot.start_at)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Ends: {fmt(selectedSlot.end_at)}
                  </div>
                </>
              ) : (
                <span className="text-slate-500">No slot selected</span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Mode
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("ONLINE")}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold ${
                  mode === "ONLINE"
                    ? "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                Online
              </button>
              <button
                type="button"
                onClick={() => setMode("IN_PERSON")}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold ${
                  mode === "IN_PERSON"
                    ? "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                In person
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Notes (optional)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. headache for 3 days, worse in mornings…"
              rows={4}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          {bookErr ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {bookErr}
            </div>
          ) : null}

          {bookOk ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {bookOk}
            </div>
          ) : null}

          {!token ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You’re not logged in. Login as a <b>PATIENT</b> to book.
            </div>
          ) : null}

          <button
            onClick={bookAppointment}
            disabled={booking || !token}
            className={`mt-5 w-full px-4 py-3 rounded-xl font-semibold text-white transition ${
              booking || !token
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {booking ? "Booking..." : "Confirm booking"}
          </button>

          {selectedSlotId ? (
            <button
              type="button"
              onClick={() => {
                setSelectedSlotId(null);
                setBookErr("");
                setBookOk("");
              }}
              className="mt-3 w-full px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
            >
              Clear selection
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
