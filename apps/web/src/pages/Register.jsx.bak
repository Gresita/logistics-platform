import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Truck, Shield, ArrowRight } from "lucide-react";
import { apiFetch, SHIPMENT_API } from "../lib/api";

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "", // përdoret si username në backend
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((p) => ({ ...p, [k]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {};

    if (!form.fullName.trim()) e.fullName = "Emri i plotë është i detyrueshëm";

    if (!form.email.trim()) e.email = "Email është i detyrueshëm";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email i pavlefshëm";

    if (!form.password) e.password = "Fjalëkalimi është i detyrueshëm";
    else if (form.password.length < 8) e.password = "Fjalëkalimi duhet të jetë të paktën 8 karaktere";

    if (form.password !== form.confirmPassword) e.confirmPassword = "Fjalëkalimet nuk përputhen";

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);
    try {
      await apiFetch(`${SHIPMENT_API}/api/v1/auth/register`, {
        auth: false,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.email.trim(),
          password: form.password,
        }),
      });

      nav("/login");
    } catch (err) {
      setApiError(err.message || "Regjistrimi dështoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[oklch(0.25_0.08_240)] via-[oklch(0.20_0.06_250)] to-[oklch(0.15_0.04_260)] flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10 items-center">
        {/* Left branding */}
        <div className="hidden lg:flex flex-col text-white space-y-8 pr-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">LogisticsPro</h1>
            </div>
            <p className="text-lg text-blue-200 leading-relaxed">
              Platformë moderne për menaxhimin dhe gjurmimin e dërgesave në kohë reale.
            </p>
          </div>

          <div className="space-y-6">
            <Feature
              icon={<Truck className="w-5 h-5 text-blue-300" />}
              title="Gjurmim në Kohë Reale"
              desc="Evente të dërgesave në kohë reale përmes Kafka."
            />
            <Feature
              icon={<Package className="w-5 h-5 text-blue-300" />}
              title="Menaxhim i Thjeshtë"
              desc="Krijo dërgesa, shiko status logs, dhe kontrollo historikun."
            />
            <Feature
              icon={<Shield className="w-5 h-5 text-blue-300" />}
              title="Siguri e Plotë"
              desc="JWT authentication + role-based access control."
            />
          </div>
        </div>

        {/* Right card */}
        <div className="w-full">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/40 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Krijo Llogari</h2>
            <p className="text-slate-600 mt-1">
              Plotëso të dhënat për të filluar me LogisticsPro
            </p>

            {apiError ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            ) : null}

            <form onSubmit={submit} className="mt-6 space-y-5">
              <Field
                label="Emri i Plotë"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(v) => setField("fullName", v)}
                error={fieldErrors.fullName}
              />

              <Field
                label="Email (Username)"
                placeholder="john@example.com"
                value={form.email}
                onChange={(v) => setField("email", v)}
                error={fieldErrors.email}
              />

              <Field
                label="Fjalëkalimi"
                placeholder="••••••••"
                value={form.password}
                onChange={(v) => setField("password", v)}
                error={fieldErrors.password}
                type="password"
              />

              <Field
                label="Konfirmo Fjalëkalimin"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(v) => setField("confirmPassword", v)}
                error={fieldErrors.confirmPassword}
                type="password"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.45_0.15_250)] px-4 py-3 text-white font-medium shadow-lg shadow-indigo-900/20 hover:bg-[oklch(0.40_0.15_250)] transition disabled:opacity-60"
              >
                {loading ? "Duke u regjistruar..." : "Regjistrohu"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <p className="text-center text-sm text-slate-600">
                Ke tashmë një llogari?{" "}
                <Link className="text-[oklch(0.45_0.15_250)] font-semibold hover:underline" to="/login">
                  Hyr këtu
                </Link>
              </p>
            </form>

            <p className="mt-6 text-xs text-slate-500">
              Duke u regjistruar, llogaria krijohet si <span className="font-medium">user</span> (admin krijohet vetëm nga sistemi).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-blue-200 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, error, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <input
        type={type}
        className={[
          "w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none",
          "focus:ring-2 focus:ring-[oklch(0.45_0.15_250)]/35 focus:border-[oklch(0.45_0.15_250)]",
          error ? "border-red-300" : "border-slate-200",
        ].join(" ")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
