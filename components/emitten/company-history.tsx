"use client";

interface CompanyHistory {
  amount: string;
  board: string;
  date: string;
  price: string;
  registrar: string;
  shares: string;
  underwriters: string[];
  administrative_bureau: string;
  free_float: string;
}

interface CompanyHistoryProps {
  history: CompanyHistory;
}

export function CompanyHistory({ history }: CompanyHistoryProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate years since IPO
  const getYearsSinceIPO = (dateStr: string) => {
    try {
      const ipoDate = new Date(dateStr);
      const today = new Date();
      const years = today.getFullYear() - ipoDate.getFullYear();
      return years > 0 ? `${years} tahun` : '< 1 tahun';
    } catch {
      return '-';
    }
  };

  // Format shares with lot calculation (1 Lot = 100 saham)
  const formatShares = (sharesStr: string): string => {
    // Remove commas and parse
    const num = parseInt(sharesStr.replace(/,/g, ''));
    if (isNaN(num)) return sharesStr;

    // Calculate lots (1 lot = 100 saham)
    const lots = Math.floor(num / 100);

    // Format lots with K/M/B suffix
    let lotStr = "";
    if (lots >= 1000000000) {
      lotStr = `${(lots / 1000000000).toFixed(0)}B Lot`;
    } else if (lots >= 1000000) {
      lotStr = `${(lots / 1000000).toFixed(0)}M Lot`;
    } else if (lots >= 1000) {
      lotStr = `${(lots / 1000).toFixed(0)}K Lot`;
    } else {
      lotStr = `${lots} Lot`;
    }

    // Raw number dengan pemisah ribuan + lot dalam parentheses
    return `${num.toLocaleString('id-ID')} (${lotStr})`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-violet-300">
        Informasi Perusahaan & IPO
      </h3>

      {/* IPO Summary Card */}
      <div className="bg-violet-900/30 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-violet-300 mb-2">Informasi IPO</h4>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-violet-400">Tanggal IPO</span>
            <span className="text-white font-medium">{formatDate(history.date)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-violet-400">Harga IPO</span>
            <span className="text-white font-medium">Rp {parseInt(history.price).toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-violet-400">Jumlah Saham</span>
            <span className="text-white font-medium">{formatShares(history.shares)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-violet-400">Jumlah Penawaran</span>
            <span className="text-white font-medium">{history.amount}</span>
          </div>
        </div>
      </div>

      {/* Board & Bureau Info */}
      <div className="bg-violet-900/20 rounded-lg p-3">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-violet-400">Papan Pencatatan</span>
            <span className="px-2 py-0.5 bg-violet-700 text-violet-200 rounded text-[10px] font-semibold">
              {history.board}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-violet-400">Biro Administrasi</span>
            <span className="text-white text-right flex-1 ml-4">{history.administrative_bureau}</span>
          </div>

          {history.registrar && (
            <div className="flex justify-between">
              <span className="text-violet-400">Registrar</span>
              <span className="text-white text-right flex-1 ml-4">{history.registrar}</span>
            </div>
          )}
        </div>
      </div>

      {/* Underwriters */}
      {history.underwriters && history.underwriters.length > 0 && (
        <div className="bg-violet-900/20 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-violet-300 mb-2">Underwriter</h4>
          <div className="space-y-1">
            {history.underwriters.map((uw, index) => (
              <p key={index} className="text-xs text-white truncate" title={uw}>
                {uw}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Years Since Badge */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-xs text-violet-400">Terdaftar sejak</span>
        <span className="px-2 py-0.5 bg-violet-700 text-violet-200 rounded text-[10px] font-semibold">
          {getYearsSinceIPO(history.date)}
        </span>
      </div>
    </div>
  );
}
