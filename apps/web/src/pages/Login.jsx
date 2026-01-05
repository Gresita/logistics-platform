import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Package, Truck, Shield } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const next = new URLSearchParams(loc.search).get("next");

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Plotëso username/email dhe fjalëkalimin");
      return;
    }

    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("username", form.username.trim());
      body.append("password", form.password);

      const res = await fetch(`/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Login failed");

      const token = data.access_token;
      login(token);

      const claims = decodeJwt(token);
      const role = claims?.role;

      if (role === "shipman") {
        nav("/shipman", { replace: true });
      } else {
        nav(next || "/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl flex items-center gap-12 relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col flex-1 text-white space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">LogisticsPro</h1>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed">
              Platforma më e mirë për menaxhimin dhe gjurmimin e dërgesave në kohë reale
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Gjurmim në Kohë Reale</h3>
                <p className="text-slate-400 leading-relaxed">
                  Ndiqni çdo dërgesë me përditësime të çastit përmes teknologjisë Kafka
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Menaxhim i Thjeshtë</h3>
                <p className="text-slate-400 leading-relaxed">
                  Krijoni dhe menaxhoni dërgesat tuaja me një ndërfaqe intuitive
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Siguri e Plotë</h3>
                <p className="text-slate-400 leading-relaxed">
                  Role-based access control për kontrollin e plotë të aksesit
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-[480px] bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Mirë se erdhe përsëri</h1>
            <p className="text-slate-500 mt-1">Hyr për të vazhduar në platformë</p>
          </div>

          {error ? <div className="mb-5 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div> : null}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Username / Email</label>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Shkruaj username ose email"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Fjalëkalimi</label>
              <input
                type="password"
                className="mt-1 w-full border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-md py-2.5 hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? "Duke hyrë..." : "Hyr"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <p className="text-sm text-slate-600 text-center mt-4">
              Nuk ke llogari?{" "}
              <Link className="text-indigo-600 font-medium hover:underline" to="/register">
                Regjistrohu
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

