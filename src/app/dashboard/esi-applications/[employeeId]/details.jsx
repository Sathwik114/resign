'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const DATE_FIELDS = new Set([
  'DOJ', 'DOB', 'SpouseDOB',
  'Child1DOB', 'Child2DOB', 'Child3DOB',
  'Child4DOB', 'Child5DOB',
  'FatherDOB', 'MotherDOB', 'CreatedAt', 'UpdatedAt', 'VerifiedAt',
]);

const IMAGE_FIELDS = [
  ['Employee photograph', 'EmpImg', 'Img'],
  ['Spouse photograph', 'SpouseImg', 'SpouseImg'],
  ['Father photograph', 'FatherImg', 'FatherImg'],
  ['Mother photograph', 'MotherImg', 'MotherImg'],
];

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

function DetailValue({ label, value, field }) {
  const formattedValue = field === 'Verification'
    ? (value === 'V' ? 'Verified' : 'Not Verified')
    : value && DATE_FIELDS.has(field) ? formatDate(value) : displayValue(value);
  return (
    <div className={`esiApplicationsDetailItem${field === 'Verification' ? (value === 'V' ? ' isVerified' : ' isNotVerified') : ''}`}>
      <span>{label}</span>
      <strong>{formattedValue}</strong>
    </div>
  );
}

function DetailImage({ label, src, employeeId, downloadSuffix, onImageClick, reserveSpace = false }) {
  if (!src) {
    return (
      <div className="esiApplicationsDetailItem">
        <span>{label}</span>
        {reserveSpace ? (
          <>
            <div className="esiApplicationsDetailPreviewPlaceholder">Not uploaded</div>
            <div className="esiApplicationsDownloadPlaceholder" aria-hidden="true">Download image</div>
          </>
        ) : <strong>Not uploaded</strong>}
      </div>
    );
  }

  const safeEmployeeId = employeeId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const mimeType = src.slice(5, src.indexOf(';'));
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'img';

  return (
    <div className="esiApplicationsDetailItem">
      <span>{label}</span>
      <button
        type="button"
        className="esiApplicationsImageButton"
        aria-label={`View ${label}`}
        onClick={() => onImageClick({ label, src })}
      >
        <Image src={src} alt={label} width={120} height={120} unoptimized className="esiApplicationsDetailPreview" />
      </button>
      <a
        className="esiApplicationsDownloadButton"
        href={src}
        download={`${safeEmployeeId}${downloadSuffix}.${extension}`}
      >
        Download image
      </a>
    </div>
  );
}

function DetailGrid({ values, record }) {
  return (
    <div className="esiApplicationsDetailsGrid">
      {values.map(([label, field]) => (
        <DetailValue key={field} label={label} value={record[field]} field={field} />
      ))}
    </div>
  );
}

export default function EsiApplicationDetails({ employeeId, backTo }) {
  const router = useRouter();
  const [record, setRecord] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedImage]);

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

  const children = record ? Array.from({ length: Math.min(Number(record.ChildCount) || 0, 5) }, (_, index) => index + 1) : [];
  const showChildren = record?.MaritalStatus?.trim().toLowerCase() !== 'unmarried';

  return (
    <main className="esiApplicationsPage">
      <header className="esiApplicationsHeader">
        <div>
          <h1>{record?.EmpName || 'ESI application details'}</h1>
          <p>Employee ID: {employeeId}</p>
        </div>
        {record && (
          <div className="esiApplicationsStatusCard">
            <DetailValue label="Application status" value={record.Verification} field="Verification" />
            <DetailValue label="Created at" value={record.CreatedAt} field="CreatedAt" />
            <DetailValue label="Verified at" value={record.VerifiedAt} field="VerifiedAt" />
            <DetailValue label="Verified by" value={record.VerifiedBy} field="VerifiedBy" />
          </div>
        )}
        <button type="button" className="esiApplicationsBackButton" onClick={() => router.push(backTo)}>
          Back to applications
        </button>
      </header>

      {loading && <p className="esiApplicationsNoDetails" role="status">Loading application details…</p>}
      {error && <div className="esiApplicationsMessage esiApplicationsError" role="alert">{error}</div>}

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
                    <DetailValue key={field} label={label} value={record[field]} field={field} />
                  ))}
                </div>
                <div className="esiApplicationsPersonalDetailsRow">
                  {[
                    ['Mobile number', 'MobileNo'], ['Aadhaar number', 'AadharNo'],
                    ['Has previous ESI', 'HasPrevESI'], ['Previous ESI number', 'PrevESINo'],
                    ['State', 'State'],
                  ].map(([label, field]) => (
                    <DetailValue key={field} label={label} value={record[field]} field={field} />
                  ))}
                </div>
                <div className="esiApplicationsPersonalDetailsRow esiApplicationsPersonalDetailsAddressRow">
                  <DetailValue label="Pincode" value={record.Pincode} field="Pincode" />
                  <DetailValue label="Address" value={record.Address} field="Address" />
                </div>
              </div>
              <div className="esiApplicationsPersonalDetailsPhoto">
                <DetailImage
                  label={IMAGE_FIELDS[0][0]}
                  src={record[IMAGE_FIELDS[0][1]]}
                  employeeId={record.EmpID}
                  downloadSuffix={IMAGE_FIELDS[0][2]}
                  onImageClick={setSelectedImage}
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
                    <DetailValue label="Spouse name" value={record.SpouseName} />
                  </div>
                  <div className="esiApplicationsFamilyDetailsRow">
                    <DetailValue label="Spouse date of birth" value={record.SpouseDOB} field="SpouseDOB" />
                  </div>
                </div>
                <div className="esiApplicationsFamilyPhoto">
                  <DetailImage
                    label={IMAGE_FIELDS[1][0]}
                    src={record[IMAGE_FIELDS[1][1]]}
                    employeeId={record.EmpID}
                    downloadSuffix={IMAGE_FIELDS[1][2]}
                    onImageClick={setSelectedImage}
                    reserveSpace
                  />
                </div>
              </div>
            </section>

            <section className="esiApplicationsDetailsSection">
              <h3>Parents</h3>
              <div className="esiApplicationsParentsDetails">
                <div className="esiApplicationsParentsDetailsFields">
                  <div className="esiApplicationsParentsDetailsRow">
                    <DetailValue label="Parents included" value={record.IncludeParents} />
                  </div>
                  <div className="esiApplicationsParentsDetailsRow">
                    <DetailValue label="Father name" value={record.FatherName} />
                    <DetailValue label="Father date of birth" value={record.FatherDOB} field="FatherDOB" />
                  </div>
                  <div className="esiApplicationsParentsDetailsRow">
                    <DetailValue label="Mother name" value={record.MotherName} />
                    <DetailValue label="Mother date of birth" value={record.MotherDOB} field="MotherDOB" />
                  </div>
                </div>
                <div className="esiApplicationsParentsPhotos">
                  {IMAGE_FIELDS.slice(2).map(([label, field, downloadSuffix]) => (
                    <DetailImage
                      key={field}
                      label={label}
                      src={record[field]}
                      employeeId={record.EmpID}
                      downloadSuffix={downloadSuffix}
                      onImageClick={setSelectedImage}
                      reserveSpace
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>

          {showChildren && (
            <section className="esiApplicationsDetailsSection">
              <h3>Children ({displayValue(record.ChildCount)})</h3>
              {children.length ? (
                <div className="esiApplicationsDetailsGrid">
                  {children.map((child) => (
                    <article className="esiApplicationsChildDetails" key={child}>
                      <h4>Child {child}</h4>
                      <DetailValue label="Name" value={record[`Child${child}Name`]} />
                      <DetailValue label="Date of birth" value={record[`Child${child}DOB`]} field={`Child${child}DOB`} />
                      <DetailImage
                        label={`Child ${child} photograph`}
                        src={record[`Child${child}Img`]}
                        employeeId={record.EmpID}
                        downloadSuffix={`Child${child}Img`}
                        onImageClick={setSelectedImage}
                      />
                    </article>
                  ))}
                </div>
              ) : <p className="esiApplicationsNoDetails">No children listed.</p>}
            </section>
          )}

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
    </main>
  );
}
