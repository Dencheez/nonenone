import { useState } from "react";
import { load, saveOnce, type Details, type Stored } from "./storage";
import { copyText } from "./clipboard";
import { useDoubleTap } from "./useDoubleTap";

const REGIONS = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Атырау"];

const EMPTY: Details = {
  fullName: "",
  memberId: "",
  birthDate: "",
  cardNumber: "",
  issueDate: "",
  validUntil: "",
  region: REGIONS[0],
  group: "",
};

type Tab = "doc" | "details";

export default function App() {
  const [stored, setStored] = useState<Stored | null>(() => load());
  const [tab, setTab] = useState<Tab>("doc");
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const locked = stored?.locked ?? false;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" aria-label="Назад" onClick={() => history.back()}>
          ‹
        </button>
        <h1>Карта участника</h1>
        <span className="topbar-spacer" />
      </header>

      <div className="segmented" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "doc"}
          className={tab === "doc" ? "seg active" : "seg"}
          onClick={() => setTab("doc")}
        >
          Документ
        </button>
        <button
          role="tab"
          aria-selected={tab === "details"}
          className={tab === "details" ? "seg active" : "seg"}
          onClick={() => setTab("details")}
        >
          Реквизиты
        </button>
      </div>

      <main className="content">
        {tab === "doc" ? (
          <DocumentTab
            stored={stored}
            onPresent={() => setSheet(true)}
            onShare={() => share(stored, showToast)}
          />
        ) : locked && stored ? (
          <DetailsList
            details={stored.details}
            onCopied={() => showToast("Скопировано")}
            onShare={() => share(stored, showToast)}
          />
        ) : (
          <DetailsForm
            onSave={(d) => {
              setStored(saveOnce(d));
              setTab("doc");
            }}
          />
        )}
      </main>

      {sheet && stored && <CodeSheet card={stored.details.cardNumber} onClose={() => setSheet(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

async function share(stored: Stored | null, toast: (m: string) => void) {
  if (!stored) return toast("Сначала заполните реквизиты");
  const d = stored.details;
  const text = `Карта участника\n${d.fullName}\nID: ${d.memberId}\nНомер: ${d.cardNumber}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Карта участника", text });
      return;
    }
  } catch {
    return; // пользователь закрыл меню «Поделиться»
  }
  toast((await copyText(text)) ? "Скопировано" : "Не удалось поделиться");
}

/* ---------- Вкладка «Документ» ---------- */

function DocumentTab({
  stored,
  onPresent,
  onShare,
}: {
  stored: Stored | null;
  onPresent: () => void;
  onShare: () => void;
}) {
  if (!stored) {
    return <div className="empty">Заполните реквизиты</div>;
  }
  const d = stored.details;
  const initials = d.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <>
      <div className="cards">
        <section className="card card-front">
          <div className="card-org">Клуб «Северный маяк»</div>
          <div className="card-title">Карта участника</div>
          <div className="card-row">
            <div className="avatar">{initials || "?"}</div>
            <dl className="card-fields">
              <dt>ФИО</dt>
              <dd>{d.fullName}</dd>
              <dt>Дата рождения</dt>
              <dd>{d.birthDate}</dd>
              <dt>ID участника</dt>
              <dd>{d.memberId}</dd>
            </dl>
          </div>
        </section>

        <section className="card card-back">
          <div className="card-number">{d.cardNumber}</div>
          <dl className="card-fields wide">
            <dt>Регион</dt>
            <dd>{d.region}</dd>
            <dt>Группа</dt>
            <dd>{d.group}</dd>
            <dt>Выдана / действует до</dt>
            <dd>
              {d.issueDate} — {d.validUntil}
            </dd>
          </dl>
        </section>
      </div>

      <div className="actions">
        <button className="btn primary" onClick={onPresent}>
          Показать код
        </button>
        <button className="btn secondary" onClick={onShare}>
          Отправить
        </button>
      </div>
    </>
  );
}

/* ---------- Вкладка «Реквизиты»: форма (один раз) ---------- */

function DetailsForm({ onSave }: { onSave: (d: Details) => void }) {
  const [d, setD] = useState<Details>(EMPTY);
  const [confirm, setConfirm] = useState(false);

  const set =
    (k: keyof Details) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setD({ ...d, [k]: e.target.value });

  const valid =
    d.fullName.trim() &&
    d.memberId.trim() &&
    d.birthDate.trim() &&
    d.cardNumber.trim() &&
    d.issueDate.trim() &&
    d.validUntil.trim() &&
    d.group.trim();

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        setConfirm(true);
      }}
    >
      <Field label="ФИО" value={d.fullName} onChange={set("fullName")} placeholder="Фамилия Имя Отчество" />
      <Field label="ID участника" value={d.memberId} onChange={set("memberId")} inputMode="numeric" placeholder="ID" />
      <Field label="Дата рождения" value={d.birthDate} onChange={set("birthDate")} placeholder="ДД.ММ.ГГГГ" inputMode="numeric" />
      <Field label="Номер карты" value={d.cardNumber} onChange={set("cardNumber")} placeholder="Номер карты" />
      <Field label="Дата выдачи" value={d.issueDate} onChange={set("issueDate")} placeholder="ДД.ММ.ГГГГ" inputMode="numeric" />
      <Field label="Срок действия" value={d.validUntil} onChange={set("validUntil")} placeholder="ДД.ММ.ГГГГ" inputMode="numeric" />

      <label className="field">
        <span>Регион</span>
        <select value={d.region} onChange={set("region")}>
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>

      <Field label="Группа" value={d.group} onChange={set("group")} placeholder="Например, «Новички»" />

      <p className="hint">После сохранения реквизиты изменить нельзя.</p>

      <button className="btn primary" type="submit" disabled={!valid}>
        Сохранить
      </button>

      {confirm && (
        <div className="overlay" onClick={() => setConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Сохранить реквизиты?</h2>
            <p>Повторное редактирование будет запрещено.</p>
            <div className="dialog-actions">
              <button type="button" className="btn secondary" onClick={() => setConfirm(false)}>
                Проверить ещё раз
              </button>
              <button type="button" className="btn primary" onClick={() => onSave(d)}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        autoCorrect="off"
        enterKeyHint="next"
      />
    </label>
  );
}

/* ---------- Вкладка «Реквизиты»: список (только чтение) ---------- */

function DetailsList({
  details,
  onCopied,
  onShare,
}: {
  details: Details;
  onCopied: () => void;
  onShare: () => void;
}) {
  const rows: [string, string][] = [
    ["ФИО", details.fullName],
    ["ID участника", details.memberId],
    ["Дата рождения", details.birthDate],
    ["Номер карты", details.cardNumber],
    ["Дата выдачи", details.issueDate],
    ["Срок действия", details.validUntil],
    ["Регион", details.region],
    ["Группа", details.group],
  ];

  return (
    <>
      <ul className="rows">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} onCopied={onCopied} />
        ))}
      </ul>
      <p className="hint center">Дважды нажмите на поле, чтобы скопировать</p>
      <div className="actions bottom">
        <button className="btn secondary" onClick={onShare}>
          Отправить
        </button>
      </div>
    </>
  );
}

function Row({ label, value, onCopied }: { label: string; value: string; onCopied: () => void }) {
  const [flash, setFlash] = useState(false);

  const copy = async () => {
    if (await copyText(value)) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 350);
      onCopied();
    }
  };

  const tap = useDoubleTap(copy);

  return (
    <li className={flash ? "row flash" : "row"} {...tap}>
      <div>
        <div className="row-label">{label}</div>
        <div className="row-value">{value}</div>
      </div>
      <span className="copy-icon" aria-hidden>
        ⧉
      </span>
    </li>
  );
}

/* ---------- Нижняя шторка с кодом ---------- */

function CodeSheet({ card, onClose }: { card: string; onClose: () => void }) {
  // Короткий код, производный от номера карты (демо-логика, без криптографии).
  const code = (
    Array.from(card).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 1_000_000, 7) + 1_000_000
  )
    .toString()
    .slice(1);

  return (
    <div className="overlay sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Карта участника</h2>
          <button className="icon-btn" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="sheet-sub">Назовите код сотруднику клуба</p>
        <div className="sheet-code">{code}</div>
      </div>
    </div>
  );
}
