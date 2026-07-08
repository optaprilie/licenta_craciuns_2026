import { useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { GalleryVerticalEnd, LogIn, UserPlus, Sun, Moon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If user is already authenticated, redirect them to the home page
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim()
            }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page" style={{ position: 'relative' }}>
      <button 
        onClick={toggleTheme} 
        style={{ 
          position: 'absolute', 
          top: '24px', 
          right: '24px', 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          color: 'var(--text-main)',
          padding: '8px', 
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="login-container panel">
        <div className="login-header">
          <GalleryVerticalEnd className="logo-icon" size={32} />
          <h2>SmartGallery</h2>
          <p className="subtitle">
            {isSignUp ? "Create a new account" : "Sign in to your account"}
          </p>
        </div>

        {error && <div className="banner error-banner">{error}</div>}

        <form onSubmit={handleEmailAuth} className="login-form">
          {isSignUp && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="field" style={{ flex: 1 }}>
                <span>First Name</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <span>Last Name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          )}
          <div className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Insert email here..."
              required
            />
          </div>
          <div className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Insert password here..."
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="primary-button login-btn" disabled={loading}>
            {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
          </button>
        </form>



        <p className="toggle-auth">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
