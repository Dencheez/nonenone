export type Details = {
  fullName: string;
  memberId: string;
  birthDate: string;
  cardNumber: string;
  issueDate: string;
  validUntil: string;
  region: string;
  group: string;
};

export type Stored = {
  details: Details;
  locked: boolean;
};

const KEY = "member-card:v1";

export function load(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

/** Сохраняет данные и навсегда блокирует повторное редактирование. */
export function saveOnce(details: Details): Stored {
  const existing = load();
  if (existing?.locked) return existing; // повторная запись запрещена
  const next: Stored = { details, locked: true };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* приватный режим: работаем только в памяти */
  }
  return next;
}
