/**
 * Manual (number-based) payments.
 *
 * Focuser does not process cards in-app. A buyer sends a request message,
 * gets the payment number below, pays it, and the owner activates the plan
 * with the activation code.
 *
 * OWNER: replace these three values with your real details.
 */
export const PAY_NUMBER = "+966 50 000 0000";
export const PAY_NAME = "Muhammad Noman Hussain";
/** Code the owner gives a buyer once their transfer has landed. */
export const ACTIVATION_CODE = "FOCUSER-PAID";

export const PRO_PRICE = "$15";
export const TEACHER_PRICE = "100 SAR";

export type PayRequest = {
  id: string;
  at: number;
  plan: "pro" | "teacher";
  name: string;
  contact: string;
  message: string;
};

const KEY = "focuser.payRequests";

export function loadRequests(): PayRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as PayRequest[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveRequest(req: PayRequest) {
  try {
    localStorage.setItem(KEY, JSON.stringify([req, ...loadRequests()].slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function isActivationCode(input: string) {
  return input.trim().toUpperCase() === ACTIVATION_CODE;
}
