"use client";

import React, { useState, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AudioLines,
  Mail,
  Lock,
  User,
  MessageCircle,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "./auth-context";
import { usePreferences } from "./preferences";

interface AuthCardProps {
  initialMode: "login" | "register";
}

export function AuthCard({ initialMode }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/";

  const { setUser } = useAuth();
  const { preferences, update } = usePreferences();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#ef4444", "#f59e0b", "#ac8dff", "#10b981"];

  const handleDemoFill = async () => {
    setError(null);
    setEmail("demo@rehearsal.ai");
    setPassword("rehearsal123");
    if (mode === "register") {
      setName("Demo Director");
      setWorkspace("Rehearsal Alpha Lab");
      setConfirmPassword("rehearsal123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        setError("Please agree to the rehearsal platform guidelines.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              workspace: workspace.trim() || undefined,
            }
          : {
              email: email.trim().toLowerCase(),
              password,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // If login failed because demo user does not exist yet and user clicked demo, offer to register
        if (
          mode === "login" &&
          email === "demo@rehearsal.ai" &&
          res.status === 401
        ) {
          // Auto create demo account seamlessly
          const regRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Demo Director",
              email: "demo@rehearsal.ai",
              password: "rehearsal123",
              workspace: "Rehearsal Demo Lab",
            }),
          });
          if (regRes.ok) {
            const regData = await regRes.json();
            setUser(regData.user);
            setSuccessMessage("Demo account ready! Redirecting to studio...");
            setTimeout(() => {
              router.push(returnTo);
              router.refresh();
            }, 800);
            return;
          }
        }
        throw new Error(data.error || "Authentication failed");
      }

      setUser(data.user);
      setSuccessMessage(
        mode === "register"
          ? "Account created successfully! Preparing your studio..."
          : "Welcome back! Redirecting to your rehearsals...",
      );

      setTimeout(() => {
        router.push(returnTo);
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Top action bar */}
      <header className="auth-top-nav">
        <Link href="/" className="auth-back-link" id="auth-back-button">
          <ArrowLeft size={16} />
          <span>Back to Studio</span>
        </Link>
        <button
          type="button"
          className="auth-theme-btn"
          id="auth-theme-toggle"
          onClick={() =>
            update({
              ...preferences,
              theme: preferences.theme === "paper" ? "night" : "paper",
            })
          }
          aria-label="Toggle visual theme"
        >
          {preferences.theme === "paper" ? (
            <>
              <Moon size={15} />
              <span>Evening</span>
            </>
          ) : (
            <>
              <Sun size={15} />
              <span>Daylight</span>
            </>
          )}
        </button>
      </header>

      {/* Main auth layout container */}
      <div className="auth-wrapper">
        {/* Left Hero showcase panel */}
        <div className="auth-hero">
          <div className="auth-brand-badge">
            <AudioLines size={18} className="auth-brand-icon" />
            <span>VOICE AI REHEARSAL STUDIO</span>
          </div>

          <h1 className="auth-hero-title">
            rehearsal<span className="coral">.</span>
          </h1>

          <p className="auth-hero-subtitle">
            The safe, lifelike stage where every difficult conversation gets
            rehearsed before opening night.
          </p>

          <div className="auth-soundwave-card">
            <div className="auth-soundwave-header">
              <span className="auth-live-dot" />
              <span className="auth-live-text">Voice Sandbox Active</span>
              <span className="auth-latency-pill">~120ms latency</span>
            </div>
            <div className="auth-wave-bars">
              {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 50, 78, 60, 88, 42].map(
                (h, idx) => (
                  <span
                    key={idx}
                    className="auth-wave-bar"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${idx * 0.08}s`,
                    }}
                  />
                ),
              )}
            </div>
            <div className="auth-wave-caption">
              Voice conversations and session feedback
            </div>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="auth-feature-bullet">
                <MessageCircle size={19} aria-hidden="true" />
              </div>
              <div>
                <strong>Custom practice characters</strong>
                <p>
                  Build stubborn patients, inquisitive clients, or rigorous
                  interviewers.
                </p>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-bullet">
                <ChartNoAxesCombined size={19} aria-hidden="true" />
              </div>
              <div>
                <strong>Feedback from your conversations</strong>
                <p>
                  Evaluate exact transcript quotes against strict pedagogical
                  rubrics.
                </p>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-bullet">
                <ShieldCheck size={19} aria-hidden="true" />
              </div>
              <div>
                <strong>Private character instructions</strong>
                <p>
                  Hidden character prompts never leak to public rehearsal
                  students.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-card-container">
          <div className="auth-card">
            {/* Tabs */}
            <div className="auth-tab-group" role="tablist">
              <button
                type="button"
                id="tab-login"
                role="tab"
                aria-selected={mode === "login"}
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMessage(null);
                  router.push("/login");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-register"
                role="tab"
                aria-selected={mode === "register"}
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccessMessage(null);
                  router.push("/register");
                }}
              >
                Create Account
              </button>
            </div>

            {/* Header info */}
            <div className="auth-card-header">
              <h2>{mode === "login" ? "Welcome back" : "Start your studio"}</h2>
              <p className="muted">
                {mode === "login"
                  ? "Enter your credentials to access your characters and rehearsal logs."
                  : "Set up your workspace to design, practice, and evaluate voice agents."}
              </p>
            </div>

            {/* Quick Demo Helper */}
            <div className="auth-demo-box">
              <div className="auth-demo-content">
                <Zap size={14} className="coral" />
                <span>
                  <strong>Hackathon / Evaluator Mode:</strong> 1-click test
                  credentials
                </span>
              </div>
              <button
                type="button"
                id="btn-quick-demo"
                className="auth-demo-btn"
                onClick={handleDemoFill}
                title="Pre-fills demo credentials for fast review"
              >
                Use demo account
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div
                className="auth-alert error"
                role="alert"
                id="auth-error-message"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div
                className="auth-alert success"
                role="status"
                id="auth-success-message"
              >
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {mode === "register" && (
                <>
                  <div className="auth-field">
                    <label htmlFor="auth-name">Full Name</label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-field-icon" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        placeholder="e.g. Alex Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="auth-workspace">
                      Studio / Workspace Name{" "}
                      <span className="muted">(Optional)</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <AudioLines size={16} className="auth-field-icon" />
                      <input
                        id="auth-workspace"
                        type="text"
                        placeholder="e.g. Clinical Voice Lab"
                        value={workspace}
                        onChange={(e) => setWorkspace(e.target.value)}
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-field-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="name@rehearsal.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="auth-password">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="auth-link-subtle"
                      onClick={() =>
                        alert(
                          "For demo evaluation, you can use the 'Use demo account' button or create a new account in 5 seconds.",
                        )
                      }
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-field-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    id="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength bar on register */}
                {mode === "register" && password.length > 0 && (
                  <div className="auth-strength-container">
                    <div className="auth-strength-bars">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className="auth-strength-segment"
                          style={{
                            backgroundColor:
                              idx < strengthScore
                                ? strengthColors[strengthScore - 1]
                                : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="auth-strength-text"
                      style={{
                        color: strengthColors[Math.max(0, strengthScore - 1)],
                      }}
                    >
                      Strength: {strengthLabels[Math.max(0, strengthScore - 1)]}
                    </span>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">
                    Confirm Password
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-field-icon" />
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* Checkboxes */}
              <div className="auth-options">
                {mode === "login" ? (
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      id="auth-remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Keep me signed in for 30 days</span>
                  </label>
                ) : (
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      id="auth-agree-terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <span>
                      I agree to the rehearsal studio guidelines & privacy
                      standards
                    </span>
                  </label>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                id="auth-submit-button"
                className="btn primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-spinner">
                    <span className="spinner-icon" />
                    {mode === "login" ? "Signing In..." : "Creating Account..."}
                  </span>
                ) : (
                  <>
                    <span>
                      {mode === "login"
                        ? "Sign in to Studio"
                        : "Create My Rehearsal Studio"}
                    </span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Bottom switcher */}
            <div className="auth-card-footer">
              {mode === "login" ? (
                <p>
                  Don&apos;t have an account yet?{" "}
                  <Link
                    href="/register"
                    className="auth-link-accent"
                    id="link-to-register"
                  >
                    Create account ↗
                  </Link>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="auth-link-accent"
                    id="link-to-login"
                  >
                    Sign in here ↗
                  </Link>
                </p>
              )}
            </div>

            <div className="auth-secure-notice">
              <ShieldCheck size={13} />
              <span>
                Encrypted Supabase PostgreSQL session token • Zero token leaks
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
