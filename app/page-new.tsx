"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

type ScanState = "idle" | "ready" | "scanning" | "complete";

const values = [
  {
    number: "01",
    title: "Honor Farmers",
    copy: "Technology should respect the skill, patience, and knowledge already present in Cambodia's fields.",
  },
  {
    number: "02",
    title: "Detect Earlier",
    copy: "AI assistance can surface possible disease patterns before crop damage spreads across a harvest.",
  },
  {
    number: "03",
    title: "Guide in Khmer",
    copy: "Clear local-language guidance helps farming communities understand what to do next.",
  },
];

const steps = [
  ["Upload Crop Photo", "Capture an affected leaf or stem in natural light."],
  ["AI Reviews Symptoms", "Visible signs are checked for possible disease patterns."],
  ["Receive Guidance", "Simple treatment and prevention advice appears clearly."],
  ["Protect the Harvest", "Farmers can act sooner and seek expert help when needed."],
];

const impact = [
  "Early disease awareness",
  "Khmer-first guidance",
  "Farmer-friendly workflow",
  "Built for Cambodian crops",
];

export default function HarvestlyNewHomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function selectFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState("ready");
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) selectFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  function analyzeSample() {
    if (!previewUrl) return;
    setScanState("scanning");
    window.setTimeout(() => setScanState("complete"), 1200);
  }

  return (
    <div className="min-h-screen bg-[#17120f] text-[#f1e3d1]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-[#704d38]/40 bg-[#17120f]/85 backdrop-blur-md">
        <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <span className="text-lg font-bold tracking-[0.28em] text-[#d8a766]">HARVESTLY</span>
          <div className="hidden items-center gap-8 text-sm text-[#c1aa92] md:flex">
            <a href="#values" className="hover:text-[#f1e3d1]">Values</a>
            <a href="#process" className="hover:text-[#f1e3d1]">Process</a>
            <a href="#impact" className="hover:text-[#f1e3d1]">Impact</a>
          </div>
          <Link
            href="/"
            className="rounded-full bg-[#b85c35] px-5 py-3 text-sm font-semibold text-[#fff2df] transition hover:bg-[#cc6c3d]"
          >
            Analyze Crop
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative flex min-h-screen items-end px-5 pb-16 pt-32 sm:px-8 sm:pb-24">
          <Image
            src="/images/harvestly-hero.webp"
            alt="Cambodian farmer examining crops in a field"
            fill
            priority
            className="object-cover object-[68%_center] sepia-[.4] saturate-[.72]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(190,91,43,.3),transparent_35%),linear-gradient(90deg,rgba(20,15,12,.98),rgba(20,15,12,.82)_45%,rgba(20,15,12,.46))]" />
          <div className="relative mx-auto w-full max-w-7xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#d7a264]">
              AI crop care for Cambodia
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
              Protecting Cambodian Crops with AI
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#ddcab5]">
              Harvestly helps farmers detect crop diseases early, understand the problem, and receive simple
              treatment guidance in Khmer.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/" className="rounded-full bg-[#b85c35] px-8 py-4 text-center font-semibold transition hover:bg-[#cf7041]">
                Analyze Crop
              </Link>
              <a href="#values" className="rounded-full border border-[#b19070]/50 px-8 py-4 text-center font-semibold hover:bg-[#2b201a]">
                Learn More
              </a>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 text-center sm:px-8 sm:py-28">
          <h2 className="mx-auto max-w-5xl text-3xl font-semibold leading-snug sm:text-5xl">
            One unnoticed disease can destroy months of a farmer&apos;s effort.
          </h2>
          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#b7a28e]">
            Harvestly combines local farming knowledge with accessible AI assistance, helping communities respond
            sooner with clearer information.
          </p>
        </section>

        <section id="values" className="border-y border-[#50382c] bg-[#1d1713] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ce8d55]">Our Values</p>
            <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">Built for the people behind every harvest.</h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {values.map((value) => (
                <article key={value.number} className="rounded-3xl border border-[#634636] bg-[#241b16] p-8">
                  <p className="text-3xl text-[#d17d49]">{value.number}</p>
                  <h3 className="mt-10 text-2xl font-semibold">{value.title}</h3>
                  <p className="mt-4 leading-7 text-[#ad9987]">{value.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ce8d55]">Process</p>
            <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">A Simple Playbook for Healthier Crops</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {steps.map(([title, copy], index) => (
                <article key={title} className="rounded-3xl border border-[#614536] bg-[#211914] p-7">
                  <span className="text-[#d17d49]">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-[#af9b88]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#50382c] bg-[#1c1612] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-4xl font-semibold sm:text-5xl">Try the analyzer preview</h2>
            <p className="mt-5 max-w-2xl leading-8 text-[#b29e8a]">
              A presentation demo of how simple crop guidance could begin. No live diagnosis is performed here.
            </p>
            <div className="mt-12 grid overflow-hidden rounded-3xl border border-[#704b37] lg:grid-cols-2">
              <div className="bg-[#231a15] p-6 sm:p-9">
                <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={onChange} />
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`relative flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-6 text-center ${
                    dragging ? "border-[#d59a61] bg-[#302219]" : "border-[#795844] bg-[#17120f]"
                  }`}
                >
                  {previewUrl ? (
                    <>
                      <Image src={previewUrl} alt="Selected crop preview" fill unoptimized className="object-cover opacity-45" />
                      <button onClick={() => inputRef.current?.click()} className="relative rounded-full border border-[#d29b62] px-6 py-3 font-semibold">
                        Change Photo
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-semibold">Upload Crop Photo</p>
                      <p className="mt-3 text-[#ad9987]">Drag and drop or select an affected leaf image.</p>
                      <button onClick={() => inputRef.current?.click()} className="mt-7 rounded-full bg-[#b85c35] px-7 py-3 font-semibold">
                        Choose Image
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={analyzeSample}
                  disabled={!previewUrl || scanState === "scanning"}
                  className="mt-5 w-full rounded-full bg-[#b85c35] px-7 py-4 font-semibold disabled:cursor-not-allowed disabled:bg-[#46352c] disabled:text-[#918276]"
                >
                  {scanState === "scanning" ? "Scanning Image..." : "Analyze Sample"}
                </button>
              </div>
              <div className="bg-[#ede0cd] p-7 text-[#2b211a] sm:p-10">
                {scanState === "scanning" ? (
                  <div className="flex min-h-full flex-col items-center justify-center py-14 text-center">
                    <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#dbb77d] border-t-[#a95733]" />
                    <p className="mt-6 text-xl font-semibold">Detecting possible disease...</p>
                  </div>
                ) : scanState === "complete" ? (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#9c5532]">Sample Result</p>
                    <div className="mt-5 flex justify-between gap-4">
                      <h3 className="text-3xl font-semibold">Brown Spot</h3>
                      <span className="h-fit rounded-full bg-[#ddb196] px-4 py-2 text-sm font-semibold text-[#8d4027]">High Risk</span>
                    </div>
                    <p className="mt-5 font-semibold text-[#9b5330]">Confidence: 92%</p>
                    <Result label="Symptoms" text="Brown oval spots, yellowing leaves" />
                    <Result label="Treatment" text="Improve drainage and remove infected leaves carefully." />
                    <Result label="Prevention" text="Avoid overwatering and monitor weekly." />
                  </div>
                ) : (
                  <div className="flex min-h-full flex-col justify-center py-12">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#9c5532]">Guidance Preview</p>
                    <h3 className="mt-5 text-3xl font-semibold">Results appear here.</h3>
                    <p className="mt-5 leading-8 text-[#67564b]">Select a photo and run the demonstration to see a sample result.</p>
                    <p className="mt-10 font-[var(--font-kantumruy-pro)] text-xl font-semibold text-[#985130]">ការណែនាំជាភាសាខ្មែរ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="impact" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-4xl font-semibold sm:text-5xl">Made to strengthen rural decisions.</h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-[#50382c] bg-[#50382c] sm:grid-cols-2 lg:grid-cols-4">
              {impact.map((item) => (
                <div key={item} className="min-h-40 bg-[#181310] p-7 text-xl font-semibold text-[#dfcfbb]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-[#744b36] bg-[#241a15] px-7 py-16 text-center sm:px-12 sm:py-24">
            <h2 className="mx-auto max-w-4xl text-4xl font-semibold sm:text-6xl">
              Give farmers a faster way to protect their crops.
            </h2>
            <Link href="/" className="mt-10 inline-flex rounded-full bg-[#b85c35] px-9 py-4 font-semibold transition hover:bg-[#ce6e3f]">
              Start Analysis
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Result({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-5 border-t border-[#cbb796] pt-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#89684c]">{label}</p>
      <p className="mt-2 leading-7">{text}</p>
    </div>
  );
}
