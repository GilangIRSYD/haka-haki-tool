"use client";

import { useState } from "react";
import { DiamondIcon } from "@/components/icons";
import { EmittenSummary } from "@/components/emitten/emitten-summary";
import { fetchAllEmittenData, EmittenInfo, KeyStats, Profile } from "@/lib/api/emitten";

type ValuationMode = "conservative" | "moderate" | "aggressive";

export function SidebarToggle({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [emittenInfo, setEmittenInfo] = useState<EmittenInfo | null>(null);
  const [keyStats, setKeyStats] = useState<KeyStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valuationMode, setValuationMode] = useState<ValuationMode>("moderate");

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchCode.trim()) {
      setLoading(true);
      setError(null);

      try {
        // Fetch all emitten data from real API
        const data = await fetchAllEmittenData(searchCode.trim());

        setEmittenInfo(data.info);
        setKeyStats(data.keyStats);
        setProfile(data.profile);
      } catch (error) {
        console.error("Error fetching emitten data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch emitten data");
        // Reset data on error
        setEmittenInfo(null);
        setKeyStats(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Main Content - Left Dominant Space (75%) */}
      <section className="flex-1 overflow-y-auto transition-all duration-300">
        {children}
      </section>

      {/* Right Sidebar (25%) */}
      <section
        className={`overflow-y-auto transition-all duration-300 ${
          isOpen ? "w-1/4 bg-violet-950" : "w-0 overflow-hidden"
        }`}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-violet-800">
          <div className="relative">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={handleSearch}
              placeholder="Kode Emitten (ex: BBCA)"
              className="w-full bg-violet-900 text-white placeholder-violet-400 text-sm rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          {/* Valuation Mode Toggle */}
          <div className="mt-3">
            <p className="text-xs text-violet-400 mb-2">Mode Valuasi</p>
            <div className="flex gap-1">
              <button
                onClick={() => setValuationMode("conservative")}
                className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-all ${
                  valuationMode === "conservative"
                    ? "bg-violet-600 text-white font-medium"
                    : "bg-violet-900/50 text-violet-300 hover:bg-violet-800"
                }`}
              >
                Konservatif
              </button>
              <button
                onClick={() => setValuationMode("moderate")}
                className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-all ${
                  valuationMode === "moderate"
                    ? "bg-violet-600 text-white font-medium"
                    : "bg-violet-900/50 text-violet-300 hover:bg-violet-800"
                }`}
              >
                Moderat
              </button>
              <button
                onClick={() => setValuationMode("aggressive")}
                className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-all ${
                  valuationMode === "aggressive"
                    ? "bg-violet-600 text-white font-medium"
                    : "bg-violet-900/50 text-violet-300 hover:bg-violet-800"
                }`}
              >
                Agresif
              </button>
            </div>
          </div>
        </div>

        {/* Emitten Summary */}
        <EmittenSummary
          emittenInfo={emittenInfo}
          keyStats={keyStats}
          profile={profile}
          loading={loading}
          error={error}
          valuationMode={valuationMode}
        />
      </section>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group fixed right-4 top-20 z-50 flex items-center gap-2 bg-violet-600 rounded-full hover:bg-violet-700 transition-all pr-3"
        aria-label="Toggle sidebar"
      >
        <div className="p-3">
          <DiamondIcon size={36} />
        </div>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:opacity-100 opacity-0 transition-all duration-300 whitespace-nowrap text-sm font-medium">
          Fundamental Stats
        </span>
      </button>
    </div>
  );
}
