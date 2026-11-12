'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/*
  Presentation only. The page structure, class names and logic are unchanged.
  - Every rule is scoped under "main.esiApplicationsPage" so it wins over older global rules
    without needing !important.
  - Compact sizing: smaller padding, type and photo size. Row / column structure of the page is
    not changed. Only the photo preview and the icon download button get explicit sizes.
  - Works on Windows 7, 10 and 11: no gap, inset, :has, aspect-ratio or color-mix; -webkit-
    prefixes written by hand; :focus fallback for :focus-visible; Segoe UI font stack.
*/
const esiDetailsCss = `
main.esiApplicationsPage{
  background:#EAF3F5;
  background:linear-gradient(180deg,#E6F1F4 0%,#F0F7F8 50%,#E3EEF1 100%);
  color:#183B4E;
  font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  -webkit-text-size-adjust:100%;text-size-adjust:100%;
}

/* ---------- Header banner ---------- */
main.esiApplicationsPage .esiApplicationsHeader{
  background:#102A43;
  background:linear-gradient(135deg,#102A43 0%,#1B4466 100%);
  color:#fff;
  padding:12px 18px;
  border-radius:12px;
  border-bottom:3px solid #0D9488;
  box-shadow:0 6px 20px rgba(16,42,67,.22);
}
main.esiApplicationsPage .esiApplicationsHeader h1{
  margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.2px;line-height:1.25;
}
main.esiApplicationsPage .esiApplicationsHeader p{
  margin:2px 0 0;color:#B6C8DA;font-size:13px;font-weight:500;
}
main.esiApplicationsPage .esiApplicationsStatusCard{
  display:grid;grid-template-columns:repeat(3,max-content);gap:16px;min-width:390px;width:fit-content;
  background:rgba(255,255,255,.10);
  border-radius:8px;
  padding:7px 12px;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);
}
main.esiApplicationsPage .esiApplicationsStatusCard .esiApplicationsDetailItem{
  background:transparent;padding:0;border-radius:0;box-shadow:none;gap:2px;
}
main.esiApplicationsPage .esiApplicationsStatusCard .esiApplicationsDetailItem span{color:#B6C8DA;font-size:11px}
main.esiApplicationsPage .esiApplicationsStatusCard .esiApplicationsDetailItem strong{color:#fff;font-size:12px}

/* Back button */
main.esiApplicationsPage .esiApplicationsBackButton{
  background:#fff;color:#102A43;
  border:0;border-radius:8px;padding:8px 14px;
  font-family:inherit;font-size:13px;font-weight:600;
  cursor:pointer;-webkit-appearance:none;appearance:none;
  box-shadow:0 2px 6px rgba(0,0,0,.18);
  transition:background-color .15s ease,color .15s ease,box-shadow .15s ease;
}
main.esiApplicationsPage .esiApplicationsBackButton:hover{background:#CCFBF1;color:#115E59;box-shadow:0 4px 10px rgba(0,0,0,.22)}
main.esiApplicationsPage .esiApplicationsBackButton:focus{outline:3px solid #5EEAD4;outline-offset:2px}
main.esiApplicationsPage .esiApplicationsBackButton:focus:not(:focus-visible){outline:none}
main.esiApplicationsPage .esiApplicationsEditActions{display:flex;align-items:center;gap:8px;flex:none}
main.esiApplicationsPage .esiApplicationsEditButton,
main.esiApplicationsPage .esiApplicationsSaveButton,
main.esiApplicationsPage .esiApplicationsCancelButton{
  min-height:36px;padding:7px 12px;border:0;border-radius:8px;font:inherit;font-size:13px;font-weight:600;
  cursor:pointer;-webkit-appearance:none;appearance:none;white-space:nowrap;
}
main.esiApplicationsPage .esiApplicationsEditButton{background:#CCFBF1;color:#115E59}
main.esiApplicationsPage .esiApplicationsSaveButton{background:#0D9488;color:#fff}
main.esiApplicationsPage .esiApplicationsCancelButton{background:#fff;color:#102A43}
main.esiApplicationsPage .esiApplicationsEditButton:disabled,
main.esiApplicationsPage .esiApplicationsSaveButton:disabled,
main.esiApplicationsPage .esiApplicationsCancelButton:disabled{cursor:wait;opacity:.65}
main.esiApplicationsPage .esiApplicationsEditField{
  box-sizing:border-box;width:100%;min-height:32px;padding:5px 7px;border:1px solid #94A3B8;border-radius:5px;
  background:#fff;color:#102A43;font:inherit;font-size:13px;
}
main.esiApplicationsPage textarea.esiApplicationsEditField{min-height:64px;resize:vertical}
main.esiApplicationsPage .esiApplicationsEditField:focus{outline:2px solid #0D9488;outline-offset:1px}
main.esiApplicationsPage .esiApplicationsChildCountInput{width:64px;margin-left:6px}
main.esiApplicationsPage.esiApplicationsEditing .esiApplicationsDetailsSections{
  scrollbar-width:none;-ms-overflow-style:none;
}
main.esiApplicationsPage.esiApplicationsEditing .esiApplicationsDetailsSections::-webkit-scrollbar{display:none;width:0;height:0}
main.esiApplicationsPage .esiApplicationsChildNotFound{
  display:flex;flex-direction:column;align-items:center;gap:8px;margin:0;color:#829AB1;font-size:13px;font-weight:600;
}
main.esiApplicationsPage .esiApplicationsChildNotFound img{display:block;width:120px;height:107px;object-fit:contain}
main.esiApplicationsPage .esiApplicationsChildAction{
  margin-top:10px;padding:6px 10px;border:1px solid #0D9488;border-radius:6px;background:#fff;
  color:#0F766E;font:inherit;font-size:12px;font-weight:600;cursor:pointer;
}
main.esiApplicationsPage .esiApplicationsChildRemove{border-color:#FCA5A5;color:#B91C1C}
main.esiApplicationsPage .esiApplicationsChildAction:disabled{cursor:wait;opacity:.65}
main.esiApplicationsPage .esiApplicationsImageProcessing{margin:6px 0 0;color:#52667A;font-size:12px}
main.esiApplicationsPage .esiApplicationsBrowseImage{
  display:inline-flex;align-items:center;margin-top:8px;padding:6px 9px;border:1px solid #0D9488;border-radius:6px;
  background:#fff;color:#0F766E;font-size:12px;font-weight:600;cursor:pointer;
}
main.esiApplicationsPage .esiApplicationsBrowseImage input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}
main.esiApplicationsPage .esiApplicationsSaveOverlay{
  position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(15,23,42,.62);
}
main.esiApplicationsPage .esiApplicationsSaveDialog{
  width:min(100%,360px);padding:24px;border-radius:12px;border-top:4px solid #0D9488;background:#fff;
  color:#102A43;text-align:center;box-shadow:0 20px 55px rgba(0,0,0,.3);
}
main.esiApplicationsPage .esiApplicationsSaveDialog h2{margin:0 0 8px;font-size:19px}
main.esiApplicationsPage .esiApplicationsSaveDialog p{margin:0 0 18px;color:#52667A;font-size:14px}
main.esiApplicationsPage .esiApplicationsSaveDialog button{
  min-height:36px;padding:7px 16px;border:0;border-radius:8px;background:#0D9488;color:#fff;
  font:inherit;font-size:13px;font-weight:600;cursor:pointer;
}

/* ---------- Status messages ---------- */
main.esiApplicationsPage .esiApplicationsNoDetails{color:#52667A;font-size:14px;font-weight:500}
main.esiApplicationsPage .esiApplicationsMessage{
  border-radius:10px;padding:12px 16px;font-size:14px;font-weight:600;
}
main.esiApplicationsPage .esiApplicationsError{
  background:#FEE2E2;color:#991B1B;box-shadow:inset 4px 0 0 #DC2626,inset 0 0 0 1px #FCA5A5;
}

/* ---------- Section cards ---------- */
main.esiApplicationsPage .esiApplicationsDetailsSection{
  background:#fff;
  border-radius:12px;
  border-top:3px solid #0D9488;
  padding:14px 16px;
  box-shadow:0 1px 2px rgba(16,42,67,.06),0 4px 14px rgba(16,42,67,.07);
}
main.esiApplicationsPage .esiApplicationsDetailsSection h3{
  margin:0 0 10px;padding-bottom:8px;
  color:#102A43;font-size:15px;font-weight:700;letter-spacing:-.1px;line-height:1.3;
  border-bottom:1px solid #E1EAEF;
}

/* ---------- Detail items (label + value) ---------- */
main.esiApplicationsPage .esiApplicationsDetailItem{
  background:#F5FAFB;
  border-radius:8px;
  padding:6px 10px;
  box-shadow:inset 0 0 0 1px #E1EAEF;
}
main.esiApplicationsPage .esiApplicationsDetailItem span{
  color:#52667A;font-size:11.5px;font-weight:600;line-height:1.3;
}
main.esiApplicationsPage .esiApplicationsDetailItem strong{
  color:#102A43;font-size:13.5px;font-weight:600;line-height:1.35;word-wrap:break-word;overflow-wrap:break-word;
}

/* ---------- Photographs ---------- */
main.esiApplicationsPage .esiApplicationsImageButton{
  display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;vertical-align:top;line-height:0;
  background:transparent;border:0;padding:0;cursor:pointer;
  border-radius:10px;-webkit-appearance:none;appearance:none;
  transition:-webkit-transform .18s ease,box-shadow .18s ease;
  transition:transform .18s ease,box-shadow .18s ease;
}
main.esiApplicationsPage .esiApplicationsImageButton:hover{
  -webkit-transform:scale(1.04);transform:scale(1.04);box-shadow:0 8px 20px rgba(16,42,67,.25);
}
main.esiApplicationsPage .esiApplicationsImageButton:focus{outline:3px solid #0D9488;outline-offset:3px}
main.esiApplicationsPage .esiApplicationsImageButton:focus:not(:focus-visible){outline:none}
main.esiApplicationsPage .esiApplicationsDetailPreview{
  width:88px;height:88px;background:#E6F1F4;border-radius:10px;
  box-shadow:0 0 0 2px #fff,0 0 0 3px #CFE0E6,0 4px 10px rgba(16,42,67,.15);
  object-fit:cover;
}
main.esiApplicationsPage .esiApplicationsDetailPreviewPlaceholder{
  display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;vertical-align:top;
  box-sizing:border-box;width:88px;height:88px;text-align:center;
  background:#F1F6F8;color:#829AB1;font-size:12px;font-weight:600;
  border-radius:10px;outline:1px dashed #B8C9D3;outline-offset:-1px;
}
main.esiApplicationsPage .esiApplicationsDownloadButton,
main.esiApplicationsPage .esiApplicationsDownloadPlaceholder{
  display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;vertical-align:top;
  box-sizing:border-box;width:30px;height:30px;margin:6px 0 0;padding:0;font-size:0;line-height:0;
}
main.esiApplicationsPage .esiApplicationsDownloadPlaceholder{visibility:hidden}
main.esiApplicationsPage .esiApplicationsDownloadButton{
  background:#fff;color:#0F766E;text-decoration:none;
  border-radius:8px;box-shadow:inset 0 0 0 1px #0D9488;
  transition:background-color .15s ease,color .15s ease;
}
main.esiApplicationsPage .esiApplicationsDownloadButton:hover{background:#0D9488;color:#fff}
main.esiApplicationsPage .esiApplicationsDownloadButton:focus{outline:3px solid #5EEAD4;outline-offset:2px}
main.esiApplicationsPage .esiApplicationsDownloadButton:focus:not(:focus-visible){outline:none}

/* ---------- Children ---------- */
main.esiApplicationsPage .esiApplicationsChildDetails{
  background:#F5FAFB;
  border-radius:10px;
  padding:10px 12px;
  box-shadow:inset 3px 0 0 #0D9488,inset 0 0 0 1px #E1EAEF;
}
main.esiApplicationsPage .esiApplicationsChildDetails h4{
  margin:0 0 6px;color:#0F766E;font-size:14px;font-weight:700;
}
main.esiApplicationsPage .esiApplicationsChildDetails .esiApplicationsDetailItem{
  background:#fff;
}

/* ---------- Full image viewer ---------- */
main.esiApplicationsPage .esiApplicationsImageOverlay{
  background:rgba(10,20,30,.78);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
}
main.esiApplicationsPage .esiApplicationsImageDialog{
  background:#fff;border-radius:18px;border-top:5px solid #0D9488;
  box-shadow:0 24px 64px rgba(0,0,0,.4);
}
main.esiApplicationsPage .esiApplicationsImageDialog p{
  color:#102A43;font-size:15px;font-weight:700;
}
main.esiApplicationsPage .esiApplicationsFullImage{border-radius:12px}
main.esiApplicationsPage .esiApplicationsImageClose{
  background:#102A43;color:#fff;border:0;border-radius:50%;
  font-family:inherit;font-weight:600;line-height:1;cursor:pointer;
  -webkit-appearance:none;appearance:none;
  box-shadow:0 2px 8px rgba(0,0,0,.25);
  transition:background-color .15s ease;
}
main.esiApplicationsPage .esiApplicationsImageClose:hover{background:#DC2626}
main.esiApplicationsPage .esiApplicationsImageClose:focus{outline:3px solid #5EEAD4;outline-offset:2px}
main.esiApplicationsPage .esiApplicationsImageClose:focus:not(:focus-visible){outline:none}

/* ---------- Print: plain and ink-friendly ---------- */
@media print{
  main.esiApplicationsPage{background:#fff}
  main.esiApplicationsPage .esiApplicationsDetailsSection{box-shadow:none;border:1px solid #CBD5E1}
  main.esiApplicationsPage .esiApplicationsEditActions{display:none}
}

@media (max-width:800px){
  main.esiApplicationsPage .esiApplicationsStatusCard{
    grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:0;width:100%;padding:7px 10px;
  }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion:reduce){
  main.esiApplicationsPage *{transition:none !important}
}
`;

const DATE_FIELDS = new Set([
  'DOJ', 'DOB', 'SpouseDOB',
  'Child1DOB', 'Child2DOB', 'Child3DOB',
  'Child4DOB', 'Child5DOB', 'FatherDOB', 'MotherDOB',
  'CreatedAt', 'UpdatedAt', 'UptdAt',
]);

const EDITABLE_FIELDS = [
  'EmpName', 'DOJ', 'DOB', 'Gender', 'MobileNo', 'AadharNo',
  'MaritalStatus', 'HasPrevESI', 'PrevESINo', 'Address', 'State',
  'Pincode', 'FatherName', 'MotherName', 'SpouseName', 'SpouseDOB',
  'ChildCount', 'IncludeParents', 'FatherDOB', 'MotherDOB',
  'Child1Name', 'Child1DOB', 'Child2Name', 'Child2DOB',
  'Child3Name', 'Child3DOB', 'Child4Name', 'Child4DOB',
  'Child5Name', 'Child5DOB', 'EmpImg', 'SpouseImg', 'FatherImg', 'MotherImg', 'Child1Img', 'Child2Img',
  'Child3Img', 'Child4Img', 'Child5Img',
];
const EDITABLE_DATE_FIELDS = new Set([
  'DOJ', 'DOB', 'SpouseDOB', 'FatherDOB', 'MotherDOB',
  'Child1DOB', 'Child2DOB', 'Child3DOB', 'Child4DOB', 'Child5DOB',
]);
const EDITABLE_BOOLEAN_FIELDS = new Set(['HasPrevESI', 'IncludeParents']);
const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

const IMAGE_FIELDS = [
  ['Employee photograph', 'EmpImg', 'Img'],
  ['Spouse photograph', 'SpouseImg', 'SpouseImg'],
  ['Father photograph', 'FatherImg', 'FatherImg'],
  ['Mother photograph', 'MotherImg', 'MotherImg'],
];
const EDITABLE_PHOTO_FIELDS = IMAGE_FIELDS.map(([, field]) => field);

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatDate(value) {
  const isoDate = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return displayValue(value);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
}

async function compressPhoto(file) {
  const maxSize = 100 * 1024;
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression is unavailable in this browser.');

    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    let width = Math.max(1, Math.round(image.width * scale));
    let height = Math.max(1, Math.round(image.height * scale));
    for (let resizeAttempt = 0; resizeAttempt < 10; resizeAttempt++) {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of [0.82, 0.65, 0.48, 0.35]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob) throw new Error('Could not compress the photograph.');
        if (blob.size < maxSize) {
          const compressedFile = new File([blob], 'child-photo.jpg', { type: 'image/jpeg' });
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Unable to read the compressed photograph.'));
            reader.onerror = () => reject(new Error('Unable to read the compressed photograph.'));
            reader.readAsDataURL(compressedFile);
          });
        }
      }

      width = Math.max(64, Math.floor(width * 0.75));
      height = Math.max(64, Math.floor(height * 0.75));
      if (width === 64 && height === 64) break;
    }

    throw new Error('Could not compress the photograph below 100 KB.');
  } finally {
    image.close();
  }
}

function DetailValue({ label, value, field, editing = false, onChange }) {
  const formattedValue = ['CreatedAt', 'UptdAt'].includes(field) && value
    ? formatDate(value)
    : value && DATE_FIELDS.has(field) ? formatDate(value) : displayValue(value);
  return (
    <div className="esiApplicationsDetailItem">
      <span>{label}</span>
      {editing && EDITABLE_FIELDS.includes(field) ? (
        EDITABLE_DATE_FIELDS.has(field) ? (
          <input
            className="esiApplicationsEditField"
            type="date"
            aria-label={label}
            value={typeof value === 'string' ? value.slice(0, 10) : ''}
            onChange={(event) => onChange(field, event.target.value || null)}
          />
        ) : field === 'Gender' ? (
          <select
            className="esiApplicationsEditField"
            aria-label={label}
            value={GENDER_OPTIONS.includes(value) ? value : ''}
            onChange={(event) => onChange(field, event.target.value)}
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
          </select>
        ) : EDITABLE_BOOLEAN_FIELDS.has(field) ? (
          <select
            className="esiApplicationsEditField"
            aria-label={label}
            value={value ? 'true' : 'false'}
            onChange={(event) => onChange(field, event.target.value === 'true')}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        ) : field === 'Address' ? (
          <textarea
            className="esiApplicationsEditField"
            aria-label={label}
            value={value ?? ''}
            onChange={(event) => onChange(field, event.target.value)}
          />
        ) : (
          <input
            className="esiApplicationsEditField"
            type="text"
            aria-label={label}
            inputMode={['MobileNo', 'AadharNo', 'Pincode'].includes(field) ? 'numeric' : undefined}
            maxLength={{ MobileNo: 10, AadharNo: 12, Pincode: 6 }[field]}
            value={value ?? ''}
            onChange={(event) => onChange(field, event.target.value)}
          />
        )
      ) : <strong>{formattedValue}</strong>}
    </div>
  );
}

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 4v11" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

function DetailImage({
  label, src, employeeId, downloadSuffix, onImageClick, reserveSpace = false, editing = false, onBrowse,
}) {
  const safeEmployeeId = employeeId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const mimeType = src?.slice(5, src.indexOf(';'));
  const extension = mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'img';
  return (
    <div className="esiApplicationsDetailItem">
      <span>{label}</span>
      {src ? (
        <button
          type="button"
          className="esiApplicationsImageButton"
          aria-label={`View ${label}`}
          onClick={() => onImageClick({ label, src })}
        >
          <Image src={src} alt={label} width={88} height={88} unoptimized className="esiApplicationsDetailPreview" />
        </button>
      ) : reserveSpace || editing ? (
        <div className="esiApplicationsDetailPreviewPlaceholder">Not uploaded</div>
      ) : <strong>Not uploaded</strong>}
      {editing ? (
        <label className="esiApplicationsBrowseImage">
          Update image
          <input
            type="file"
            accept="image/*"
            aria-label={`Update ${label}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onBrowse(file);
              event.target.value = '';
            }}
          />
        </label>
      ) : src ? (
        <a
          className="esiApplicationsDownloadButton"
          href={src}
          download={`${safeEmployeeId}${downloadSuffix}.${extension}`}
          aria-label={`Download ${label}`}
          title="Download image"
        >
          <DownloadIcon />
        </a>
      ) : reserveSpace ? (
        <div className="esiApplicationsDownloadPlaceholder" aria-hidden="true"><DownloadIcon /></div>
      ) : null}
    </div>
  );
}

function ChildDetailImage({ label, src, employeeId, downloadSuffix, onImageClick, editing, onBrowse }) {
  const safeEmployeeId = employeeId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const mimeType = src?.slice(5, src.indexOf(';'));
  const extension = mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'img';

  return (
    <div className="esiApplicationsDetailItem">
      <span>{label}</span>
      {src ? (
        <button
          type="button"
          className="esiApplicationsImageButton"
          aria-label={`View ${label}`}
          onClick={() => onImageClick({ label, src })}
        >
          <Image src={src} alt={label} width={88} height={88} unoptimized className="esiApplicationsDetailPreview" />
        </button>
      ) : <div className="esiApplicationsDetailPreviewPlaceholder">Not uploaded</div>}
      {editing ? (
        <label className="esiApplicationsBrowseImage">
          Browse image
          <input
            type="file"
            accept="image/*"
            aria-label={`Browse ${label}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onBrowse(file);
              event.target.value = '';
            }}
          />
        </label>
      ) : src ? (
        <a
          className="esiApplicationsDownloadButton"
          href={src}
          download={`${safeEmployeeId}${downloadSuffix}.${extension}`}
          aria-label={`Download ${label}`}
          title="Download image"
        >
          <DownloadIcon />
        </a>
      ) : null}
    </div>
  );
}

function DetailGrid({ values, record, editing, onChange }) {
  return (
    <div className="esiApplicationsDetailsGrid">
      {values.map(([label, field]) => (
        <DetailValue key={field} label={label} value={record[field]} field={field} editing={editing} onChange={onChange} />
      ))}
    </div>
  );
}

export default function EsiApplicationDetails({ employeeId }) {
  const router = useRouter();
  const [record, setRecord] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bodyBackground = document.body.style.backgroundColor;
    const documentBackground = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#F0F7F8';
    document.documentElement.style.backgroundColor = '#F0F7F8';
    return () => {
      document.body.style.backgroundColor = bodyBackground;
      document.documentElement.style.backgroundColor = documentBackground;
    };
  }, []);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedImage]);

  useEffect(() => {
    if (!saveSucceeded) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSaveSucceeded(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [saveSucceeded]);

  useEffect(() => {
    const controller = new AbortController();
    const loadRecord = async () => {
      try {
        const response = await fetch(`/api/esi-applications?employeeId=${encodeURIComponent(employeeId)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load ESI application.');
        setRecord(result.data);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') setError(loadError.message || 'Unable to load ESI application.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadRecord();
    return () => controller.abort();
  }, [employeeId]);

  const viewRecord = record && editData ? { ...record, ...editData } : record;
  const children = viewRecord ? Array.from({ length: 5 }, (_, index) => index + 1) : [];
  const childCount = Number(viewRecord?.ChildCount) || 0;

  const beginEditing = () => {
    if (!record) return;
    setSaveError('');
    setSaveSucceeded(false);
    setEditData(Object.fromEntries(
      EDITABLE_FIELDS.map((field) => [
        field,
        EDITABLE_DATE_FIELDS.has(field) && record[field]
          ? String(record[field]).slice(0, 10)
          : record[field] ?? null,
      ]),
    ));
  };

  const updateEditField = (field, value) => {
    setEditData((current) => ({ ...current, [field]: value }));
  };

  const browseImage = async (field, file, label) => {
    if (!file.type.startsWith('image/')) {
      setSaveError(`Choose a valid image for ${label}.`);
      return;
    }

    setProcessingImage(true);
    setSaveError('');
    try {
      updateEditField(field, await compressPhoto(file));
    } catch (imageError) {
      setSaveError(imageError.message || 'Unable to compress the child photograph.');
    } finally {
      setProcessingImage(false);
    }
  };

  const addChild = (childNumber) => {
    setEditData((current) => {
      if (childNumber !== current.ChildCount + 1 || current.ChildCount >= 5) return current;
      return {
        ...current,
        ChildCount: childNumber,
        [`Child${childNumber}Name`]: null,
        [`Child${childNumber}DOB`]: null,
        [`Child${childNumber}Img`]: null,
      };
    });
  };

  const removeChild = (childNumber) => {
    setEditData((current) => {
      if (childNumber < 1 || childNumber > current.ChildCount) return current;
      const next = { ...current, ChildCount: current.ChildCount - 1 };
      for (let child = childNumber; child < current.ChildCount; child++) {
        next[`Child${child}Name`] = current[`Child${child + 1}Name`];
        next[`Child${child}DOB`] = current[`Child${child + 1}DOB`];
        next[`Child${child}Img`] = current[`Child${child + 1}Img`];
      }
      const lastChild = current.ChildCount;
      next[`Child${lastChild}Name`] = null;
      next[`Child${lastChild}DOB`] = null;
      next[`Child${lastChild}Img`] = null;
      return next;
    });
  };

  const cancelEditing = () => {
    setEditData(null);
    setSaveError('');
    setSaveSucceeded(false);
  };

  const saveChanges = async () => {
    if (!editData || saving || processingImage) return;
    if (!GENDER_OPTIONS.includes(editData.Gender)) {
      setSaveError('Select Male, Female, or Others for gender.');
      return;
    }
    if (!Number.isInteger(editData.ChildCount) || editData.ChildCount < 0 || editData.ChildCount > 5) {
      setSaveError('Enter a number of children between 0 and 5.');
      return;
    }
    for (let child = 1; child <= editData.ChildCount; child++) {
      const missingDetails = [];
      if (typeof editData[`Child${child}Name`] !== 'string' || !editData[`Child${child}Name`].trim()) {
        missingDetails.push('name');
      }
      if (!editData[`Child${child}DOB`]) missingDetails.push('date of birth');
      if (typeof editData[`Child${child}Img`] !== 'string' || !editData[`Child${child}Img`]) {
        missingDetails.push('photograph');
      }
      if (missingDetails.length) {
        setSaveError(`Complete Child ${child}'s ${missingDetails.join(', ')} before saving.`);
        return;
      }
    }
    if (!window.confirm('Save changes to this ESI application?')) return;
    setSaving(true);
    setSaveError('');
    setSaveSucceeded(false);
    try {
      const response = await fetch(`/api/esi-applications?employeeId=${encodeURIComponent(employeeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: Object.fromEntries(
            Object.entries(editData).filter(([field, value]) => (
              !EDITABLE_PHOTO_FIELDS.includes(field) || value !== record[field]
            )),
          ),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update ESI application.');
      setRecord(result.data);
      setEditData(null);
      setSaveSucceeded(true);
    } catch (saveActionError) {
      setSaveError(saveActionError.message || 'Unable to update ESI application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={`esiApplicationsPage${editData ? ' esiApplicationsEditing' : ''}`}>
      <style>{esiDetailsCss}</style>

      <header className="esiApplicationsHeader">
        <div>
          <h1>{viewRecord?.EmpName || 'ESI application details'}</h1>
          <p>Employee ID: {employeeId}</p>
        </div>
        {record && (
          <div className="esiApplicationsStatusCard">
            <DetailValue label="Created at" value={record.CreatedAt} field="CreatedAt" />
            <DetailValue label="Updated by" value={record.UptdBy || '—'} field="UptdBy" />
            <DetailValue label="Updated at" value={record.UptdAt} field="UptdAt" />
          </div>
        )}
        {record && (
          <div className="esiApplicationsEditActions">
            {editData ? (
              <>
                <button type="button" className="esiApplicationsCancelButton" onClick={cancelEditing} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="esiApplicationsSaveButton" onClick={() => void saveChanges()} disabled={saving || processingImage}>
                  {processingImage ? 'Compressing…' : saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <button type="button" className="esiApplicationsEditButton" onClick={beginEditing}>
                Edit
              </button>
            )}
            <button type="button" className="esiApplicationsBackButton" onClick={() => router.push('/dashboard/esi-applications')}>
              Back to applications
            </button>
          </div>
        )}
      </header>

      {loading && <p className="esiApplicationsNoDetails" role="status">Loading application details…</p>}
      {error && <div className="esiApplicationsMessage esiApplicationsError" role="alert">{error}</div>}
      {saveError && <div className="esiApplicationsMessage esiApplicationsError" role="alert">{saveError}</div>}

      {record && (
        <div className="esiApplicationsDetailsSections">
          <section className="esiApplicationsDetailsSection">
            <h3>Personal details</h3>
            <div className="esiApplicationsPersonalDetails">
              <div className="esiApplicationsPersonalDetailsFields">
                <div className="esiApplicationsPersonalDetailsRow">
                  {[
                    ['Employee ID', 'EmpID'], ['Employee name', 'EmpName'],
                    ['Date of joining', 'DOJ'], ['Date of birth', 'DOB'],
                    ['Gender', 'Gender'], ['Marital status', 'MaritalStatus'],
                  ].map(([label, field]) => (
                    <DetailValue key={field} label={label} value={viewRecord[field]} field={field} editing={Boolean(editData)} onChange={updateEditField} />
                  ))}
                </div>
                <div className="esiApplicationsPersonalDetailsRow">
                  {[
                    ['Mobile number', 'MobileNo'], ['Aadhaar number', 'AadharNo'],
                    ['Has previous ESI', 'HasPrevESI'], ['Previous ESI number', 'PrevESINo'],
                    ['State', 'State'],
                  ].map(([label, field]) => (
                    <DetailValue key={field} label={label} value={viewRecord[field]} field={field} editing={Boolean(editData)} onChange={updateEditField} />
                  ))}
                </div>
                <div className="esiApplicationsPersonalDetailsRow esiApplicationsPersonalDetailsAddressRow">
                  <DetailValue label="Pincode" value={viewRecord.Pincode} field="Pincode" editing={Boolean(editData)} onChange={updateEditField} />
                  <DetailValue label="Address" value={viewRecord.Address} field="Address" editing={Boolean(editData)} onChange={updateEditField} />
                </div>
              </div>
              <div className="esiApplicationsPersonalDetailsPhoto">
                <DetailImage
                  label={IMAGE_FIELDS[0][0]}
                  src={viewRecord[IMAGE_FIELDS[0][1]]}
                  employeeId={viewRecord.EmpID}
                  downloadSuffix={IMAGE_FIELDS[0][2]}
                  onImageClick={setSelectedImage}
                  editing={Boolean(editData)}
                  onBrowse={(file) => void browseImage(IMAGE_FIELDS[0][1], file, IMAGE_FIELDS[0][0])}
                />
              </div>
            </div>
          </section>

          <div className="esiApplicationsFamilyParents">
            <section className="esiApplicationsDetailsSection">
              <h3>Family details</h3>
              <div className="esiApplicationsFamilyDetails">
                <div className="esiApplicationsFamilyDetailsFields">
                  <div className="esiApplicationsFamilyDetailsRow">
                    <DetailValue label="Spouse name" value={viewRecord.SpouseName} field="SpouseName" editing={Boolean(editData)} onChange={updateEditField} />
                  </div>
                  <div className="esiApplicationsFamilyDetailsRow">
                    <DetailValue label="Spouse date of birth" value={viewRecord.SpouseDOB} field="SpouseDOB" editing={Boolean(editData)} onChange={updateEditField} />
                  </div>
                </div>
                <div className="esiApplicationsFamilyPhoto">
                  <DetailImage
                    label={IMAGE_FIELDS[1][0]}
                    src={viewRecord[IMAGE_FIELDS[1][1]]}
                    employeeId={viewRecord.EmpID}
                    downloadSuffix={IMAGE_FIELDS[1][2]}
                    onImageClick={setSelectedImage}
                    reserveSpace
                    editing={Boolean(editData)}
                    onBrowse={(file) => void browseImage(IMAGE_FIELDS[1][1], file, IMAGE_FIELDS[1][0])}
                  />
                </div>
              </div>
            </section>

            <section className="esiApplicationsDetailsSection">
              <h3>Parents</h3>
              <div className="esiApplicationsParentsDetails">
                <div className="esiApplicationsParentsDetailsFields">
                  <div className="esiApplicationsParentsDetailsRow">
                    <DetailValue label="Parents included" value={viewRecord.IncludeParents} field="IncludeParents" editing={Boolean(editData)} onChange={updateEditField} />
                  </div>
                  <div className="esiApplicationsParentsDetailsRow">
                    <DetailValue label="Father name" value={viewRecord.FatherName} field="FatherName" editing={Boolean(editData)} onChange={updateEditField} />
                    <DetailValue label="Father date of birth" value={viewRecord.FatherDOB} field="FatherDOB" editing={Boolean(editData)} onChange={updateEditField} />
                  </div>
                  <div className="esiApplicationsParentsDetailsRow">
                    <DetailValue label="Mother name" value={viewRecord.MotherName} field="MotherName" editing={Boolean(editData)} onChange={updateEditField} />
                    <DetailValue label="Mother date of birth" value={viewRecord.MotherDOB} field="MotherDOB" editing={Boolean(editData)} onChange={updateEditField} />
                  </div>
                </div>
                <div className="esiApplicationsParentsPhotos">
                  {IMAGE_FIELDS.slice(2).map(([label, field, downloadSuffix]) => (
                    <DetailImage
                      key={field}
                      label={label}
                      src={viewRecord[field]}
                      employeeId={viewRecord.EmpID}
                      downloadSuffix={downloadSuffix}
                      onImageClick={setSelectedImage}
                      reserveSpace
                      editing={Boolean(editData)}
                      onBrowse={(file) => void browseImage(field, file, label)}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="esiApplicationsDetailsSection">
            <h3>Children ({childCount})</h3>
            <div className="esiApplicationsDetailsGrid">
              {children.map((child) => (
                <article className="esiApplicationsChildDetails" key={child}>
                  <h4>Child {child}</h4>
                  {child <= childCount ? (
                    <>
                      <DetailValue label="Name" value={viewRecord[`Child${child}Name`]} field={`Child${child}Name`} editing={Boolean(editData)} onChange={updateEditField} />
                      <DetailValue label="Date of birth" value={viewRecord[`Child${child}DOB`]} field={`Child${child}DOB`} editing={Boolean(editData)} onChange={updateEditField} />
                      <ChildDetailImage
                        label={`Child ${child} photograph`}
                        src={viewRecord[`Child${child}Img`]}
                        employeeId={viewRecord.EmpID}
                        downloadSuffix={`Child${child}Img`}
                        onImageClick={setSelectedImage}
                        editing={Boolean(editData)}
                        onBrowse={(file) => void browseImage(`Child${child}Img`, file, `Child ${child} photograph`)}
                      />
                      {editData && (
                        <button
                          type="button"
                          className="esiApplicationsChildAction esiApplicationsChildRemove"
                          onClick={() => removeChild(child)}
                          disabled={saving || processingImage}
                        >
                          Remove child
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="esiApplicationsChildNotFound">
                        <Image src="/images/dataerror.png" alt="Child details not found" width={187} height={166} />
                      </div>
                      {editData && child === childCount + 1 && childCount < 5 && (
                        <button
                          type="button"
                          className="esiApplicationsChildAction"
                          onClick={() => addChild(child)}
                          disabled={saving || processingImage}
                        >
                          Add child
                        </button>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
            {processingImage && <p className="esiApplicationsImageProcessing" role="status">Compressing photograph…</p>}
          </section>

        </div>
      )}

      {selectedImage && (
        <div
          className="esiApplicationsImageOverlay"
          role="presentation"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="esiApplicationsImageDialog"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.label}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="esiApplicationsImageClose"
              aria-label="Close image"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <p>{selectedImage.label}</p>
            <Image
              className="esiApplicationsFullImage"
              src={selectedImage.src}
              alt={selectedImage.label}
              width={1200}
              height={900}
              unoptimized
            />
          </div>
        </div>
      )}
      {saveSucceeded && (
        <div
          className="esiApplicationsSaveOverlay"
          role="presentation"
          onClick={() => setSaveSucceeded(false)}
        >
          <div
            className="esiApplicationsSaveDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="esiApplicationSavedTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="esiApplicationSavedTitle">Details saved</h2>
            <p>Application details saved successfully.</p>
            <button type="button" onClick={() => setSaveSucceeded(false)}>Done</button>
          </div>
        </div>
      )}
    </main>
  );
}