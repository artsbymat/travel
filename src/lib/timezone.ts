export type TimezoneRegion = "WIB" | "WITA" | "WIT";

export interface TimezoneInfo {
  region: TimezoneRegion;
  iana: string;      // IANA Timezone ID, e.g. "Asia/Jakarta"
  offset: number;    // UTC offset in hours, e.g. 7
}

/**
 * Returns the Timezone Info based on the Indonesian Province name.
 */
export function getTimezoneByProvince(provinceName?: string | null): TimezoneInfo {
  if (!provinceName) {
    return { region: "WIB", iana: "Asia/Jakarta", offset: 7 };
  }

  const name = provinceName.trim().toUpperCase();

  // WITA Provinces (Central Indonesian Time - UTC+8)
  const witaProvinces = [
    "BALI",
    "NUSA TENGGARA BARAT", "NTB",
    "NUSA TENGGARA TIMUR", "NTT",
    "SULAWESI UTARA", "SULUT",
    "SULAWESI TENGAH", "SULTENG",
    "SULAWESI SELATAN", "SULSEL",
    "SULAWESI TENGGARA", "SULTRA",
    "SULAWESI BARAT", "SULBAR",
    "GORONTALO",
    "KALIMANTAN TIMUR", "KALTIM",
    "KALIMANTAN SELATAN", "KALSEL",
    "KALIMANTAN UTARA", "KALUT"
  ];

  // WIT Provinces (Eastern Indonesian Time - UTC+9)
  const witProvinces = [
    "MALUKU",
    "MALUKU UTARA",
    "PAPUA",
    "PAPUA BARAT",
    "PAPUA SELATAN",
    "PAPUA TENGAH",
    "PAPUA PEGUNUNGAN",
    "PAPUA BARAT DAYA",
    "PAPUA BARATDAYA"
  ];

  // Check WIT
  if (witProvinces.some(p => name.includes(p))) {
    return { region: "WIT", iana: "Asia/Jayapura", offset: 9 };
  }

  // Check WITA
  if (witaProvinces.some(p => name.includes(p))) {
    return { region: "WITA", iana: "Asia/Makassar", offset: 8 };
  }

  // Fallback to WIB (covers Sumatra, Java, West/Central Kalimantan - UTC+7)
  return { region: "WIB", iana: "Asia/Jakarta", offset: 7 };
}

/**
 * Formats a Date or UTC string to the local time of the specified province.
 * Example output: "08:00 WIB" or "10:30 WITA"
 */
export function formatLocalTime(dateOrString: Date | string, provinceName?: string | null): string {
  const date = typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString;
  if (isNaN(date.getTime())) return "--:--";

  const tzInfo = getTimezoneByProvince(provinceName);

  try {
    const timeFormatted = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tzInfo.iana
    }).format(date);

    return `${timeFormatted} ${tzInfo.region}`;
  } catch (e) {
    // Fallback format if timezone resolution fails or is not supported
    const hours = String(date.getUTCHours() + tzInfo.offset).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes} ${tzInfo.region}`;
  }
}
