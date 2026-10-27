"use client";

import { useState, useMemo, useEffect } from "react";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];
const GENDERS = ["Male", "Female", "Others"];
const MARITAL = ["Married", "Unmarried", "Widowed", "Divorced"];
const STEPS = ["Personal", "Family", "Parents", "Review"];

const initial = {
  empId: "", empName: "", doj: "", dob: "", gender: "", mobile: "", aadhar: "", marital: "",
  prevEsi: "", prevEsiNo: "", address: "", state: "", pincode: "", photo: null,
  fatherName: "", motherName: "", spouseName: "", spouseDob: "", spousePhoto: null,
  childCount: "0", children: Array.from({ length: 5 }, () => ({ name: "", dob: "", photo: null })),
  includeParents: "", fatherDob: "", fatherPhoto: null, motherDob: "", motherPhoto: null,
};

const css = `
.esi{--ink:#1b2b2a;--muted:#6b7d7b;--line:#e1e9e7;--bg:#f1f5f4;--card:#fff;--brand:#0f766e;--brand-d:#0b5a54;--soft:#e8f3f1;--err:#c0392b;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--ink);background:var(--bg);min-height:100vh;box-sizing:border-box;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
.esi *{box-sizing:border-box}
.esi-wrap{max-width:480px;margin:0 auto;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:var(--bg)}
.esi-head{padding:14px 18px 12px;background:#ffffff;color:#1b2b2a;border-bottom:1px solid #e1e9e7;position:-webkit-sticky;position:sticky;top:0;z-index:4;box-shadow:0 2px 8px rgba(20,50,48,.06)}
.esi-title{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
.esi-title h1{margin:0;font-size:16px;font-weight:700}
.esi-title small{font-size:11px;color:#6b7d7b}
.esi-steps{display:flex}
.esi-step{flex:1;display:flex;flex-direction:column;align-items:center;position:relative}
.esi-step::before{content:"";position:absolute;top:11px;right:50%;width:100%;height:2px;background:#dfe7e5}
.esi-step:first-child::before{display:none}
.esi-step.done::before,.esi-step.on::before{background:#0f766e}
.dot{width:22px;height:22px;border-radius:50%;background:#e6ecea;color:#7a8b89;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;border:2px solid transparent}
.esi-step.done .dot{background:#0f766e;color:#fff}
.esi-step.on .dot{background:#0f766e;color:#fff;box-shadow:0 0 0 3px rgba(15,118,110,.18)}
.esi-step span{margin-top:5px;font-size:10.5px;color:#7a8b89}
.esi-step.on span{color:#1b2b2a;font-weight:600}
.esi-body{flex:1;padding:14px 14px 96px}
.esi-card{background:var(--card);border-radius:16px;padding:16px 14px;margin-bottom:12px;border:1px solid var(--line);box-shadow:0 1px 3px rgba(20,50,48,.04)}
.esi-card h2{margin:0 0 14px;font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px}
.esi-card h2::before{content:"";width:4px;height:14px;border-radius:2px;background:var(--brand)}
.esi-sub{font-size:12px;color:var(--muted);margin:0}
.f{margin-bottom:12px}
.f:last-child{margin-bottom:0}
.f label,.lbl{display:block;font-size:11.5px;font-weight:600;color:#43605d;margin-bottom:5px}
.f input[type=text],.f input[type=tel],.f input[type=date],.f input[type=number],.f select,.f textarea{
  width:100%;font:inherit;font-size:13.5px;padding:0 12px;height:40px;border:1px solid var(--line);border-radius:10px;background:#f8fbfa;color:var(--ink);outline:none;transition:border .15s,box-shadow .15s,background .15s;appearance:none;-webkit-appearance:none}
.f input::placeholder{color:#a3b2b0}
.f input[type=date]{padding-right:8px;min-width:0;line-height:38px}
.f input[type=date]::-webkit-date-and-time-value{text-align:left}
.f input[type=date]::-webkit-calendar-picker-indicator{opacity:.6;cursor:pointer}
.date-input-wrap{position:relative}
.date-input-wrap::after{content:"";position:absolute;right:12px;top:50%;width:16px;height:16px;transform:translateY(-50%);pointer-events:none;background:center/contain no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7d7b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3C/svg%3E")}
.date-input-wrap input.date-picker-native{position:absolute;right:0;top:0;width:42px;height:40px;padding:0;opacity:0;cursor:pointer;z-index:1}
.date-input-wrap input.date-text{padding-right:42px}
.f select::-ms-expand{display:none}
.f input[type=tel],.f input[type=text]{-webkit-appearance:none}
.f select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7d7b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
.f textarea{height:auto;min-height:68px;padding:10px 12px;resize:vertical}
.f input:focus,.f select:focus,.f textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(15,118,110,.12);background:#fff}
.f.bad input,.f.bad select,.f.bad textarea{border-color:var(--err);background:#fff8f7}
.err{color:var(--err);font-size:11px;margin-top:4px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:var(--soft);padding:3px;border-radius:10px;gap:3px}
.chip{position:relative}
.chip input{position:absolute;opacity:0;pointer-events:none}
.chip span{display:block;text-align:center;padding:8px 13px;border:1px solid var(--line);border-radius:999px;font-size:12px;font-weight:600;background:#f8fbfa;color:#43605d;cursor:pointer;transition:all .15s}
.seg .chip span{border:0;border-radius:8px;background:transparent;padding:8px 6px}
.chip input:checked+span{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:0 1px 3px rgba(15,118,110,.3)}
.chip input:focus-visible+span{outline:2px solid rgba(15,118,110,.45);outline-offset:1px}
.photo{display:flex;align-items:center;gap:12px;padding:10px;border:1px dashed #a9cbc6;border-radius:12px;background:#f6fbfa;cursor:pointer}
.photo input{display:none}
.photo-box{width:48px;height:48px;border-radius:50%;background:var(--soft);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;color:var(--brand)}
.photo-box img{width:100%;height:100%;object-fit:cover}
.photo-txt{min-width:0}
.photo-txt b{display:block;font-size:12.5px;color:var(--brand-d)}
.photo-txt small{display:block;font-size:11px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.photo-upload{display:flex;align-items:center;gap:10px;min-height:40px}
.photo-browse{position:relative;display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--brand-d);font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.photo-browse input{position:absolute;width:1px;height:1px;opacity:0}
.photo-thumb{width:56px;height:56px;padding:0;border:1px solid var(--line);border-radius:8px;background:#fff;overflow:hidden;cursor:zoom-in}
.photo-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.photo-filename{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:11px}
.photo-browse:focus-within,.photo-thumb:focus-visible,.photo-preview-close:focus-visible{outline:2px solid rgba(15,118,110,.5);outline-offset:2px}
.photo-preview-overlay{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(13,31,29,.78)}
.photo-preview-dialog{position:relative;max-width:min(900px,100%);max-height:100%;padding:12px;border-radius:14px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.3)}
.photo-preview-dialog img{display:block;max-width:min(850px,85vw);max-height:80vh;object-fit:contain}
.photo-preview-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border:0;border-radius:50%;background:#fff;color:var(--ink);font-size:24px;line-height:1;cursor:pointer;box-shadow:0 1px 6px rgba(0,0,0,.2)}
.f.bad .photo{border-color:var(--err)}
.child{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;background:#fafcfc}
.child:last-child{margin-bottom:0}
.child h3{margin:0 0 10px;font-size:12px;font-weight:700;color:var(--brand-d)}
.child-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
.child-nav span{font-size:12px;font-weight:600;color:var(--muted)}
.child-nav .btn{flex:0 0 auto;min-width:110px}
.review-family-person,.review-children-title,.review-children-table-wrap{grid-column:1/-1}
.review-parent-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:center;gap:12px}
.review-parent-row .sum-photo{justify-content:flex-start;gap:8px}
.review-parent-row .sum-photo img{width:32px;height:32px}
.review-children-title{margin:10px 0 0;font-size:13px;color:var(--brand-d)}
.review-children-table-wrap{width:100%;overflow-x:auto}
.review-children-scroll{max-height:120px;overflow-y:auto}
.review-children-scroll .review-children-table thead{position:sticky;top:0;z-index:1}
.review-children-table{width:100%;border-collapse:collapse;text-align:left;font-size:12.5px}
.review-children-table th,.review-children-table td{padding:4px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
.review-children-table th{background:#f6f9f8;color:#43605d;font-size:11.5px;font-weight:700}
.review-children-table .sum-photo{justify-content:flex-start;gap:8px;padding:0}
.review-children-table .sum-photo img{width:32px;height:32px}
.review-children-table .sum-photo span{font-size:10px}
.review-no-photo{color:var(--muted)}
.bar{position:fixed;left:0;right:0;bottom:0;background:#ffffff;background:rgba(255,255,255,.95);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));z-index:5}
.bar-in{max-width:480px;margin:0 auto;display:flex;gap:8px}
.btn{-webkit-appearance:none;appearance:none;flex:1;-webkit-box-flex:1;font:inherit;font-size:14px;font-weight:600;height:44px;border-radius:12px;border:0;cursor:pointer;transition:background .15s,transform .1s}
.btn:active{transform:scale(.98)}
.btn.pri{background:var(--brand);color:#fff;box-shadow:0 3px 10px rgba(15,118,110,.28)}
.btn.sec{background:var(--soft);color:var(--brand-d);flex:.5}
.btn:disabled{background:#cbd8d6;color:#fff;box-shadow:none;cursor:not-allowed}
.btn:focus-visible{outline:2px solid rgba(15,118,110,.5);outline-offset:2px}
.sum{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #eef3f2;font-size:12.5px}
.sum:last-child{border-bottom:0}
.sum b{font-weight:500;color:var(--muted);flex:none}
.sum span{text-align:right;word-break:break-word;font-weight:600}
.sum-photo{display:flex;align-items:center;justify-content:space-between;padding:7px 0;font-size:12.5px;color:var(--muted)}
.sum-photo img{width:36px;height:36px;border-radius:50%;object-fit:cover}
.decl{display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-size:12.5px;line-height:1.5}
.decl input{-webkit-appearance:checkbox;appearance:auto;width:18px;height:18px;margin:1px 0 0;accent-color:var(--brand);flex:none}
.ok{text-align:center;padding:80px 24px}
.ok-ic{width:64px;height:64px;border-radius:50%;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 0 0 8px var(--soft)}
.ok h2{margin:0 0 6px;font-size:17px}
.ok p{color:var(--muted);margin:0 0 20px;font-size:13px}
.esi-photo-card{display:none}
@media (min-width:768px){
  .esi-wrap{max-width:1200px}
  .esi-body{display:grid;grid-template-columns:minmax(0,1fr);align-content:start;gap:16px}
  .esi-children-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}
  .esi-children-card h2,.esi-children-card>.child{grid-column:1/-1}
  .esi-children-card>.child{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,.7fr) minmax(0,1fr);gap:0 12px}
  .esi-children-card>.child h3{grid-column:1/-1}
  .esi-children-card>.child .f{min-width:0}
  .esi-parents-card{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
  .esi-parents-card>h2,.esi-parents-card>.f,.esi-parents-card>.child{grid-column:1/-1}
  .esi-parents-card>.child{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}
  .esi-parents-card>.child h3{grid-column:1/-1}
  .esi-parents-card>.child .f{min-width:0}
}
@media (min-width:1024px){
  .esi-wrap{max-width:1200px}
  .esi-head{padding:20px 28px 16px}
  .esi-title h1{font-size:20px}
  .esi-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:16px;padding:24px 28px 110px}
  .esi-body.esi-body-wide{grid-template-columns:minmax(0,1fr)}
  .esi-body.esi-body-review{grid-template-columns:repeat(2,minmax(0,1fr))}
  .esi-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:0 16px;padding:20px;margin-bottom:0}
  .esi-card h2,.esi-card>.row2{grid-column:1/-1}
  .esi-card>.f,.child .f{min-width:0}
  .esi-review-personal>.sum,.esi-review-personal>.sum-photo{grid-column:1/-1}
  .esi-review-side{display:flex;flex-direction:column;gap:16px;min-width:0}
  .esi-review-side>.esi-review-family,.esi-review-side>.esi-review-parents{display:block}
  .esi-review-declaration{grid-column:1/-1}
  .esi-review-declaration .decl{white-space:nowrap}
  .child{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,.7fr) minmax(0,1fr);gap:0 12px}
  .child h3{grid-column:1/-1}
  .esi-body-personal{grid-template-columns:repeat(2,minmax(0,1fr))}
  .esi-personal-card,.esi-address-card{grid-column:1/-1}
  .esi-family-card,.esi-spouse-card{grid-column:1/-1}
  .esi-spouse-card{grid-template-columns:repeat(3,minmax(0,1fr))}
  .esi-spouse-card h2{grid-column:1/-1}
  .esi-spouse-card .photo-upload{min-height:40px}
  .esi-children-card{grid-column:1/-1}
  .esi-children-card>.child{grid-column:1/-1}
  .esi-personal-card{grid-template-columns:repeat(3,minmax(0,1fr))}
  .esi-address-card{grid-template-columns:repeat(3,minmax(0,1fr))}
  .esi-personal-card .row2{display:contents}
  .esi-previous-card{width:100%;grid-template-columns:repeat(2,minmax(0,1fr))}
  .esi-photo-card{display:grid}
  .esi-photo-card .photo-upload{align-items:center}
  .esi-address-card .esi-photo-mobile{display:none}
  .esi-address-card textarea{height:40px;min-height:40px;resize:none}
  .esi-previous-card input:disabled{background:#eef3f2;color:#8b9b99;cursor:not-allowed}
  .esi-personal-card .chips.nowrap{flex-wrap:nowrap;gap:3px}
  .esi-personal-card .chips.nowrap .chip{flex:1;min-width:0}
  .esi-personal-card .chips.nowrap .chip span{padding:8px 2px;font-size:10.5px;white-space:nowrap}
}
`;

const Camera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);

function Field({ label, error, children, className = "" }) {
  return (
    <div className={"f" + (error ? " bad" : "") + (className ? ` ${className}` : "")}>
      {label && <label>{label}</label>}
      {children}
      {error && <div className="err">{error}</div>}
    </div>
  );
}

function toGbDate(value) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) return false;
  return true;
}

function DateInput({ value, onChange }) {
  const [text, setText] = useState(() => toGbDate(value));
  const changeText = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 4
      ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
      : digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
    setText(formatted);
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
    if (!match) {
      onChange("");
      return;
    }
    const [, day, month, year] = match;
    const isoDate = `${year}-${month}-${day}`;
    onChange(isValidDate(isoDate) ? isoDate : "");
  };

  const changeDate = (event) => {
    const isoDate = event.target.value;
    setText(toGbDate(isoDate));
    onChange(isoDate);
  };

  return (
    <div className="date-input-wrap">
      <input
        className="date-text"
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        value={text}
        onChange={changeText}
      />
      <input
        className="date-picker-native"
        type="date"
        lang="en-GB"
        aria-label="Choose date from calendar"
        value={value}
        onChange={changeDate}
      />
    </div>
  );
}

function displayDate(value) {
  return toGbDate(value) || value;
}

function Photo({ label, file, onChange, error, className, zoomable = false, browsePreview = false }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    if (!previewOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewOpen]);
  const fileInput = (
    <input type="file" accept="image/*" onChange={(e) => onChange(e.target.files[0] || null)} />
  );
  return (
    <>
      <Field label={label} error={error} className={className}>
        {browsePreview ? (
          <div className="photo-upload">
            <label className="photo-browse">Browse{fileInput}</label>
            {url && (
              <button type="button" className="photo-thumb" aria-label={`View enlarged ${label || "photo"}`} onClick={() => setPreviewOpen(true)}>
                <img src={url} alt="" />
              </button>
            )}
            {file && <span className="photo-filename">{file.name}</span>}
          </div>
        ) : (
          <label className="photo">
            <div className="photo-box">{url ? <img src={url} alt="" /> : <Camera />}</div>
            <div className="photo-txt">
              <b>{file ? "Change photo" : "Tap to upload"}</b>
              <small>{file ? file.name : "JPG or PNG"}</small>
            </div>
            {fileInput}
          </label>
        )}
      </Field>
      {zoomable && previewOpen && url && (
        <div className="photo-preview-overlay" role="presentation" onClick={() => setPreviewOpen(false)}>
          <div
            className="photo-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Enlarged ${label || "photo"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="photo-preview-close" aria-label="Close enlarged photo" onClick={() => setPreviewOpen(false)}>
              ×
            </button>
            <img src={url} alt="Enlarged employee photograph" />
          </div>
        </div>
      )}
    </>
  );
}

function Chips({ name, options, value, onChange, seg, nowrap }) {
  return (
    <div className={"chips" + (seg ? " seg" : "") + (nowrap ? " nowrap" : "")}>
      {options.map((o) => (
        <label className="chip" key={o}>
          <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

function Summary({ rows }) {
  return rows.filter((r) => r[1]).map(([k, v]) => (
    <div className="sum" key={k}><b>{k}</b><span>{v}</span></div>
  ));
}

function PhotoRow({ label, file }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  if (!url) return null;
  return <div className="sum-photo"><span>{label}</span><img src={url} alt={label} /></div>;
}

export default function EmployeeESIForm() {
  const [step, setStep] = useState(0);
  const [childIndex, setChildIndex] = useState(0);
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState({});
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };
  const setChild = (i, k, v) => {
    setD((p) => ({ ...p, children: p.children.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));
    setErrors((p) => ({ ...p, [`c${i}${k}`]: undefined }));
  };

  const count = Number(d.childCount);
  const married = d.marital === "Married";

  const validate = () => {
    const e = {};
    const req = (k, msg = "Required") => { if (!String(d[k] ?? "").trim()) e[k] = msg; };
    const dateReq = (k) => {
      req(k);
      if (d[k] && !isValidDate(d[k])) e[k] = "Enter a valid date as DD/MM/YYYY";
    };
    if (step === 0) {
      req("empId"); req("empName"); dateReq("doj"); dateReq("dob"); req("gender", "Select gender");
      req("marital", "Select marital status"); req("address"); req("state", "Select state");
      if (!/^[6-9]\d{9}$/.test(d.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
      if (!/^\d{12}$/.test(d.aadhar)) e.aadhar = "Aadhar must be 12 digits";
      if (!/^\d{6}$/.test(d.pincode)) e.pincode = "Pincode must be 6 digits";
      if (!d.prevEsi) e.prevEsi = "Choose yes or no";
      if (d.prevEsi === "Yes" && !d.prevEsiNo.trim()) e.prevEsiNo = "Enter previous ESI number";
      if (!d.photo) e.photo = "Upload your photograph";
    }
    if (step === 1) {
      req("fatherName"); req("motherName");
      if (married) {
        req("spouseName"); dateReq("spouseDob");
        if (!d.spousePhoto) e.spousePhoto = "Upload spouse photograph";
      }
      for (let i = 0; i < count; i++) {
        if (!d.children[i].name.trim()) e[`c${i}name`] = "Required";
        if (!d.children[i].dob) e[`c${i}dob`] = "Required";
        else if (!isValidDate(d.children[i].dob)) e[`c${i}dob`] = "Enter a valid date as DD/MM/YYYY";
        if (!d.children[i].photo) e[`c${i}photo`] = "Upload photograph";
      }
    }
    if (step === 2) {
      if (!d.includeParents) e.includeParents = "Choose yes or no";
      if (d.includeParents === "Yes") {
        dateReq("fatherDob"); dateReq("motherDob");
        if (!d.fatherPhoto) e.fatherPhoto = "Upload father's photo";
        if (!d.motherPhoto) e.motherPhoto = "Upload mother's photo";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) { setStep((s) => s + 1); window.scrollTo?.({ top: 0 }); } };
  const back = () => { setStep((s) => s - 1); window.scrollTo?.({ top: 0 }); };
  const submit = () => {
    if (!agree) return;
    // Replace with your API call, e.g. build FormData from `d` and POST it.
    console.log("Submitted:", d);
    setDone(true);
  };
  const reset = () => { setD(initial); setStep(0); setAgree(false); setDone(false); setErrors({}); };

  const num = (k, max) => (e) => set(k, e.target.value.replace(/\D/g, "").slice(0, max));

  if (done) {
    return (
      <div className="esi"><style>{css}</style>
        <div className="esi-wrap"><div className="ok">
          <div className="ok-ic"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>
          <h2>Details submitted</h2>
          <p>Thank you,Your ESI details have been recorded.</p>
          <button className="btn pri" style={{ width: "100%" }} onClick={reset}>Fill another form</button>
        </div></div>
      </div>
    );
  }

  return (
    <div className="esi">
      <style>{css}</style>
      <div className="esi-wrap">
        <header className="esi-head">
          <div className="esi-title"><h1>ESI employee details</h1><small>Step {step + 1} of {STEPS.length}</small></div>
          <div className="esi-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={"esi-step" + (i < step ? " done" : i === step ? " on" : "")}>
                <div className="dot">{i < step ? "✓" : i + 1}</div><span>{s}</span>
              </div>
            ))}
          </div>
        </header>

        <main className={"esi-body" + (step === 0 ? " esi-body-personal" : "") + (step === 2 ? " esi-body-wide" : "") + (step === 3 ? " esi-body-review" : "")}>
          {step === 0 && (
            <>
              <section className="esi-card esi-personal-card">
                <h2>Personal details</h2>
                <Field label="Employee ID" error={errors.empId}>
                  <input type="text" value={d.empId} onChange={(e) => set("empId", e.target.value)} />
                </Field>
                <Field label="Employee name" error={errors.empName}>
                  <input type="text" value={d.empName} onChange={(e) => set("empName", e.target.value)} />
                </Field>
                <div className="row2">
                  <Field label="Date of joining" error={errors.doj}>
                    <DateInput value={d.doj} onChange={(v) => set("doj", v)} />
                  </Field>
                  <Field label="Date of birth" error={errors.dob}>
                    <DateInput value={d.dob} onChange={(v) => set("dob", v)} />
                  </Field>
                </div>
                <Field label="Gender" error={errors.gender}>
                  <Chips seg name="gender" options={GENDERS} value={d.gender} onChange={(v) => set("gender", v)} />
                </Field>
                <Field label="Mobile number" error={errors.mobile}>
                  <input type="tel" inputMode="numeric" placeholder="10-digit number" value={d.mobile} onChange={num("mobile", 10)} />
                </Field>
                <Field label="Aadhar number" error={errors.aadhar}>
                  <input type="tel" inputMode="numeric" placeholder="12-digit number" value={d.aadhar} onChange={num("aadhar", 12)} />
                </Field>
                <Field label="Marital status" error={errors.marital}>
                  <Chips name="marital" options={MARITAL} value={d.marital} onChange={(v) => set("marital", v)} nowrap />
                </Field>
              </section>

              <section className="esi-card esi-previous-card">
                <h2>Previous ESI</h2>
                <Field label="Do you have a previous ESI number?" error={errors.prevEsi}>
                  <Chips
                    seg
                    name="prevEsi"
                    options={["Yes", "No"]}
                    value={d.prevEsi}
                    onChange={(v) => {
                      set("prevEsi", v);
                      if (v === "No") set("prevEsiNo", "");
                    }}
                  />
                </Field>
                <Field label="Previous ESI number" error={errors.prevEsiNo}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={d.prevEsiNo}
                    onChange={num("prevEsiNo", 17)}
                    disabled={d.prevEsi !== "Yes"}
                    placeholder={d.prevEsi === "Yes" ? "Enter previous ESI number" : "Select Yes to enter a number"}
                  />
                </Field>
              </section>

              <section className="esi-card esi-photo-card">
                <h2>Employee photograph</h2>
                <Photo label="" file={d.photo} onChange={(f) => set("photo", f)} error={errors.photo} zoomable browsePreview />
              </section>

              <section className="esi-card esi-address-card">
                <h2>Address</h2>
                <Field label="State" error={errors.state}>
                  <select value={d.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode" error={errors.pincode}>
                  <input type="tel" inputMode="numeric" value={d.pincode} onChange={num("pincode", 6)} />
                </Field>
                <Field label="Address" error={errors.address}>
                  <textarea value={d.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Photo label="Employee photograph" file={d.photo} onChange={(f) => set("photo", f)} error={errors.photo} className="esi-photo-mobile" zoomable browsePreview />
              </section>
            </>
          )}

          {step === 1 && (
            <>
              <section className="esi-card esi-family-card">
                <h2>Family details</h2>
                <Field label="Father name" error={errors.fatherName}>
                  <input type="text" value={d.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
                </Field>
                <Field label="Mother name" error={errors.motherName}>
                  <input type="text" value={d.motherName} onChange={(e) => set("motherName", e.target.value)} />
                </Field>
              </section>

              {married && (
                <section className="esi-card esi-spouse-card">
                  <h2>Spouse</h2>
                  <Field label="Spouse name" error={errors.spouseName}>
                    <input type="text" value={d.spouseName} onChange={(e) => set("spouseName", e.target.value)} />
                  </Field>
                  <Field label="Spouse date of birth" error={errors.spouseDob}>
                    <DateInput value={d.spouseDob} onChange={(v) => set("spouseDob", v)} />
                  </Field>
                  <Photo label="Spouse photograph" file={d.spousePhoto} onChange={(f) => set("spousePhoto", f)} error={errors.spousePhoto} zoomable browsePreview />
                </section>
              )}

              <section className="esi-card esi-children-card">
                <h2>Children</h2>
                <Field label="Number of children">
                  <select
                    value={d.childCount}
                    onChange={(e) => {
                      const nextCount = Number(e.target.value);
                      set("childCount", e.target.value);
                      setChildIndex((current) => Math.min(current, Math.max(0, nextCount - 1)));
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                {count > 1 && (
                  <div className="child-nav">
                    <button type="button" className="btn sec" disabled={childIndex === 0} onClick={() => setChildIndex((current) => current - 1)}>
                      Previous child
                    </button>
                    <span aria-live="polite">Child {childIndex + 1} of {count}</span>
                    <button type="button" className="btn sec" disabled={childIndex === count - 1} onClick={() => setChildIndex((current) => current + 1)}>
                      Next child
                    </button>
                  </div>
                )}
                {count > 0 && (
                  <div className="child" key={childIndex}>
                    <h3>Child {childIndex + 1}</h3>
                    <Field label={`Child ${childIndex + 1} name`} error={errors[`c${childIndex}name`]}>
                      <input type="text" value={d.children[childIndex].name} onChange={(e) => setChild(childIndex, "name", e.target.value)} />
                    </Field>
                    <Field label={`Child ${childIndex + 1} date of birth`} error={errors[`c${childIndex}dob`]}>
                      <DateInput value={d.children[childIndex].dob} onChange={(v) => setChild(childIndex, "dob", v)} />
                    </Field>
                    <Photo label={`Child ${childIndex + 1} photograph`} file={d.children[childIndex].photo} onChange={(f) => setChild(childIndex, "photo", f)} error={errors[`c${childIndex}photo`]} zoomable browsePreview />
                  </div>
                )}
              </section>
            </>
          )}

          {step === 2 && (
            <section className="esi-card esi-parents-card">
              <h2>Parents</h2>
              <Field label="Do you want your parents included in the ESI details?" error={errors.includeParents}>
                <Chips seg name="parents" options={["Yes", "No"]} value={d.includeParents} onChange={(v) => set("includeParents", v)} />
              </Field>
              {d.includeParents === "Yes" && (
                <>
                  <div className="child esi-parent-row">
                    <h3>Father</h3>
                    <Field label="Father date of birth" error={errors.fatherDob}>
                      <DateInput value={d.fatherDob} onChange={(v) => set("fatherDob", v)} />
                    </Field>
                    <Photo label="Father image" file={d.fatherPhoto} onChange={(f) => set("fatherPhoto", f)} error={errors.fatherPhoto} zoomable browsePreview />
                  </div>
                  <div className="child esi-parent-row">
                    <h3>Mother</h3>
                    <Field label="Mother date of birth" error={errors.motherDob}>
                      <DateInput value={d.motherDob} onChange={(v) => set("motherDob", v)} />
                    </Field>
                    <Photo label="Mother image" file={d.motherPhoto} onChange={(f) => set("motherPhoto", f)} error={errors.motherPhoto} zoomable browsePreview />
                  </div>
                </>
              )}
            </section>
          )}

          {step === 3 && (
            <>
              <section className="esi-card esi-review-personal">
                <h2>Personal details</h2>
                <Summary rows={[
                  ["Employee ID", d.empId], ["Name", d.empName], ["Date of joining", displayDate(d.doj)],
                  ["Date of birth", displayDate(d.dob)],["Gender", d.gender], ["Mobile", d.mobile], 
                  ["Aadhar", d.aadhar], ["Marital status", d.marital],
                  ["Previous ESI", d.prevEsi === "Yes" ? d.prevEsiNo : "No"], ["Address", d.address],
                  ["State", d.state], ["Pincode", d.pincode],
                ]} />
                <PhotoRow label="Photograph" file={d.photo} />
              </section>

              <div className="esi-review-side">
                <section className="esi-card esi-review-family">
                  <h2>Family details</h2>
                  <div className="review-family-person"><Summary rows={[["Father", d.fatherName]]} /></div>
                  <div className="review-family-person"><Summary rows={[["Mother", d.motherName]]} /></div>
                  {married && (
                    <div className="review-family-person review-children-table-wrap">
                    <table className="review-children-table">
                      <thead>
                        <tr><th>Spouse name</th><th>Date of birth</th><th>Image</th></tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{d.spouseName || "Not entered"}</td>
                          <td>{displayDate(d.spouseDob) || "Not entered"}</td>
                          <td>{d.spousePhoto ? <PhotoRow label="Spouse" file={d.spousePhoto} /> : <span className="review-no-photo">Not uploaded</span>}</td>
                        </tr>
                      </tbody>
                    </table>
                    </div>
                  )}
                  <h3 className="review-children-title">Children</h3>
                  <div className={"review-children-table-wrap" + (count > 2 ? " review-children-scroll" : "")}>
                    <table className="review-children-table">
                      <thead>
                        <tr><th>Child name</th><th>Date of birth</th><th>Image</th></tr>
                      </thead>
                      <tbody>
                        {d.children.slice(0, count).map((child, i) => (
                          <tr key={i}>
                            <td>{child.name || "Not entered"}</td>
                            <td>{displayDate(child.dob) || "Not entered"}</td>
                            <td>{child.photo ? <PhotoRow label={`Child ${i + 1}`} file={child.photo} /> : <span className="review-no-photo">Not uploaded</span>}</td>
                          </tr>
                        ))}
                        {count === 0 && <tr><td colSpan="3">No children added</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="esi-card esi-review-parents">
                  <h2>Parents in ESI</h2>
                  <Summary rows={[["Included", d.includeParents]]} />
                  {d.includeParents === "Yes" && (
                    <div className="review-children-table-wrap">
                      <table className="review-children-table">
                        <thead>
                          <tr><th>Parent</th><th>Date of birth</th><th>Image</th></tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Father</td>
                            <td>{displayDate(d.fatherDob) || "Not entered"}</td>
                            <td>{d.fatherPhoto ? <PhotoRow label="" file={d.fatherPhoto} /> : <span className="review-no-photo">Not uploaded</span>}</td>
                          </tr>
                          <tr>
                            <td>Mother</td>
                            <td>{displayDate(d.motherDob) || "Not entered"}</td>
                            <td>{d.motherPhoto ? <PhotoRow label="" file={d.motherPhoto} /> : <span className="review-no-photo">Not uploaded</span>}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>

              <section className="esi-card esi-review-declaration">
                <label className="decl">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span><b>Declaration:</b> I hereby confirm that the information provided is true to the best of my knowledge.</span>
                </label>
              </section>
            </>
          )}
        </main>

        <div className="bar">
          <div className="bar-in">
            {step > 0 && <button className="btn sec" onClick={back}>Back</button>}
            {step < 3 ? (
              <button className="btn pri" onClick={next}>Next</button>
            ) : (
              <button className="btn pri" onClick={submit} disabled={!agree}>Submit</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
