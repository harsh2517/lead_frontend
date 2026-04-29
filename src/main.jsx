import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Download,
  Eye,
  EyeOff,
  FileUp,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCcw,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://lead-backend-5w9l.onrender.com";

const LEAD_FIELDS = [
  { key: "firstName", label: "First Name", required: false },
  { key: "lastName", label: "Last Name", required: false },
  { key: "email", label: "Email", required: true },
  { key: "country", label: "Country", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "companyName", label: "Company Name", required: false },
  { key: "verifiedStatus", label: "Verified Status", required: false },
  { key: "verifiedOn", label: "Verified On", required: false },
  { key: "campaignId", label: "Campaign ID", required: false },
  {
    key: "campaignOfInstantly",
    label: "Campaign Of Instantly",
    required: false,
  },
  { key: "title", label: "Title", required: false },
  { key: "website", label: "Website", required: false },
  { key: "leadstatus", label: "Lead Status", required: false },
];

function getSavedUser() {
  try {
    const raw = localStorage.getItem("leadUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeApiResponse(json) {
  return json?.apiresponse?.data ?? json?.data ?? json;
}

function getToken(user) {
  return user?.accessToken || localStorage.getItem("accessToken") || "";
}

function getAuthHeaders(user) {
  const token = getToken(user);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJsonOrText(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload, fallback = "Something went wrong.") {
  if (typeof payload === "string") return payload;
  return (
    payload?.apierror?.message || payload?.message || payload?.error || fallback
  );
}

async function authRequest(type, email, password) {
  const endpoint = type === "signup" ? "/user/sign-up" : "/user/login";
  const params = new URLSearchParams({ email, password });

  const response = await fetch(
    `${API_BASE_URL}${endpoint}?${params.toString()}`,
    {
      method: "POST",
    },
  );

  const json = await readJsonOrText(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(json, "Login/signup failed."));
  }

  return normalizeApiResponse(json);
}

async function apiGetLeads(user) {
  const response = await fetch(`${API_BASE_URL}/lead/get`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(user),
    },
  });

  const json = await readJsonOrText(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(json, "Failed to load leads."));
  }

  const data = normalizeApiResponse(json);
  return Array.isArray(data) ? data : [];
}

async function apiUploadCsv(user, file, mapping) {
  const formData = new FormData();
  formData.append("file", file);
  mapping.forEach((column) => formData.append("columns", column || ""));

  const response = await fetch(`${API_BASE_URL}/lead/upload-csv`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(user),
    },
    body: formData,
  });

  const payload = await readJsonOrText(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "CSV import failed."));
  }

  return payload;
}

function parseCsvHeaders(text) {
  const firstLine =
    text.split(/\r?\n/).find((line) => line.trim().length > 0) || "";
  const headers = [];
  let current = "";
  let insideQuote = false;

  for (let i = 0; i < firstLine.length; i += 1) {
    const char = firstLine[i];
    const next = firstLine[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      headers.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  headers.push(current.trim());
  return headers.filter(Boolean);
}

function normalizeName(value) {
  return String(value || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function guessMapping(headers) {
  const aliases = {
    firstName: ["firstname", "first", "first_name", "givenname"],
    lastName: ["lastname", "last", "last_name", "surname"],
    email: ["email", "emailaddress", "mail"],
    country: ["country"],
    industry: ["industry"],
    phone: ["phone", "mobile", "contact", "phonenumber"],
    companyName: ["companyname", "company", "organization", "businessname"],
    verifiedStatus: ["verifiedstatus", "verificationstatus", "statusverified"],
    verifiedOn: ["verifiedon", "verifieddate", "verificationdate"],
    campaignId: ["campaignid", "campaign_id"],
    campaignOfInstantly: [
      "campaignofinstantly",
      "instantlycampaign",
      "campaignname",
    ],
    title: ["title", "jobtitle", "designation", "position"],
    website: ["website", "site", "domain", "url"],
    leadstatus: ["leadstatus", "lead_status", "status"],
  };

  return LEAD_FIELDS.map((field) => {
    const names = aliases[field.key] || [field.key];
    const match = headers.find((header) =>
      names.includes(normalizeName(header)),
    );
    return match || "";
  });
}

function downloadCsv(filename, rows) {
  const headers = LEAD_FIELDS.map((field) => field.label);
  const keys = LEAD_FIELDS.map((field) => field.key);
  const escapeCsv = (value) => {
    const clean = value == null ? "" : String(value);
    return `"${clean.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => keys.map((key) => escapeCsv(row[key])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(getSavedUser);

  const title = mode === "login" ? "Welcome back" : "Create account";
  const subtitle =
    mode === "login"
      ? "Login to your lead management dashboard"
      : "Signup and start managing leads";

  const isValid = useMemo(() => {
    return email.trim().includes("@") && password.trim().length >= 4;
  }, [email, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValid) {
      setError("Please enter a valid email and minimum 4 character password.");
      return;
    }

    setLoading(true);
    try {
      const data = await authRequest(
        mode === "signup" ? "signup" : "login",
        email.trim(),
        password,
      );
      localStorage.setItem("leadUser", JSON.stringify(data));
      localStorage.setItem("accessToken", data?.accessToken || "");
      setUser(data);
      setSuccess(
        mode === "signup" ? "Signup successful." : "Login successful.",
      );
      setPassword("");
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("leadUser");
    localStorage.removeItem("accessToken");
    setUser(null);
    setSuccess("");
    setError("");
  };

  if (user?.accessToken) {
    return <Dashboard user={user} onLogout={logout} />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <h2>{title}</h2>
        <p className="subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} className="form">
          <label>Email</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              autoComplete="email"
            />
          </div>

          <label>Password</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            <button
              className="icon-btn"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <button className="submit-btn" disabled={loading} type="submit">
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetLeads(user);
      setLeads(data);
    } catch (err) {
      setError(err.message || "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) =>
      [
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.companyName,
        lead.phone,
        lead.website,
        lead.leadstatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [leads, search]);

  const handleExport = () => {
    downloadCsv("leads.csv", filteredLeads);
  };

  const handleImportSuccess = async (message) => {
    setImportOpen(false);
    setSuccess(
      typeof message === "string" ? message : "CSV imported successfully.",
    );
    await fetchLeads();
  };

  return (
    <main className="dashboard">
      <nav className="topbar">
        <div className="brand-left">
          <span className="mini-logo">LM</span>
          <div>
            <strong>Lead Management</strong>
            <small>{user.email}</small>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn" type="button">
          <LogOut size={17} /> Logout
        </button>
      </nav>

      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Leads</h1>
          <p>
            Import CSV leads, map columns, view table, and export your data.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="secondary-btn"
            type="button"
            onClick={fetchLeads}
            disabled={loading}
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={handleExport}
            disabled={!filteredLeads.length}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => setImportOpen(true)}
          >
            <Upload size={16} /> Import CSV
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <Users size={20} />
          <span>Total Leads</span>
          <strong>{leads.length}</strong>
        </div>
        <div className="stat-card">
          <Mail size={20} />
          <span>Showing</span>
          <strong>{filteredLeads.length}</strong>
        </div>
      </section>

      {error && <div className="alert error dashboard-alert">{error}</div>}
      {success && (
        <div className="alert success dashboard-alert">{success}</div>
      )}

      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>Lead List</h2>
            <p>
              {loading
                ? "Loading leads..."
                : `${filteredLeads.length} records found`}
            </p>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Title</th>
                <th>Country</th>
                <th>Industry</th>
                <th>Website</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Campaign</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="empty-cell">
                    <Loader2 className="spin" size={22} /> Loading...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="11" className="empty-cell">
                    No leads found. Import CSV to start.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id || `${lead.email}-${lead.phone}`}>
                    <td>
                      {[lead.firstName, lead.lastName]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </td>
                    <td>{lead.email || "-"}</td>
                    <td>{lead.phone || "-"}</td>
                    <td>{lead.companyName || "-"}</td>
                    <td>{lead.title || "-"}</td>
                    <td>{lead.country || "-"}</td>
                    <td>{lead.industry || "-"}</td>
                    <td>{lead.website || "-"}</td>
                    <td>
                      <span className="status-pill">
                        {lead.leadstatus || "NEW"}
                      </span>
                    </td>
                    <td>{lead.verifiedStatus || lead.verifiedOn || "-"}</td>
                    <td>
                      {lead.campaignOfInstantly || lead.campaignId || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {importOpen && (
        <ImportModal
          user={user}
          onClose={() => setImportOpen(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </main>
  );
}

function ImportModal({ user, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState(LEAD_FIELDS.map(() => ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    setError("");
    setFile(selectedFile || null);
    setHeaders([]);
    setMapping(LEAD_FIELDS.map(() => ""));

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select CSV file only.");
      return;
    }

    const text = await selectedFile.text();
    const csvHeaders = parseCsvHeaders(text);

    if (!csvHeaders.length) {
      setError("CSV header row not found.");
      return;
    }

    setHeaders(csvHeaders);
    setMapping(guessMapping(csvHeaders));
  };

  const updateMapping = (index, value) => {
    setMapping((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleImport = async () => {
    setError("");

    if (!file) {
      setError("Please select CSV file.");
      return;
    }

    if (!mapping[2]) {
      setError("Email column is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiUploadCsv(user, file, mapping);
      onSuccess(result || "CSV imported successfully.");
    } catch (err) {
      setError(err.message || "CSV import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>Import Leads CSV</h2>
            <p>Select CSV, map columns, then import leads.</p>
          </div>
          <button className="close-btn" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <label className="file-drop">
          <FileUp size={28} />
          <strong>{file ? file.name : "Choose CSV file"}</strong>
          <span>CSV first row must contain column headers.</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
          />
        </label>

        {error && <div className="alert error">{error}</div>}

        {headers.length > 0 && (
          <div className="mapping-box">
            <div className="mapping-title">
              <strong>Column Mapping</strong>
              <span>{headers.length} CSV columns found</span>
            </div>

            <div className="mapping-grid">
              {LEAD_FIELDS.map((field, index) => (
                <label key={field.key} className="mapping-row">
                  <span>
                    {field.label} {field.required && <b>*</b>}
                  </span>
                  <select
                    value={mapping[index]}
                    onChange={(e) => updateMapping(index, e.target.value)}
                  >
                    <option value="">-- Empty / Not Available --</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="secondary-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleImport}
            disabled={loading || !file}
          >
            {loading ? (
              <Loader2 className="spin" size={17} />
            ) : (
              <Upload size={17} />
            )}
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
