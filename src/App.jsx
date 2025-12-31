import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Services from "./pages/Services.jsx";
import Doctors from "./pages/Doctors.jsx";
import Contact from "./pages/Contact.jsx";
import Anatomy from "./pages/Anatomy.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";
import Auth from "./pages/Auth.jsx";
import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminDoctors from "./pages/admin/AdminDoctors.jsx";
import AdminSpecialties from "./pages/admin/AdminSpecialties";
import AdminLanguages from "./pages/admin/AdminLanguages.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/anatomy" element={<Anatomy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
          <Route path="/appointments" element={<MyAppointments />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="specialties" element={<AdminSpecialties />} />
            <Route path="languages" element={<AdminLanguages />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
