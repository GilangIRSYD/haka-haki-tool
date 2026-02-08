"use client";

interface SubsidiaryCompany {
  company: string;
  percentage: string;
  types: string;
  value: string;
}

interface SubsidiaryCompaniesProps {
  subsidiaries: SubsidiaryCompany[];
}

export function SubsidiaryCompanies({ subsidiaries }: SubsidiaryCompaniesProps) {
  if (!subsidiaries || subsidiaries.length === 0) {
    return null;
  }

  // Sort by percentage (highest first)
  const sortedSubsidiaries = [...subsidiaries].sort((a, b) => {
    const pctA = parseFloat(a.percentage) || 0;
    const pctB = parseFloat(b.percentage) || 0;
    return pctB - pctA;
  });

  // Format value to readable format
  const formatValue = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""));
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(1)} T`;
    } else if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)} B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} M`;
    }
    return value;
  };

  return (
    <details className="group">
      <summary className="cursor-pointer text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center justify-between">
        <span>Anak Perusahaan ({subsidiaries.length})</span>
        <span className="transform group-open:rotate-180 transition-transform">▼</span>
      </summary>

      <div className="mt-3 space-y-2">
        {/* Summary Stats */}
        <div className="bg-violet-900/30 rounded-lg p-2">
          <div className="flex justify-between text-xs">
            <span className="text-violet-400">Total Subsidiaries</span>
            <span className="text-violet-200 font-semibold">{subsidiaries.length} Perusahaan</span>
          </div>
        </div>

        {/* All Subsidiaries - Scrollable */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {sortedSubsidiaries.map((sub, index) => (
            <div
              key={index}
              className="bg-violet-900/20 rounded-lg p-2 hover:bg-violet-900/30 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate" title={sub.company}>
                    {sub.company.length > 30 ? `${sub.company.substring(0, 30)}...` : sub.company}
                  </p>
                  <p className="text-[10px] text-violet-400 mt-0.5">{sub.types}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs font-bold text-violet-200">{sub.percentage}</span>
                  <span className="text-[9px] text-violet-500">
                    Rp {formatValue(sub.value)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
