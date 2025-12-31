import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../lib/auth.js";
import { Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

const API = "http://localhost:5000";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border bg-slate-50 text-slate-700 border-slate-100">
      {children}
    </span>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          "h-7 w-7 rounded-full border flex items-center justify-center text-xs font-bold",
          done
            ? "bg-emerald-600 border-emerald-600 text-white"
            : active
            ? "bg-sky-600 border-sky-600 text-white"
            : "bg-white border-slate-200 text-slate-500",
        ].join(" ")}
      >
        {done ? "✓" : label}
      </div>
    </div>
  );
}

export default function AdminDoctors() {
  const token = useMemo(() => getToken(), []);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [specialties, setSpecialties] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  // wizard step: 0 specialties, 1 info, 2 languages
  const [step, setStep] = useState(0);

  const emptyForm = {
    full_name: "",
    email: "",
    password: "123",
    phone: "",
    country: "LB",
    title: "",
    bio: "",
    years_experience: 0,
    is_verified: true,
    consultation_fee: "",
    specialty_ids: [],
    language_ids: [],
  };
  const [form, setForm] = useState(emptyForm);

  async function loadMeta() {
    const [s, l] = await Promise.all([
      fetch(`${API}/api/meta/specialties`).then((r) => r.json()),
      fetch(`${API}/api/meta/languages`).then((r) => r.json()),
    ]);
    if (s?.ok) setSpecialties(s.data || []);
    if (l?.ok) setLanguages(l.data || []);
  }

  async function load(nextPage = page, nextQ = q) {
    setErr("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (String(nextQ).trim()) qs.set("q", String(nextQ).trim());
      qs.set("page", String(nextPage));
      qs.set("limit", "10");

      const r = await fetch(`${API}/api/admin/doctors?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to load doctors");

      setRows(j.data || []);
      setTotalPages(j.totalPages || 1);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openCreate() {
    setErr("");
    setEdit(null);
    setForm(emptyForm);
    setStep(0);
    setOpen(true);
  }

  function openEdit(d) {
    setErr("");
    setEdit(d);
    setForm({
      full_name: d.full_name || "",
      email: d.email || "",
      password: "", // not used in edit
      phone: d.phone || "",
      country: d.country || "LB",
      title: d.title || "",
      bio: d.bio || "",
      years_experience: d.years_experience ?? 0,
      is_verified: !!d.is_verified,
      consultation_fee: d.consultation_fee ?? "",
      specialty_ids: (d.specialties || []).map((x) => x.specialty_id),
      language_ids: (d.languages || []).map((x) => x.language_id),
    });
    setStep(0);
    setOpen(true);
  }

  function toggleId(list, id) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function validateCurrentStep() {
    // keep it light: only enforce essentials
    if (step === 0) {
      if (!form.specialty_ids.length) return "Pick at least 1 specialty.";
    }
    if (step === 1) {
      if (!String(form.full_name).trim()) return "Full name is required.";
      if (!edit && !String(form.email).trim()) return "Email is required.";
      if (String(form.email).trim() && !String(form.email).includes("@"))
        return "Enter a valid email.";
      if (!edit && !String(form.password || "").trim())
        return "Password is required.";
    }
    if (step === 2) {
      if (!form.language_ids.length) return "Pick at least 1 language.";
    }
    return "";
  }

  function nextStep() {
    const v = validateCurrentStep();
    if (v) {
      setErr(v);
      return;
    }
    setErr("");
    setStep((s) => Math.min(2, s + 1));
  }

  function prevStep() {
    setErr("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function save() {
    setErr("");
    // final validation (all steps)
    const v0 = (() => {
      if (!form.specialty_ids.length) return "Pick at least 1 specialty.";
      if (!String(form.full_name).trim()) return "Full name is required.";
      if (!String(form.email).trim() && !edit) return "Email is required.";
      if (String(form.email).trim() && !String(form.email).includes("@"))
        return "Enter a valid email.";
      if (!edit && !String(form.password || "").trim())
        return "Password is required.";
      if (!form.language_ids.length) return "Pick at least 1 language.";
      return "";
    })();
    if (v0) {
      setErr(v0);
      // jump user to relevant step
      if (v0.includes("specialty")) setStep(0);
      else if (v0.includes("language")) setStep(2);
      else setStep(1);
      return;
    }

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        country: form.country || null,
        title: form.title || null,
        bio: form.bio || null,
        years_experience: Number(form.years_experience || 0),
        is_verified: !!form.is_verified,
        consultation_fee:
          form.consultation_fee === "" ? null : Number(form.consultation_fee),
        specialty_ids: form.specialty_ids,
        language_ids: form.language_ids,
      };

      let url = `${API}/api/admin/doctors`;
      let method = "POST";

      if (edit) {
        url = `${API}/api/admin/doctors/${edit.doctor_id}`;
        method = "PUT";
      } else {
        payload.password = form.password || "123";
      }

      const r = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Save failed");

      setOpen(false);
      await load(1, q);
      setPage(1);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create doctors (users + profiles) and manage specialties/languages.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 w-full md:w-auto"
        >
          <Plus size={16} /> Add Doctor
        </button>
      </div>

      {err && !open && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      <div className="mt-6 relative w-full md:max-w-[520px]">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, title…"
          className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            Loading…
          </div>
        ) : rows.length ? (
          rows.map((d) => (
            <div
              key={d.doctor_id}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">
                    {d.full_name}{" "}
                    {d.is_verified ? (
                      <span className="text-xs text-emerald-600 font-semibold">
                        • Verified
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.email} {d.title ? `• ${d.title}` : ""}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{d.country || "—"}</Pill>
                    <Pill>{d.years_experience ?? 0} yrs</Pill>
                    <Pill>Fee: {d.consultation_fee ?? "—"}</Pill>
                    <Pill>
                      ⭐ {d.rating ?? 0} ({d.rating_count ?? 0})
                    </Pill>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(d.specialties || []).slice(0, 4).map((s) => (
                      <Pill key={s.specialty_id}>{s.name}</Pill>
                    ))}
                    {(d.specialties || []).length > 4 && (
                      <Pill>+{d.specialties.length - 4} more</Pill>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openEdit(d)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50 w-full md:w-auto"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            No doctors.
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center mt-6 gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`w-full md:w-auto px-4 py-2 rounded-lg border ${
            page === 1
              ? "bg-slate-100 text-slate-400"
              : "bg-white hover:bg-slate-50"
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
          className={`w-full md:w-auto px-4 py-2 rounded-lg border ${
            page === totalPages
              ? "bg-slate-100 text-slate-400"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          Next
        </button>
      </div>

      {/* Modal Wizard */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-100 shadow-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900">
                  {edit ? "Edit Doctor" : "Add Doctor"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Step {step + 1} of 3 •{" "}
                  {step === 0
                    ? "Pick specialties"
                    : step === 1
                    ? "Fill doctor info"
                    : "Pick languages"}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <StepDot active={step === 0} done={step > 0} label="1" />
                  <div className="h-px w-10 bg-slate-200" />
                  <StepDot active={step === 1} done={step > 1} label="2" />
                  <div className="h-px w-10 bg-slate-200" />
                  <StepDot active={step === 2} done={false} label="3" />
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="mt-5">
              {/* STEP 1: Specialties */}
              {step === 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Choose specialties
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select one or more. You can change this later.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {specialties.map((s) => (
                      <button
                        key={s.specialty_id}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            specialty_ids: toggleId(
                              form.specialty_ids,
                              s.specialty_id
                            ),
                          })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                          form.specialty_ids.includes(s.specialty_id)
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {!!form.specialty_ids.length && (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Selected
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.specialty_ids.map((id) => {
                          const s = specialties.find(
                            (x) => x.specialty_id === id
                          );
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs"
                            >
                              {s?.name || `#${id}`}
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    specialty_ids: form.specialty_ids.filter(
                                      (x) => x !== id
                                    ),
                                  })
                                }
                                className="text-slate-400 hover:text-slate-700"
                                aria-label="remove"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Info */}
              {step === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full name
                    </label>
                    <input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({ ...form, full_name: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      value={form.email}
                      disabled={!!edit}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                    />
                  </div>

                  {!edit && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Password (dev)
                      </label>
                      <input
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Country (ISO2)
                    </label>
                    <input
                      value={form.country}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          country: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Title
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={(e) =>
                        setForm({ ...form, bio: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Years experience
                    </label>
                    <input
                      type="number"
                      value={form.years_experience}
                      onChange={(e) =>
                        setForm({ ...form, years_experience: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Consultation fee
                    </label>
                    <input
                      type="number"
                      value={form.consultation_fee}
                      onChange={(e) =>
                        setForm({ ...form, consultation_fee: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      id="verified"
                      type="checkbox"
                      checked={!!form.is_verified}
                      onChange={(e) =>
                        setForm({ ...form, is_verified: e.target.checked })
                      }
                    />
                    <label
                      htmlFor="verified"
                      className="text-sm text-slate-700"
                    >
                      Verified doctor
                    </label>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Selected specialties
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.specialty_ids.length ? (
                        form.specialty_ids.map((id) => {
                          const s = specialties.find(
                            (x) => x.specialty_id === id
                          );
                          return <Pill key={id}>{s?.name || `#${id}`}</Pill>;
                        })
                      ) : (
                        <span className="text-xs text-slate-500">
                          None selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Languages */}
              {step === 2 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Choose languages
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select one or more.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {languages.map((l) => (
                      <button
                        key={l.language_id}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            language_ids: toggleId(
                              form.language_ids,
                              l.language_id
                            ),
                          })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                          form.language_ids.includes(l.language_id)
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>

                  {!!form.language_ids.length && (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Selected
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.language_ids.map((id) => {
                          const l = languages.find((x) => x.language_id === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs"
                            >
                              {l?.name || `#${id}`}
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    language_ids: form.language_ids.filter(
                                      (x) => x !== id
                                    ),
                                  })
                                }
                                className="text-slate-400 hover:text-slate-700"
                                aria-label="remove"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">
                      Summary
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Name</span>
                        <span className="font-semibold">
                          {form.full_name || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Email</span>
                        <span className="font-semibold">
                          {form.email || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Specialties</span>
                        <span className="font-semibold">
                          {form.specialty_ids.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Languages</span>
                        <span className="font-semibold">
                          {form.language_ids.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error inside modal */}
            {err && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {err}
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-5 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2">
              <button
                onClick={() => setOpen(false)}
                className="w-full md:w-auto rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <div className="flex w-full md:w-auto gap-2 justify-end">
                <button
                  onClick={prevStep}
                  disabled={step === 0}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border w-full md:w-auto ${
                    step === 0
                      ? "bg-slate-100 text-slate-400 border-slate-200"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                {step < 2 ? (
                  <button
                    onClick={nextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 text-white px-5 py-2 text-sm font-semibold hover:opacity-90 w-full md:w-auto"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={save}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 text-white px-5 py-2 text-sm font-semibold hover:opacity-90 w-full md:w-auto"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
