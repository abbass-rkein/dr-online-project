// src/pages/Contact.jsx
import { useState } from "react";
import { getToken } from "../lib/auth.js";

const API = "http://localhost:5000";

export default function Contact() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk(false);
    setLoading(true);

    try {
      const token = getToken(); // optional
      const r = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.ok)
        throw new Error(j.error || "Failed to send message");

      setOk(true);
      setForm({
        full_name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Contact Us</h1>
      <p className="text-slate-600 mb-6">
        Have a question about Dr.Online or want to collaborate? Send us a
        message and we&apos;ll get back to you soon.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="full_name"
              value={form.full_name}
              onChange={onChange}
              required
              placeholder="Full name"
              className="rounded-xl border px-3 py-2 text-sm"
            />
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              required
              type="email"
              placeholder="Email"
              className="rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <input
            name="subject"
            value={form.subject}
            onChange={onChange}
            required
            placeholder="Subject"
            className="rounded-xl border px-3 py-2 text-sm"
          />

          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            required
            rows="4"
            placeholder="Message"
            className="rounded-xl border px-3 py-2 text-sm"
          />

          {err && (
            <div className="text-sm text-rose-600">{err}</div>
          )}

          {ok && (
            <div className="text-sm text-emerald-600">
              Message sent successfully ✅
            </div>
          )}

          <button
            disabled={loading}
            className="rounded-full bg-sky-500 text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
