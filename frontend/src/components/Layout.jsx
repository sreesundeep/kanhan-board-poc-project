import { UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useAppAuth, IS_DEV_MODE } from "../utils/auth";

export default function Layout({ children }) {
  const { signOut, userId } = useAppAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (signOut) {
      signOut();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white text-sm sm:text-base font-bold">K</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Kanban Board
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {IS_DEV_MODE && (
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-dot"></span>
                  {userId}
                </span>
              )}
              {IS_DEV_MODE ? (
                <button
                  onClick={handleSignOut}
                  className="text-slate-500 hover:text-red-500 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200"
                >
                  Sign Out
                </button>
              ) : (
                <UserButton afterSignOutUrl="/login" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
