import { Navigate, Outlet, useNavigate, NavLink } from "react-router-dom";
import { clearToken, getToken, isAdminToken } from "../../lib/auth.js";
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  LogOut,
  Stethoscope,
  Tags,
  Languages as LanguagesIcon,
} from "lucide-react";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-xl transition ${
          isActive
            ? "bg-sky-50 text-sky-700 border border-sky-100"
            : "hover:bg-slate-50 text-slate-700"
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const nav = useNavigate();
  const token = getToken();

  if (!token || !isAdminToken(token)) {
    return <Navigate to="/admin/login" replace />;
  }

  function logout() {
    clearToken();
    nav("/admin/login");
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-fit lg:sticky lg:top-24">
            <div className="px-2 pb-3 border-b border-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Admin Panel
              </p>
              <p className="font-semibold text-slate-900">Dr.Online</p>
            </div>

            <nav className="mt-3 grid gap-2 text-sm">
              <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/users" icon={Users} label="Users" />
              <NavItem
                to="/admin/messages"
                icon={MessageSquareText}
                label="Messages"
              />
              <NavItem to="/admin/doctors" icon={Stethoscope} label="Doctors" />

              <NavItem
                to="/admin/specialties"
                icon={Tags}
                label="Specialties"
              />

              <NavItem
                to="/admin/languages"
                icon={LanguagesIcon}
                label="Languages"
              />

              <button
                onClick={logout}
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-left"
              >
                <LogOut size={18} /> Logout
              </button>
            </nav>
          </aside>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
