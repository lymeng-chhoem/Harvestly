"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { confidenceText, localize, riskText } from "@/lib/harvestly-content";
import { useProduct, type AnalysisError } from "../state/ProductProvider";

const text = {
  title: { km: "ស្កេនស្លឹកដំណាំ", en: "Scan your crop leaf" },
  prompt: { km: "ថត ឬជ្រើសរូបស្លឹកដែលមានបញ្ហា", en: "Capture or select the affected leaf" },
  choose: { km: "ជ្រើសពីទូរស័ព្ទ", en: "Choose from device" },
  camera: { km: "ថតរូបថ្មី", en: "Take a photo" },
  drop: { km: "អាចអូសរូបមកទីនេះនៅលើកុំព្យូទ័រ", en: "Or drag a photo here on desktop" },
  supported: { km: "រូបភាព JPG ឬ PNG មិនលើស 10MB", en: "JPG or PNG image, up to 10MB" },
  invalidType: { km: "សូមជ្រើសរូបភាព JPG ឬ PNG តែប៉ុណ្ណោះ។", en: "Please select a JPG or PNG image." },
  invalidSize: { km: "រូបភាពធំពេក។ សូមជ្រើសរូបមិនលើស 10MB។", en: "Image is too large. Choose one under 10MB." },
  newPhoto: { km: "ប្តូររូប", en: "Change photo" },
  remove: { km: "លុបរូប", en: "Remove" },
  start: { km: "ចាប់ផ្តើមពិនិត្យ", en: "Start analysis" },
  analyzing: { km: "កំពុងពិនិត្យរូបភាព...", en: "Analyzing image..." },
  retry: { km: "ពិនិត្យម្តងទៀត", en: "Analyze again" },
  likely: { km: "បញ្ហាដែលអាចកើតមាន", en: "Likely issue" },
  disclosure: {
    km: "លទ្ធផលនេះជាការណែនាំប៉ុណ្ណោះ។ សូមបញ្ជាក់ជាមួយមន្ត្រីកសិកម្ម មុនប្រើថ្នាំព្យាបាល។",
    en: "This result is guidance only. Confirm the issue with an agricultural officer before applying treatment.",
  },
  next: { km: "ជំហានបន្ទាប់", en: "Next actions" },
  saveError: {
    km: "លទ្ធផលបានបង្ហាញ ប៉ុន្តែមិនអាចរក្សាទុកក្នុងប្រវត្តិនៅលើឧបករណ៍នេះបានទេ។",
    en: "Result shown, but it could not be saved to history on this device.",
  },
  guestAllowance: { km: "អ្នកអាចពិនិត្យឥតគិតថ្លៃបាន ១ ដងដោយមិនចាំបាច់ចូលគណនី។", en: "You have 1 free scan without an account." },
  registeredAllowance: { km: "ការពិនិត្យដែលនៅសល់ក្នុងសប្តាហ៍នេះ", en: "Scans remaining this week" },
  loadingAccess: { km: "កំពុងពិនិត្យសិទ្ធិប្រើប្រាស់...", en: "Checking scan access..." },
  join: { km: "បង្កើតគណនី", en: "Sign up" },
  login: { km: "ចូលគណនី", en: "Login" },
  errors: {
    configuration: {
      km: "សេវាពិនិត្យមិនទាន់បានកំណត់រចនាសម្ព័ន្ធ។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។",
      en: "The scanner service is not configured yet. Please try again later.",
    },
    network: {
      km: "មិនអាចភ្ជាប់ទៅសេវាពិនិត្យបានទេ។ សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត។",
      en: "Cannot reach the scanner service. Check your connection and try again.",
    },
    timeout: {
      km: "ការពិនិត្យចំណាយពេលយូរពេក។ សូមព្យាយាមម្តងទៀត។",
      en: "Analysis took too long. Please try again.",
    },
    service: {
      km: "សេវាពិនិត្យមិនអាចវិភាគរូបនេះបានទេ។ សូមព្យាយាមម្តងទៀត។",
      en: "The scanner service could not analyze this image. Please try again.",
    },
    invalid_response: {
      km: "លទ្ធផលពីសេវាពិនិត្យមិនអាចប្រើបានទេ។ សូមព្យាយាមជាមួយរូបផ្សេង។",
      en: "The scanner returned an unsupported result. Please try another image.",
    },
    limit: {
      km: "អ្នកបានប្រើការពិនិត្យទាំងអស់ដែលមាន។ ចូល ឬបង្កើតគណនីដើម្បីទទួលបានសិទ្ធិបន្ថែម។",
      en: "You have used all available scans. Log in or sign up for registered access.",
    },
  },
};

export function ScanUploader({ home = false, className = "" }: { home?: boolean; className?: string }) {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const {
    language,
    selectedFile,
    previewUrl,
    uploadError,
    analysisStatus,
    analysisError,
    result,
    historySaveError,
    authStatus,
    allowance,
    selectImage,
    clearImage,
    analyze,
  } = useProduct();

  function acceptFile(file: File) {
    if (selectImage(file) && home) router.push("/analyze");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  function errorText(error: Exclude<AnalysisError, null>) {
    return localize(text.errors[error], language);
  }

  return (
    <section className={`scan-card ${home ? "home-scan" : "analysis-scan"} ${className}`}>
      <div className="scan-title">
        <div className="camera-medallion" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7.5h4l1.5-2h5l1.5 2h4v11H4Zm8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
          </svg>
        </div>
        <h2>{localize(text.title, language)}</h2>
        <p>{localize(text.prompt, language)}</p>
      </div>
      <div className="scan-allowance" role="status">
        {authStatus === "loading" ? localize(text.loadingAccess, language) : authStatus === "authenticated" && allowance
          ? `${localize(text.registeredAllowance, language)}: ${allowance.remaining}/${allowance.limit}`
          : localize(text.guestAllowance, language)}
      </div>
      <input
        ref={galleryInputRef}
        className="file-input"
        aria-label={localize(text.choose, language)}
        type="file"
        accept="image/jpeg,image/png"
        onChange={onFileChange}
      />
      <input
        ref={cameraInputRef}
        className="file-input"
        aria-label={localize(text.camera, language)}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={onFileChange}
      />
      {!home && previewUrl ? (
        <div className="preview-grid">
          <div className="preview-photo">
            <Image src={previewUrl} alt={selectedFile?.name ?? ""} fill unoptimized />
          </div>
          <div className="preview-controls">
            <p className="selected-name">{selectedFile?.name}</p>
            <button className="rust-button" type="button" onClick={analyze} disabled={analysisStatus === "analyzing" || authStatus === "loading"}>
              {analysisStatus === "analyzing" ? localize(text.analyzing, language) : localize(text.start, language)}
            </button>
            <button className="paper-button" type="button" onClick={() => galleryInputRef.current?.click()}>
              {localize(text.newPhoto, language)}
            </button>
            <button className="paper-button" type="button" onClick={() => cameraInputRef.current?.click()}>
              {localize(text.camera, language)}
            </button>
            <button className="text-button" type="button" onClick={clearImage}>{localize(text.remove, language)}</button>
          </div>
        </div>
      ) : (
        <div
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <svg className="upload-icon" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M14 33H9a7 7 0 0 1 .8-14A14 14 0 0 1 37 22a6 6 0 0 1 2 11h-5M24 17v20m-7-12 7-8 7 8" />
          </svg>
          <div className="upload-actions">
            <button className="rust-button" type="button" onClick={() => cameraInputRef.current?.click()}>
              {localize(text.camera, language)}
            </button>
            <button className="paper-button" type="button" onClick={() => galleryInputRef.current?.click()}>
              {localize(text.choose, language)}
            </button>
          </div>
          <p>{localize(text.drop, language)}</p>
          <small>{localize(text.supported, language)}</small>
        </div>
      )}
      {uploadError && (
        <p className="form-error" role="alert">
          {localize(uploadError === "type" ? text.invalidType : text.invalidSize, language)}
        </p>
      )}
      {!home && analysisStatus === "analyzing" && (
        <div className="analysis-progress" role="status"><span />{localize(text.analyzing, language)}</div>
      )}
      {!home && analysisStatus === "error" && analysisError && (
        <div className="scan-error-actions">
          <p className="form-error service-error" role="alert">{errorText(analysisError)}</p>
          {analysisError === "limit" && authStatus !== "authenticated" && (
            <div className="access-links">
              <Link className="rust-button" href="/signup?next=/analyze">{localize(text.join, language)}</Link>
              <Link className="paper-button" href="/login?next=/analyze">{localize(text.login, language)}</Link>
            </div>
          )}
        </div>
      )}
      {!home && result && analysisStatus === "result" && (
        <article className="diagnosis-result" aria-live="polite">
          <div className="result-heading">
            <div>
              <small>{localize(text.likely, language)}</small>
              <h3>{localize(result.finding, language)}</h3>
            </div>
            <span className={`risk-chip ${result.risk}`}>{riskText(result.risk, language)}</span>
          </div>
          <p className="confidence">{confidenceText(result.confidence, language)}</p>
          <p>{localize(result.summary, language)}</p>
          <div className="disclosure" role="note">{localize(text.disclosure, language)}</div>
          {historySaveError && <div className="history-save-error" role="status">{localize(text.saveError, language)}</div>}
          <h4>{localize(text.next, language)}</h4>
          <ol>
            {result.actions.map((action) => <li key={action.en}>{localize(action, language)}</li>)}
          </ol>
          <button className="paper-button retry-button" type="button" onClick={analyze}>{localize(text.retry, language)}</button>
        </article>
      )}
    </section>
  );
}
