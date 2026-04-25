import React, { useState, useEffect } from "react";
import {
  Users, Stethoscope, Calendar, CreditCard,
  LogOut, HeartPulse, Pill, Layout, FileText, Database, Clock
} from "lucide-react";
import "./index.css";

const API_BASE_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", role: "patient", name: "", age: "", gender: "Male" });
  const [isLoginView, setIsLoginView] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Patient Data
  const [patientDashboard, setPatientDashboard] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);

  // Doctor Data
  const [doctors, setDoctors] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [doctorConsultations, setDoctorConsultations] = useState([]);
  const [doctorStats, setDoctorStats] = useState({ patients_today: 0, active_admissions: 0, total_appointments: 0 });
  const [allAppointments, setAllAppointments] = useState([]);
  const [activeAdmissions, setActiveAdmissions] = useState([]);

  // Forms
  const [bookForm, setBookForm] = useState({ doctor_id: "", date: "", time: "" });
  const [paymentForm, setPaymentForm] = useState({ bill_id: "", amount: "", method: "UPI" });
  const [prescribeForm, setPrescribeForm] = useState({ consult_id: "", medicine_id: "", dosage: "" });
  const [availForm, setAvailForm] = useState({ date: "", time: "" });
  const [rescheduleForm, setRescheduleForm] = useState({ appointment_id: "", new_date: "", new_time: "" });
  const [admitForm, setAdmitForm] = useState({ patient_id: "", room_no: "" });
  const [dischargeForm, setDischargeForm] = useState({ patient_id: "" });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apiCall = async (endpoint, options = {}) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (user) {
        headers["role"] = user.role;
        headers["user_id"] = user.linked_id;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "API Error");
      return { success: true, data };
    } catch (err) {
      console.error(err);
      alert(err.message);
      return { success: false, error: err.message };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginForm)
    });

    if (res.success && res.data.token) {
      setToken(res.data.token);
      let role = "patient";
      let linked_id = 1;
      try {
        const payload = JSON.parse(atob(res.data.token.split('.')[1]));
        role = payload.role || role;
        linked_id = payload.linked_id || payload.id || linked_id;
      } catch (e) { }

      setUser({ role, username: loginForm.username, linked_id });
      setActiveTab("dashboard");
    } else {
      alert("Login failed! " + (res.error || ""));
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: registerForm.username,
        password: registerForm.password,
        role: registerForm.role,
        name: registerForm.name,
        age: parseInt(registerForm.age),
        gender: registerForm.gender
      })
    });

    if (res.success) {
      alert("Registration successful! You may now login.");
      setIsLoginView(true);
      setLoginForm({ username: registerForm.username, password: "" });
    } else {
      alert("Registration failed: " + res.error);
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setLoginForm({ username: "", password: "" });
    setPatientDashboard([]);
    setAvailableSlots([]);
    setPrescriptions([]);
    setBills([]);
    setDoctors([]);
    setPendingAppointments([]);
    setDoctorProfile(null);
    setDoctorSlots([]);
    setDoctorConsultations([]);
    setDoctorStats({ patients_today: 0, active_admissions: 0, total_appointments: 0 });
    setAllAppointments([]);
    setActiveAdmissions([]);
  };

  // ─── PATIENT FETCHERS ────────────────────────────────────────────

  const fetchPatientDashboard = async () => {
    const res = await apiCall(`/patient/${user.linked_id}/dashboard`);
    if (res.success && res.data.data) {
      setPatientDashboard(res.data.data);
    }
  };

  const fetchAvailableSlots = async () => {
    const res = await apiCall("/availability");
    if (res.success && res.data.data) {
      setAvailableSlots(Array.isArray(res.data.data) ? res.data.data : []);
    }
  };

  const fetchPrescriptions = async () => {
    const res = await apiCall(`/prescription/patient/${user.linked_id}`);
    if (res.success && res.data.data) {
      setPrescriptions(Array.isArray(res.data.data) ? res.data.data : []);
    }
  };

  const fetchBills = async () => {
    const res = await apiCall(`/bill/patient/${user.linked_id}`);
    if (res.success && res.data.data) {
      setBills(Array.isArray(res.data.data) ? res.data.data : []);
    }
  };

  // ─── PATIENT ACTIONS ─────────────────────────────────────────────

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    const formattedDatetime = `${bookForm.date} ${bookForm.time}:00`;
    const res = await apiCall("/appointment/book", {
      method: "POST",
      body: JSON.stringify({
        doctor_id: parseInt(bookForm.doctor_id),
        datetime: formattedDatetime
      })
    });
    if (res.success) {
      alert("Appointment booked successfully!");
      setBookForm({ doctor_id: "", date: "", time: "" });
      fetchPatientDashboard();
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    const res = await apiCall(`/appointment/${id}`, { method: "DELETE" });
    if (res.success) {
      alert("Appointment cancelled!");
      fetchPatientDashboard();
    }
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    const res = await apiCall("/payment/pay", {
      method: "POST",
      body: JSON.stringify({
        bill_id: parseInt(paymentForm.bill_id),
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method
      })
    });
    if (res.success) {
      alert("Payment successful!");
      setPaymentForm({ bill_id: "", amount: "", method: "UPI" });
      fetchPatientDashboard();
      fetchBills();
    }
  };

  // ─── DOCTOR FETCHERS ──────────────────────────────────────────────

  const fetchDoctors = async () => {
    const res = await apiCall("/doctor/list", { method: "GET" });
    if (res.success && res.data.doctors) setDoctors(res.data.doctors);
  };

  const fetchPendingAppointments = async () => {
    const res = await apiCall("/doctor/appointments/pending", { method: "GET" });
    if (res.success && res.data.appointments) setPendingAppointments(res.data.appointments);
  };

  const fetchDoctorProfile = async () => {
    const res = await apiCall("/doctor/profile");
    if (res.success && res.data.data) setDoctorProfile(res.data.data);
  };

  const fetchDoctorSlots = async () => {
    const res = await apiCall("/doctor/availability/mine");
    if (res.success && res.data.data) setDoctorSlots(res.data.data);
  };

  const fetchDoctorConsultations = async () => {
    const res = await apiCall("/doctor/consultations");
    if (res.success && res.data.data) setDoctorConsultations(res.data.data);
  };

  const fetchDoctorStats = async () => {
    const res = await apiCall("/doctor/stats");
    if (res.success && res.data.data) setDoctorStats(res.data.data);
  };

  const fetchAllAppointments = async () => {
    const res = await apiCall("/doctor/appointments/all");
    if (res.success && res.data.data) setAllAppointments(res.data.data);
  };

  const fetchActiveAdmissions = async () => {
    const res = await apiCall("/admission/active");
    if (res.success && res.data.data) setActiveAdmissions(res.data.data);
  };

  // ─── DOCTOR ACTIONS ───────────────────────────────────────────────

  const handleAccept = async (appointment_id) => {
    const res = await apiCall(`/doctor/appointments/${appointment_id}/accept`, { method: "POST" });
    if (res.success) {
      alert("Appointment accepted");
      fetchPendingAppointments();
      fetchDoctorStats();
      fetchAllAppointments();
    } else {
      alert(res.error || "Failed to accept");
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    const { appointment_id, new_date, new_time } = rescheduleForm;
    const new_datetime = `${new_date} ${new_time}:00`;
    const res = await apiCall(`/doctor/appointments/${appointment_id}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ new_datetime })
    });
    if (res.success) {
      alert("Appointment rescheduled");
      setRescheduleForm({ appointment_id: "", new_date: "", new_time: "" });
      fetchPendingAppointments();
      fetchAllAppointments();
    } else {
      alert(res.error || "Reschedule failed");
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    const datetime = `${availForm.date} ${availForm.time}:00`;
    const res = await apiCall("/doctor/availability", {
      method: "POST",
      body: JSON.stringify({ datetime })
    });
    if (res.success) {
      alert("Availability added!");
      setAvailForm({ date: "", time: "" });
      fetchDoctorSlots();
    }
  };

  const handlePrescribe = async (e) => {
    e.preventDefault();
    const res = await apiCall("/doctor/prescribe", {
      method: "POST",
      body: JSON.stringify({
        consult_id: parseInt(prescribeForm.consult_id),
        medicine_id: parseInt(prescribeForm.medicine_id),
        dosage: prescribeForm.dosage
      })
    });
    if (res.success) {
      alert("Prescription issued!");
      setPrescribeForm({ consult_id: "", medicine_id: "", dosage: "" });
      fetchDoctorConsultations();
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    const res = await apiCall("/admission/assign", {
      method: "POST",
      body: JSON.stringify({
        patient_id: parseInt(admitForm.patient_id),
        room_no: parseInt(admitForm.room_no)
      })
    });
    if (res.success) {
      alert("Patient admitted successfully!");
      setAdmitForm({ patient_id: "", room_no: "" });
      fetchActiveAdmissions();
      fetchDoctorStats();
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    const res = await apiCall("/admission/discharge", {
      method: "POST",
      body: JSON.stringify({
        patient_id: parseInt(dischargeForm.patient_id)
      })
    });
    if (res.success) {
      alert("Patient discharged!");
      setDischargeForm({ patient_id: "" });
      fetchActiveAdmissions();
      fetchDoctorStats();
    }
  };

  // ─── DATA LOADING EFFECTS ────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    if (user.role === "patient") {
      fetchDoctors();
      if (activeTab === "dashboard" || activeTab === "appointments") {
        fetchPatientDashboard();
      }
      if (activeTab === "appointments") {
        fetchAvailableSlots();
      }
      if (activeTab === "prescriptions") {
        fetchPrescriptions();
      }
      if (activeTab === "billing") {
        fetchPatientDashboard();
        fetchBills();
      }
    }

    if (user.role === "doctor") {
      if (activeTab === "dashboard") {
        fetchPendingAppointments();
        fetchDoctorStats();
      }
      if (activeTab === "profile") {
        fetchDoctorProfile();
      }
      if (activeTab === "schedule") {
        fetchDoctorSlots();
        fetchAllAppointments();
      }
      if (activeTab === "consultations") {
        fetchDoctorConsultations();
      }
      if (activeTab === "admissions") {
        fetchActiveAdmissions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  // ─── LOGIN / REGISTER SCREEN ─────────────────────────────────────

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ maxWidth: 400 }}>
          <div className="login-card-header">
            <HeartPulse size={48} color="var(--text-primary)" strokeWidth={3} />
            <h2> Hospital_Thing </h2>
          </div>

          <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: 20 }}>
            <button style={{ flex: 1, padding: '10px', background: isLoginView ? 'var(--text-primary)' : 'transparent', color: isLoginView ? 'var(--bg-primary)' : 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsLoginView(true)}>LOGIN</button>
            <button style={{ flex: 1, padding: '10px', background: !isLoginView ? 'var(--text-primary)' : 'transparent', color: !isLoginView ? 'var(--bg-primary)' : 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsLoginView(false)}>REGISTER</button>
          </div>

          {isLoginView ? (
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>IDENTIFIER</label>
                <input
                  type="text" placeholder="USERNAME"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required />
              </div>
              <div className="input-group">
                <label>PASSCODE</label>
                <input
                  type="password" placeholder="PASSWORD"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required />
              </div>
              <button className="btn" type="submit" style={{ width: "100%", marginTop: 16 }} disabled={loading}>
                {loading ? "VERIFYING..." : "ENTER SYSTEM"} <LogOut size={18} />
              </button>
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <p style={{ fontSize: "0.80rem", fontWeight: 600, color: "var(--text-secondary)" }}>OR REGISTER A NEW ACCOUNT.</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label>NEW USERNAME</label>
                <input
                  type="text" placeholder="CHOOSE USERNAME"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  required />
              </div>
              <div className="input-group">
                <label>NEW PASSCODE</label>
                <input
                  type="password" placeholder="CHOOSE PASSWORD"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required />
              </div>
              <div className="input-group">
                <label>FULL NAME</label>
                <input
                  type="text" placeholder="Enter Full Name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required />
              </div>
              <div className="input-group">
                <label>AGE</label>
                <input
                  type="number" placeholder="Enter Age" min="1" max="120"
                  value={registerForm.age}
                  onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                  required />
              </div>
              <div className="input-group">
                <label>GENDER</label>
                <select value={registerForm.gender} onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })} style={{ width: '100%', padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  <option value="Male">MALE</option>
                  <option value="Female">FEMALE</option>
                  <option value="Other">OTHER</option>
                </select>
              </div>
              <button className="btn" type="submit" style={{ width: "100%", marginTop: 16 }} disabled={loading}>
                {loading ? "REGISTERING..." : "CREATE ACCOUNT"}
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // ─── NAV LINKS ───────────────────────────────────────────────────

  const getNavLinks = () => {
    if (user.role === "patient") {
      return [
        { id: "dashboard", label: "DashBoard", icon: HeartPulse },
        { id: "appointments", label: "Appointments", icon: Calendar },
        { id: "prescriptions", label: "Prescriptions", icon: Pill },
        { id: "billing", label: "Bills & Payments", icon: CreditCard }
      ];
    } else {
      return [
        { id: "dashboard", label: "Doctor Dashboard", icon: Stethoscope },
        { id: "profile", label: "My Profile", icon: Users },
        { id: "schedule", label: "My Schedule", icon: Calendar },
        { id: "consultations", label: "Consultations", icon: FileText },
        { id: "admissions", label: "Inpatient Wards", icon: Layout }
      ];
    }
  };

  // ─── MAIN LAYOUT ─────────────────────────────────────────────────

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          {user.role === "doctor" ? <Stethoscope size={28} strokeWidth={3} /> : <HeartPulse size={28} strokeWidth={3} />}
          Hospital_Thing
        </div>
        <nav className="nav-links">
          {getNavLinks().map(mod => (
            <button key={mod.id} className={`nav-item ${activeTab === mod.id ? "active" : ""}`} onClick={() => setActiveTab(mod.id)}>
              <mod.icon size={20} /> {mod.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto" }}>
          <div style={{ paddingBottom: 16, textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <Clock size={20} strokeWidth={2} />
            <div style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
              {`${currentTime.getDate().toString().padStart(2, '0')} ${(currentTime.getMonth() + 1).toString().padStart(2, '0')} ${currentTime.getFullYear()}`}
            </div>
            <div style={{ fontSize: "1.1rem" }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div style={{ borderTop: "2px solid var(--border-color)", paddingTop: 24 }}>
            <button className="btn btn-outline" onClick={logout} style={{ width: "100%" }}>
              <LogOut size={18} /> SIGN OUT
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1>{getNavLinks().find(m => m.id === activeTab)?.label?.toUpperCase()}</h1>
            <p>SECURE PORTAL INTERFACE</p>
          </div>
          <div className="user-profile">
            <div className="user-info">
              <strong>{user.username}</strong>
            </div>
            <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════
            PATIENT — DASHBOARD
            ════════════════════════════════════════════════════════════ */}
        {user.role === "patient" && activeTab === "dashboard" && (
          <div className="grid-cards">
            {patientDashboard.filter(p => p.appointment_datetime).slice(0, 1).map((info, idx) => (
              <div className="solid-card" key={idx}>
                <h3 className="form-header"><FileText size={24} /> NEXT APPOINTMENT</h3>
                <p><strong>Date:</strong> {info.appointment_datetime}</p>
                <p><strong>Doctor:</strong> {info.doctor_name}</p>
                <span className="status-badge" style={{ marginTop: 12, display: "inline-block" }}>UPCOMING</span>
              </div>
            ))}
            {patientDashboard.filter(p => p.appointment_datetime).length === 0 && (
              <div className="solid-card">
                <h3 className="form-header"><FileText size={24} /> NO UPCOMING APPOINTMENTS</h3>
                <p style={{ marginTop: 8 }}>Book an appointment from the Appointments tab.</p>
              </div>
            )}
            <div className="solid-card">
              <h3 className="form-header"><Pill size={24} /> ACTIVE PRESCRIPTIONS</h3>
              {patientDashboard.filter(p => p.medicine).length > 0 ? (
                patientDashboard.filter(p => p.medicine).map((p, idx) => (
                  <p key={idx}>{p.dosage} — {p.medicine}</p>
                ))
              ) : (
                <p style={{ marginTop: 8 }}>No active prescriptions located.</p>
              )}
            </div>
            <div className="solid-card">
              <h3 className="form-header"><CreditCard size={24} /> OUTSTANDING BALANCE</h3>
              <div className="stat-value">${patientDashboard[0]?.total_amount || "0.00"}</div>
              <button className="btn" style={{ marginTop: 16 }} onClick={() => setActiveTab("billing")}>PAY NOW</button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PATIENT — APPOINTMENTS
            ════════════════════════════════════════════════════════════ */}
        {user.role === "patient" && activeTab === "appointments" && (
          <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
            <div className="solid-card">
              <h2 className="form-header">BOOK AN APPOINTMENT</h2>
              <form onSubmit={handleBookAppointment}>
                <div className="input-group">
                  <label>SELECT DOCTOR</label>
                  <select
                    value={bookForm.doctor_id}
                    onChange={e => setBookForm({ ...bookForm, doctor_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}
                  >
                    <option value="">-- Choose a Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.doctor_id} value={d.doctor_id}>Dr. {d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>DATE</label>
                    <input 
                      type="date" 
                      value={bookForm.date} 
                      onChange={e => setBookForm({ ...bookForm, date: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', colorScheme: 'dark' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>TIME</label>
                    <input 
                      type="time" 
                      value={bookForm.time} 
                      onChange={e => setBookForm({ ...bookForm, time: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn" style={{ marginTop: 12 }}>CONFIRM BOOKING</button>
              </form>
            </div>

            {availableSlots.length > 0 && (
              <div className="solid-card">
                <h2 className="form-header">AVAILABLE SLOTS</h2>
                {availableSlots.map((s, idx) => (
                  <div className="list-item" key={idx}>
                    <div>
                      <strong>Dr. {s.doctor_name || s.doctor_id}</strong>
                      <p>Time: {s.available_datetime}</p>
                    </div>
                    <button className="btn btn-outline" onClick={() => {
                      const dt = s.available_datetime ? s.available_datetime.split(' ') : [];
                      setBookForm({ doctor_id: s.doctor_id, date: dt[0] || '', time: dt[1] ? dt[1].slice(0,5) : '' });
                    }}>SELECT</button>
                  </div>
                ))}
              </div>
            )}

            <div className="solid-card">
              <h2 className="form-header">MY APPOINTMENT HISTORY</h2>
              {patientDashboard.filter(p => p.appointment_datetime).length > 0 ? (
                patientDashboard.filter(p => p.appointment_datetime).map((p, idx) => (
                  <div className="list-item" key={idx}>
                    <div>
                      <strong>DR. {p.doctor_name}</strong>
                      <p>{p.appointment_datetime}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="status-badge">UPCOMING</span>
                      {p.appointment_id && (
                        <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => handleCancelAppointment(p.appointment_id)}>CANCEL</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="list-item">
                  <div><p>No appointments recorded in your history yet.</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PATIENT — PRESCRIPTIONS
            ════════════════════════════════════════════════════════════ */}
        {user.role === "patient" && activeTab === "prescriptions" && (
          <div className="solid-card">
            <h2 className="form-header">MEDICATION DIRECTORY</h2>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <th style={{ padding: 12 }}>CONSULT ID</th>
                  <th style={{ padding: 12 }}>NAME</th>
                  <th style={{ padding: 12 }}>DOSAGE</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.length > 0 ? prescriptions.map((pr, idx) => (
                  <tr style={{ borderBottom: "1px solid #ccc" }} key={idx}>
                    <td style={{ padding: 12 }}>#{pr.consult_id}</td>
                    <td style={{ padding: 12 }}>{pr.medicine || `Med #${pr.medicine_id}`}</td>
                    <td style={{ padding: 12 }}>{pr.dosage}</td>
                  </tr>
                )) : (
                  <tr style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: 12 }} colSpan={3}>No medications prescribed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PATIENT — BILLING
            ════════════════════════════════════════════════════════════ */}
        {user.role === "patient" && activeTab === "billing" && (
          <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
            <div className="solid-card">
              <h2 className="form-header">PAY A BILL</h2>
              <form onSubmit={handlePayBill}>
                <div className="input-group">
                  <label>BILL ID</label>
                  <select
                    value={paymentForm.bill_id}
                    onChange={e => {
                      const selectedBill = bills.find(b => b.bill_id === parseInt(e.target.value));
                      setPaymentForm({
                        ...paymentForm,
                        bill_id: e.target.value,
                        amount: selectedBill ? selectedBill.total_amount : ""
                      });
                    }}
                    required
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}
                  >
                    <option value="">-- Select Unpaid Bill --</option>
                    {bills.filter(b => b.status !== 'paid').map(b => (
                      <option key={b.bill_id} value={b.bill_id}>Bill #{b.bill_id} — ${b.total_amount} ({b.doctor_name || 'N/A'})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>AMOUNT</label>
                  <input type="number" placeholder="Enter Amount" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>METHOD</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    <option value="UPI">UPI</option>
                    <option value="Card">CARD</option>
                    <option value="Cash">CASH</option>
                    <option value="Insurance">INSURANCE</option>
                  </select>
                </div>
                <button type="submit" className="btn" style={{ marginTop: 12 }}>PAY OFF BALANCE</button>
              </form>
            </div>
            <div className="solid-card">
              <h2 className="form-header">INVOICES & PAYMENTS</h2>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #000" }}>
                    <th style={{ padding: 12 }}>BILL #</th>
                    <th style={{ padding: 12 }}>DOCTOR</th>
                    <th style={{ padding: 12 }}>AMOUNT</th>
                    <th style={{ padding: 12 }}>STATUS</th>
                    <th style={{ padding: 12 }}>PAYMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? bills.map((b, idx) => (
                    <tr style={{ borderBottom: "1px solid #ccc" }} key={idx}>
                      <td style={{ padding: 12 }}>#{b.bill_id}</td>
                      <td style={{ padding: 12 }}>{b.doctor_name || "N/A"}</td>
                      <td style={{ padding: 12 }}>${b.total_amount}</td>
                      <td style={{ padding: 12 }}>
                        <span className="status-badge" style={{ background: b.status === 'paid' ? '#222' : 'transparent', color: b.status === 'paid' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                          {(b.status || 'unpaid').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>{b.payment_method ? `${b.payment_method} on ${b.payment_date || ''}` : "—"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td style={{ padding: 12 }} colSpan={5}>No invoices or past payments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            DOCTOR — DASHBOARD
            ════════════════════════════════════════════════════════════ */}
        {user.role === "doctor" && activeTab === "dashboard" && (
          <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
            <div className="solid-card">
              <h2 className="form-header">PENDING APPOINTMENT REQUESTS</h2>
              {pendingAppointments.length > 0 ? pendingAppointments.map((apt, idx) => (
                <div className="list-item" key={idx} style={{flexDirection: "column", alignItems: "flex-start"}}>
                  <div style={{display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "wrap", gap: "10px"}}>
                    <div>
                      <strong>Patient: {apt.patient_name}</strong>
                      <p>Time: {apt.appointment_datetime}</p>
                      <p>Status: <span style={{color: "var(--text-primary)", fontWeight: "bold"}}>{apt.status.toUpperCase()}</span></p>
                    </div>
                    <div style={{display: "flex", gap: "10px"}}>
                      <button className="btn" onClick={() => handleAccept(apt.appointment_id)}>ACCEPT</button>
                      <button className="btn btn-outline" onClick={() => setRescheduleForm({ appointment_id: apt.appointment_id, new_date: "", new_time: "" })}>RESCHEDULE</button>
                    </div>
                  </div>
                  {rescheduleForm.appointment_id === apt.appointment_id && (
                    <form onSubmit={handleReschedule} style={{marginTop: 12, width: "100%", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center"}}>
                       <input 
                         type="date" 
                         value={rescheduleForm.new_date} 
                         onChange={e => setRescheduleForm({ ...rescheduleForm, new_date: e.target.value })} 
                         required 
                         style={{ flex: 1, padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', colorScheme: 'dark' }}
                       />
                       <input 
                         type="time" 
                         value={rescheduleForm.new_time} 
                         onChange={e => setRescheduleForm({ ...rescheduleForm, new_time: e.target.value })} 
                         required 
                         style={{ flex: 1, padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', colorScheme: 'dark' }}
                       />
                       <button type="submit" className="btn">CONFIRM</button>
                       <button type="button" className="btn btn-outline" onClick={() => setRescheduleForm({ appointment_id: "", new_date: "", new_time: "" })}>CANCEL</button>
                    </form>
                  )}
                </div>
              )) : (
                <p style={{ marginTop: 12 }}>No pending appointment requests.</p>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div className="solid-card">
                <h3 className="form-header"><Users size={24} /> PATIENTS TODAY</h3>
                <div className="stat-value">{doctorStats.patients_today}</div>
              </div>
              <div className="solid-card">
                <h3 className="form-header"><Database size={24} /> ACTIVE ADMISSIONS</h3>
                <div className="stat-value">{doctorStats.active_admissions}</div>
              </div>
              <div className="solid-card">
                <h3 className="form-header"><Calendar size={24} /> TOTAL APPOINTMENTS</h3>
                <div className="stat-value">{doctorStats.total_appointments}</div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            DOCTOR — PROFILE
            ════════════════════════════════════════════════════════════ */}
        {user.role === "doctor" && activeTab === "profile" && (
          <div className="solid-card">
            <h2 className="form-header">DOCTOR PERSONNEL RECORD</h2>
            {doctorProfile ? (
              <>
                <div className="list-item">
                  <div>
                    <strong>FULL NAME</strong>
                    <p>{doctorProfile.name}</p>
                  </div>
                  <span className="status-badge" style={{ alignSelf: "flex-start", marginTop: 4 }}>ID: {doctorProfile.doctor_id}</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>SPECIALIZATION</strong>
                    <p>{doctorProfile.specialization || "General"}</p>
                  </div>
                </div>
                <div className="list-item">
                  <div>
                    <strong>EXPERIENCE</strong>
                    <p>{doctorProfile.experience_years ? `${doctorProfile.experience_years} years` : "N/A"}</p>
                  </div>
                </div>
                <div className="list-item">
                  <div>
                    <strong>CONTACT</strong>
                    <p>{doctorProfile.phone || "Not on file"}</p>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ marginTop: 12 }}>Loading profile...</p>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            DOCTOR — SCHEDULE
            ════════════════════════════════════════════════════════════ */}
        {user.role === "doctor" && activeTab === "schedule" && (
          <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
            <div className="solid-card">
              <h2 className="form-header">ADD AVAILABILITY SLOT</h2>
              <form onSubmit={handleAddAvailability}>
                <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>DATE</label>
                    <input type="date" value={availForm.date} onChange={e => setAvailForm({ ...availForm, date: e.target.value })} required style={{ width: '100%', padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', colorScheme: 'dark' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>TIME</label>
                    <input type="time" value={availForm.time} onChange={e => setAvailForm({ ...availForm, time: e.target.value })} required style={{ width: '100%', padding: '10px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', colorScheme: 'dark' }} />
                  </div>
                </div>
                <button type="submit" className="btn" style={{ marginTop: 12 }}>PUBLISH AVAILABILITY</button>
              </form>
            </div>
            <div className="solid-card">
              <h2 className="form-header">MY AVAILABILITY SLOTS</h2>
              {doctorSlots.length > 0 ? (
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th style={{ padding: 12 }}>DATETIME</th>
                      <th style={{ padding: 12 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorSlots.map((slot, idx) => (
                      <tr style={{ borderBottom: "1px solid #ccc" }} key={idx}>
                        <td style={{ padding: 12 }}>{slot.available_datetime}</td>
                        <td style={{ padding: 12 }}>
                          <span className="status-badge" style={{ background: slot.is_booked ? '#222' : 'transparent', color: slot.is_booked ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                            {slot.is_booked ? "BOOKED" : "OPEN"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: 12 }}>No availability slots published yet.</p>
              )}
            </div>
            <div className="solid-card">
              <h2 className="form-header">ALL MY APPOINTMENTS</h2>
              {allAppointments.length > 0 ? (
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th style={{ padding: 12 }}>PATIENT</th>
                      <th style={{ padding: 12 }}>DATETIME</th>
                      <th style={{ padding: 12 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAppointments.map((apt, idx) => (
                      <tr style={{ borderBottom: "1px solid #ccc" }} key={idx}>
                        <td style={{ padding: 12 }}>{apt.patient_name}</td>
                        <td style={{ padding: 12 }}>{apt.appointment_datetime}</td>
                        <td style={{ padding: 12 }}>
                          <span className="status-badge" style={{ background: apt.status === 'accepted' ? '#222' : 'transparent', color: apt.status === 'accepted' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                            {apt.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: 12 }}>No appointments found.</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            DOCTOR — CONSULTATIONS
            ════════════════════════════════════════════════════════════ */}
        {user.role === "doctor" && activeTab === "consultations" && (
          <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
            <div className="solid-card">
              <h2 className="form-header">LOG CONSULTATION & PRESCRIPTION</h2>
              <form onSubmit={handlePrescribe}>
                <div className="input-group">
                  <label>CONSULTATION ID</label>
                  <select
                    value={prescribeForm.consult_id}
                    onChange={e => setPrescribeForm({ ...prescribeForm, consult_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}
                  >
                    <option value="">-- Select Consultation --</option>
                    {doctorConsultations.map(c => (
                      <option key={c.consult_id} value={c.consult_id}>#{c.consult_id} — {c.patient_name} ({c.consult_date})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>MEDICINE ID</label>
                  <input type="number" placeholder="E.g. 1" value={prescribeForm.medicine_id} onChange={e => setPrescribeForm({ ...prescribeForm, medicine_id: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>RECOMMENDED DOSAGE</label>
                  <input type="text" placeholder="E.g. 500mg, 2x daily after meals" value={prescribeForm.dosage} onChange={e => setPrescribeForm({ ...prescribeForm, dosage: e.target.value })} required />
                </div>
                <button type="submit" className="btn" style={{ marginTop: 12 }}>ISSUE PRESCRIPTION</button>
              </form>
            </div>
            <div className="solid-card">
              <h2 className="form-header">MY CONSULTATIONS</h2>
              {doctorConsultations.length > 0 ? (
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th style={{ padding: 12 }}>#</th>
                      <th style={{ padding: 12 }}>PATIENT</th>
                      <th style={{ padding: 12 }}>DATE</th>
                      <th style={{ padding: 12 }}>APPT STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorConsultations.map((c, idx) => (
                      <tr style={{ borderBottom: "1px solid #ccc" }} key={idx}>
                        <td style={{ padding: 12 }}>#{c.consult_id}</td>
                        <td style={{ padding: 12 }}>{c.patient_name}</td>
                        <td style={{ padding: 12 }}>{c.consult_date}</td>
                        <td style={{ padding: 12 }}>
                          <span className="status-badge">
                            {(c.appointment_status || "N/A").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: 12 }}>No consultations recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            DOCTOR — ADMISSIONS (INPATIENT WARDS)
            ════════════════════════════════════════════════════════════ */}
        {user.role === "doctor" && activeTab === "admissions" && (
          <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="solid-card">
                <h2 className="form-header">ADMIT PATIENT</h2>
                <form onSubmit={handleAdmit}>
                  <div className="input-group">
                    <label>PATIENT ID</label>
                    <input type="number" placeholder="Enter Patient ID" value={admitForm.patient_id} onChange={e => setAdmitForm({ ...admitForm, patient_id: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>ROOM NUMBER</label>
                    <input type="number" placeholder="Enter Room No." value={admitForm.room_no} onChange={e => setAdmitForm({ ...admitForm, room_no: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn" style={{ marginTop: 12 }}>ADMIT PATIENT</button>
                </form>
              </div>
              <div className="solid-card">
                <h2 className="form-header">DISCHARGE PATIENT</h2>
                <form onSubmit={handleDischarge}>
                  <div className="input-group">
                    <label>PATIENT ID</label>
                    <select
                      value={dischargeForm.patient_id}
                      onChange={e => setDischargeForm({ patient_id: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}
                    >
                      <option value="">-- Select Patient --</option>
                      {activeAdmissions.map(a => (
                        <option key={a.admission_id} value={a.patient_id}>{a.patient_name} (Room {a.room_no})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-outline" style={{ marginTop: 12 }}>DISCHARGE PATIENT</button>
                </form>
              </div>
            </div>
            <div className="solid-card">
              <h2 className="form-header">INPATIENT CENSUS</h2>
              {activeAdmissions.length > 0 ? (
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th style={{ padding: 12 }}>PATIENT</th>
                      <th style={{ padding: 12 }}>AGE/GENDER</th>
                      <th style={{ padding: 12 }}>ROOM</th>
                      <th style={{ padding: 12 }}>ADMITTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAdmissions.map((a, idx) => (
                      <tr style={{ borderBottom: "1px solid #ccc" }} key={idx}>
                        <td style={{ padding: 12 }}>{a.patient_name}</td>
                        <td style={{ padding: 12 }}>{a.age}/{a.gender}</td>
                        <td style={{ padding: 12 }}>Room #{a.room_no}</td>
                        <td style={{ padding: 12 }}>{a.admission_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: 12 }}>No patients currently admitted.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;