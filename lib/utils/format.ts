/**
 * Format large numbers to compact notation (B, M, K)
 * @param value - Number value as string or number
 * @returns Formatted string (e.g., "9.14B", "214.6M", "2.9K")
 */
export function formatCompactNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

  if (isNaN(num)) return "-";

  const absNum = Math.abs(num);

  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(2) + "B";
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  }
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  }

  return num.toString();
}

/**
 * Format percentage value
 * @param value - Percentage string (e.g., "+10.5700", "-1.1341")
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage (e.g., "+10.57%", "-1.13%")
 */
export function formatPercentage(value: string, decimals: number = 2): string {
  const num = parseFloat(value);

  if (isNaN(num)) return "-";

  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

/**
 * Parse percentage to number for sorting/comparison
 * @param value - Percentage string
 * @returns Number value
 */
export function parsePercentage(value: string): number {
  return parseFloat(value) || 0;
}

/**
 * Format date to short format (e.g., "13 Jan", "14 Jan 26")
 * @param dateString - Date string from API
 * @returns Formatted date string
 */
export function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);

    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);

    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format date to readable format (e.g., "12-Jan-2025")
 * @param dateString - Date string from API
 * @returns Formatted date string
 */
export function formatDateReadable(dateString: string): string {
  try {
    const date = new Date(dateString);

    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format date range to readable format (e.g., "12-Jan-2025 to 28-Nov-2026")
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "-";

  const startFormatted = formatDateReadable(startDate);
  const endFormatted = formatDateReadable(endDate);

  return `${startFormatted} to ${endFormatted}`;
}

/**
 * Get relative date label (Today, Yesterday, or formatted date)
 * @param dateString - Date string
 * @returns Relative date label
 */
export function getRelativeDateLabel(dateString: string): string {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return "Today";
    }
    if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    return formatShortDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Get nationality icon
 * @param nationality - Nationality type enum
 * @returns Emoji flag icon
 */
export function getNationalityIcon(nationality: string): string {
  if (nationality === "NATIONALITY_TYPE_FOREIGN") {
    return "🌍";
  }
  if (nationality === "NATIONALITY_TYPE_LOCAL") {
    return "🇮🇩";
  }
  return "";
}

/**
 * Get badge icons based on badges array
 * @param badges - Array of shareholder badges
 * @returns Formatted badge icons string
 */
export function getBadgeIcons(badges: string[]): string {
  if (!badges || badges.length === 0) return "";

  const icons: string[] = [];

  badges.forEach((badge) => {
    if (badge === "SHAREHOLDER_BADGE_PENGENDALI") {
      icons.push("👑");
    }
    if (badge === "SHAREHOLDER_BADGE_DIREKTUR") {
      icons.push("👤");
    }
  });

  return icons.join("");
}

/**
 * Get action type icon
 * @param actionType - Action type enum
 * @returns Icon and color class
 */
export function getActionTypeDisplay(actionType: string): {
  icon: string;
  colorClass: string;
  bgClass: string;
  label: string;
} {
  switch (actionType) {
    case "ACTION_TYPE_BUY":
      return {
        icon: "🟢",
        colorClass: "text-success",
        bgClass: "bg-success/10",
        label: " • BUY",
      };

    case "ACTION_TYPE_SELL":
      return {
        icon: "🔴",
        colorClass: "text-danger",
        bgClass: "bg-danger/10",
        label: " • SELL",
      };

    case "ACTION_TYPE_MESOP_OPTION":
      return {
        icon: "⚡",
        colorClass: "text-warning",
        bgClass: "bg-warning/10",
        label: " • MESOP",
      };

    case "ACTION_TYPE_MSOP_OPTION":
      return {
        icon: "⚡",
        colorClass: "text-warning",
        bgClass: "bg-warning/10",
        label: " • MSOP",
      };

    case "ACTION_TYPE_WARRANT_EXERCISE":
      return {
        icon: "📜",
        colorClass: "text-secondary",
        bgClass: "bg-secondary/10",
        label: " • WARRANT",
      };

    case "ACTION_TYPE_RIGHT_ISSUE":
      return {
        icon: "📜",
        colorClass: "text-secondary",
        bgClass: "bg-secondary/10",
        label: " • RIGHT ISSUE",
      };

    case "ACTION_TYPE_TRANSFER":
      return {
        icon: "💸",
        colorClass: "text-default",
        bgClass: "bg-default/10",
        label: " • TRANSFER",
      };

    case "ACTION_TYPE_CROSS":
      return {
        icon: "🔄",
        colorClass: "text-primary",
        bgClass: "bg-primary/10",
        label: " • CROSS",
      };

    default:
      return {
        icon: "⚪",
        colorClass: "text-default",
        bgClass: "bg-default/10",
        label: " • OTHER",
      };
  }
}

/**
 * Format broker codes array to string
 * @param brokers - Array of broker codes
 * @returns Formatted string or "-"
 */
export function formatBrokers(brokers: string[]): string {
  if (!brokers || brokers.length === 0) return "-";

  const filtered = brokers.filter((b) => b && b !== "");
  if (filtered.length === 0) return "-";

  return filtered.join(", ");
}

/**
 * Parse large number string to number
 * @param value - Number string with commas (e.g., "9,144,270,316")
 * @returns Parsed number
 */
export function parseLargeNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Format price value
 * @param price - Price formatted string
 * @returns Formatted price or "-"
 */
export function formatPrice(price: string): string {
  if (!price || price === "0" || price === "-") return "-";
  return price;
}
