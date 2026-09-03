export interface AdmissionNotifPrefs {
  newApp: boolean;
  docUploaded: boolean;
  studentReply: boolean;
  passportRequest: boolean;
  uniResponse: boolean;
  statusChanged: boolean;
}

export const DEFAULT_ADMISSION_NOTIF_PREFS: AdmissionNotifPrefs = {
  newApp: true,
  docUploaded: true,
  studentReply: true,
  passportRequest: true,
  uniResponse: true,
  statusChanged: true,
};

export const NOTIF_PREFS_KEY = "mtishbi_admin_notif_prefs";

export function getAdmissionNotifPrefs(): AdmissionNotifPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_ADMISSION_NOTIF_PREFS };
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return { ...DEFAULT_ADMISSION_NOTIF_PREFS };
    const parsed = JSON.parse(raw);
    return {
      newApp: parsed.newApp !== false,
      docUploaded: parsed.docUploaded !== false,
      studentReply: parsed.studentReply !== false,
      passportRequest: parsed.passportRequest !== false,
      uniResponse: parsed.uniResponse !== false,
      statusChanged: parsed.statusChanged !== false,
    };
  } catch {
    return { ...DEFAULT_ADMISSION_NOTIF_PREFS };
  }
}

export function saveAdmissionNotifPrefs(prefs: AdmissionNotifPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("mtb_notif_prefs_change", { detail: prefs }));
  } catch (err) {
    console.warn("Failed to save notif prefs:", err);
  }
}

export function isNotificationAllowed(
  item: { title?: string; message?: string; type?: string },
  prefs?: Partial<AdmissionNotifPrefs> | null
): boolean {
  if (!prefs) return true;

  const type = (item.type || "").toLowerCase();
  const text = `${item.title || ""} ${item.message || ""}`.toLowerCase();

  // 1. Passport
  if (type === "passport" || text.includes("passport")) {
    return prefs.passportRequest !== false;
  }

  // 2. Documents
  if (type === "document" || text.includes("document") || text.includes("upload") || text.includes("certificate")) {
    return prefs.docUploaded !== false;
  }

  // 3. New application submitted
  if (text.includes("new application") || text.includes("submitted application") || (type === "application" && !text.includes("status") && !text.includes("stage"))) {
    return prefs.newApp !== false;
  }

  // 4. University admission response / offer
  if (type === "offer" || text.includes("offer letter") || text.includes("university") || text.includes("admission letter") || text.includes("congratulations")) {
    return prefs.uniResponse !== false;
  }

  // 5. Visa or application stage transition
  if (type === "visa" || text.includes("visa") || text.includes("status updated") || text.includes("stage transition") || text.includes("stage updated")) {
    return prefs.statusChanged !== false;
  }

  // 6. Review notes / student reply / query
  if (text.includes("note") || text.includes("reply") || text.includes("query") || text.includes("message")) {
    return prefs.studentReply !== false;
  }

  return true;
}

export interface FinanceNotifPrefs {
  notifyNewPayment: boolean;
  notifyDailySummary: boolean;
}

export const DEFAULT_FINANCE_NOTIF_PREFS: FinanceNotifPrefs = {
  notifyNewPayment: true,
  notifyDailySummary: true,
};

export const FINANCE_NOTIF_PREFS_KEY = "mtishbi_finance_notif_prefs";

export function getFinanceNotifPrefs(): FinanceNotifPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_FINANCE_NOTIF_PREFS };
  try {
    const raw = localStorage.getItem(FINANCE_NOTIF_PREFS_KEY);
    if (!raw) return { ...DEFAULT_FINANCE_NOTIF_PREFS };
    const parsed = JSON.parse(raw);
    return {
      notifyNewPayment: parsed.notifyNewPayment !== false,
      notifyDailySummary: parsed.notifyDailySummary !== false,
    };
  } catch {
    return { ...DEFAULT_FINANCE_NOTIF_PREFS };
  }
}

export function saveFinanceNotifPrefs(prefs: FinanceNotifPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FINANCE_NOTIF_PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("mtb_finance_notif_prefs_change", { detail: prefs }));
  } catch (err) {
    console.warn("Failed to save finance notif prefs:", err);
  }
}

export function isFinanceNotificationAllowed(
  item: { title?: string; message?: string; type?: string },
  prefs?: Partial<FinanceNotifPrefs> | null
): boolean {
  if (!prefs) return true;
  const type = (item.type || "").toLowerCase();
  const text = `${item.title || ""} ${item.message || ""}`.toLowerCase();

  if (text.includes("digest") || text.includes("summary") || text.includes("revenue") || text.includes("daily")) {
    return prefs.notifyDailySummary !== false;
  }

  if (type === "payment" || text.includes("payment") || text.includes("receipt") || text.includes("fee") || text.includes("paid")) {
    return prefs.notifyNewPayment !== false;
  }

  return true;
}

