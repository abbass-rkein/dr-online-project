// src/components/Footer.jsx
export default function Footer() {
    return (
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-3 text-sm">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Dr.Online</h3>
            <p className="text-slate-500">
              Your trusted partner in modern, digital healthcare.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Quick Links</h4>
            <ul className="space-y-1 text-slate-500">
              <li>Find Doctors</li>
              <li>Patient Community</li>
              <li>Research Hub</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Contact</h4>
            <p className="text-slate-500">
              support@dronline.com
              <br />
              Available 24/7 for urgent questions.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Dr.Online. All rights reserved.
        </div>
      </footer>
    );
  }
  