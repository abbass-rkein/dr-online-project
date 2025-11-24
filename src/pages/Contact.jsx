// src/pages/Contact.jsx
export default function Contact() {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-slate-600 mb-6">
          Have a question about Dr.Online or want to collaborate? Send us a
          message and we&apos;ll get back to you soon.
        </p>
  
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <form className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
  
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
  
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Message
              </label>
              <textarea
                rows="4"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              ></textarea>
            </div>
  
            <button
              type="submit"
              className="inline-flex justify-center rounded-full bg-sky-500 text-white font-semibold text-sm px-6 py-2.5 shadow-md hover:bg-sky-600 hover:-translate-y-0.5 transition"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    );
  }
  