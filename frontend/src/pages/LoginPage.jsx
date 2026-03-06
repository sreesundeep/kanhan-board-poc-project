import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppAuth, IS_DEV_MODE } from "../utils/auth";

function DevLoginPage() {
  const { signIn } = useAppAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("dev_user_001");

  const handleLogin = () => {
    signIn(userId);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-black text-white">K</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Kanban Board</h1>
          <p className="text-indigo-200 text-sm">Manage your tasks securely</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-2 rounded-xl mb-5">
            <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot shrink-0"></span>
            Dev Mode — local auth active
          </div>

          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white"
            placeholder="e.g. dev_user_001"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-300/50"
          >
            Sign In →
          </button>

          <p className="text-slate-400 text-[11px] text-center mt-4">
            Use different user IDs to test multi-user isolation
          </p>
        </div>
      </div>
    </div>
  );
}

function ClerkLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📋 Kanban Board</h1>
          <p className="text-blue-200">Manage your tasks securely</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-2">
          {isSignUp ? (
            <SignUp
              routing="hash"
              afterSignUpUrl="/dashboard"
              signInUrl="/login"
            />
          ) : (
            <SignIn
              routing="hash"
              afterSignInUrl="/dashboard"
              signUpUrl="/login"
            />
          )}
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-200 hover:text-white underline text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return IS_DEV_MODE ? <DevLoginPage /> : <ClerkLoginPage />;
}
