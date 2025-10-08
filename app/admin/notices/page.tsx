// app/admin/notices/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Kind = "image" | "video";

type NoticeRow = {
  id: string;
  kind: Kind;
  title: string | null;
  body: string | null;
  file_path: string;
  poster_path: string | null;
  is_live: boolean;
  created_at: string;
};

type Banner = { type: "success" | "error"; msg: string } | null;

function classNames(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function AdminNoticesPage() {
  // form state
  const [tab, setTab] = useState<Kind>("image");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  // image crop
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // video poster
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);

  // ui/meta
  const [uploading, setUploading] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  // recent
  const [recent, setRecent] = useState<NoticeRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showOlder, setShowOlder] = useState(false);

  // UI: which vertical tab is active — "new" | "recent"
  const [activeTab, setActiveTab] = useState<"new" | "recent">("new");

  // ======= helpers =======
  function resetForm() {
    setTitle("");
    setBody("");
    setIsLive(true);
    setFile(null);
    setImgUrl(null);
    setVideoUrl(null);
    setPosterBlob(null);
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function getCroppedImageBlob(): Promise<Blob> {
    if (!imgUrl || !croppedAreaPixels) throw new Error("Nothing to crop");
    const img = await loadImage(imgUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const { width, height, x, y } = croppedAreaPixels;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", 0.92)
    );
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  async function captureVideoPoster(): Promise<Blob> {
    if (!videoRef.current) throw new Error("No video");
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Poster failed"))), "image/jpeg", 0.85)
    );
  }

  // ======= recent =======
  async function loadRecent() {
    setLoadingRecent(true);
    try {
      const r = await fetch("/api/admin/notices", { credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load notices");
      setRecent(data as NoticeRow[]);
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not load notices." });
    } finally {
      setLoadingRecent(false);
    }
  }

  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======= file handling =======
  function onChooseFile(f?: File | null) {
    if (!f) return;
    setFile(f);
    setBanner(null);

    if (tab === "image") {
      const url = URL.createObjectURL(f);
      setImgUrl(url);
      setVideoUrl(null);
      setPosterBlob(null);
    } else {
      const url = URL.createObjectURL(f);
      setVideoUrl(url);
      setImgUrl(null);
      setCroppedAreaPixels(null);
      setZoom(1);
    }
  }

  // ======= upload =======
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    if (!file) {
      setBanner({ type: "error", msg: "Please choose a file." });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("kind", tab);
      form.append("title", title);
      form.append("body", body);
      form.append("is_live", String(isLive));

      let mainFile: File = file;

      if (tab === "image") {
        if (imgUrl && croppedAreaPixels) {
          const blob = await getCroppedImageBlob();
          mainFile = new File(
            [blob],
            file.name.replace(/\.\w+$/, "") + "_cropped.jpg",
            { type: "image/jpeg" }
          );
        }
        form.append("file", mainFile);
      } else {
        form.append("file", mainFile);
        let poster = posterBlob;
        if (!poster && videoRef.current && videoRef.current.readyState >= 2) {
          poster = await captureVideoPoster();
        }
        if (poster) {
          form.append("poster", new File([poster], "poster.jpg", { type: "image/jpeg" }));
        }
      }

      const res = await fetch("/api/admin/notices", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setBanner({ type: "success", msg: "Notice uploaded successfully." });
      resetForm();

      // switch to recent after publish
      setActiveTab("recent");
      await loadRecent();
    } catch (err: any) {
      setBanner({ type: "error", msg: err?.message || "Failed to upload" });
    } finally {
      setUploading(false);
    }
  }

  // ======= delete =======
  async function doDelete(id: string) {
    setBanner(null);
    try {
      const r = await fetch(`/api/admin/notices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Delete failed");
      setConfirmDeleteId(null);
      await loadRecent();
      setBanner({ type: "success", msg: "Notice deleted." });
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not delete notice." });
    }
  }

  const top3 = useMemo(() => recent.slice(0, 3), [recent]);
  const older = useMemo(() => recent.slice(3), [recent]);

  // --- UI: single vertical card with New / Recent toggle ---
  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-4">
      <div className="rounded-2xl border bg-white p-3 sm:p-4 shadow-sm">
        {/* top bar */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm transition hover:bg-zinc-50"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </Link>
            <h2 className="text-lg font-semibold">Notices</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadRecent(); setActiveTab("recent"); }}
              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
              title="Refresh list"
            >
              <Upload size={14} />
            </button>
          </div>
        </div>

        {/* Tabs toggle: New notice | Recent */}
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("new")}
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeTab === "new" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-pressed={activeTab === "new"}
          >
            New notice
          </button>

          <button
            onClick={() => { setActiveTab("recent"); loadRecent(); }}
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeTab === "recent" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-pressed={activeTab === "recent"}
          >
            Recent
          </button>
        </div>

        {/* Banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner.msg}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={classNames(
                "mb-3 rounded-md px-3 py-2 text-sm",
                banner.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-red-200 bg-red-50 text-red-700"
              )}
              aria-live="polite"
            >
              {banner.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          {/* NEW NOTICE FORM */}
          <AnimatePresence initial={false} mode="wait">
            {activeTab === "new" && (
              <motion.form
                key="new"
                onSubmit={handleUpload}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {/* kind tabs */}
                <div className="inline-flex rounded-full border p-1">
                  <button
                    type="button"
                    onClick={() => setTab("image")}
                    className={classNames(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm",
                      tab === "image" ? "bg-emerald-600 text-white" : "text-zinc-700 hover:bg-zinc-50"
                    )}
                    aria-pressed={tab === "image"}
                  >
                    <ImageIcon size={16} /> Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("video")}
                    className={classNames(
                      "ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm",
                      tab === "video" ? "bg-emerald-600 text-white" : "text-zinc-700 hover:bg-zinc-50"
                    )}
                    aria-pressed={tab === "video"}
                  >
                    <VideoIcon size={16} /> Video
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600">Title (optional)</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="e.g., Holiday on Friday"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-600">Body (optional)</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
                      rows={3}
                      placeholder="Short description…"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="isLive"
                      type="checkbox"
                      checked={isLive}
                      onChange={(e) => setIsLive(e.target.checked)}
                    />
                    <label htmlFor="isLive" className="text-sm">Publish immediately</label>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-600">
                      {tab === "image" ? "Pick an image" : "Pick a video"}
                    </label>
                    <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
                        <Upload size={16} /> Choose file
                        <input
                          type="file"
                          accept={tab === "image" ? "image/*" : "video/*"}
                          className="hidden"
                          onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <span className="text-xs text-zinc-500 break-all">{file ? file.name : "No file chosen"}</span>
                    </div>
                  </div>

                  {/* image cropper */}
                  {tab === "image" && imgUrl && (
                    <div className="relative mt-2 h-56 w-full overflow-hidden rounded-lg border">
                      <Cropper
                        image={imgUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={16 / 9}
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                      />
                      <div className="absolute bottom-2 left-2 right-2">
                        <input
                          aria-label="Zoom"
                          type="range"
                          min={1}
                          max={3}
                          step={0.01}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* video preview */}
                  {tab === "video" && videoUrl && (
                    <div className="mt-2 space-y-2">
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        className="max-h-64 w-full rounded-lg border bg-black"
                        onLoadedData={async () => {
                          try {
                            const poster = await captureVideoPoster();
                            setPosterBlob(poster);
                          } catch {
                            /* ignore */
                          }
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const p = await captureVideoPoster();
                              setPosterBlob(p);
                              setBanner({ type: "success", msg: "Poster captured from current frame." });
                            } catch (e: any) {
                              setBanner({ type: "error", msg: e?.message || "Could not capture poster." });
                            }
                          }}
                          className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
                        >
                          Capture Poster
                        </button>
                        {posterBlob && <span className="text-xs text-zinc-600">Poster ready</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} /> {uploading ? "Uploading…" : "Publish Notice"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* RECENT LIST */}
          <AnimatePresence initial={false} mode="wait">
            {activeTab === "recent" && (
              <motion.div
                key="recent"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="text-base font-semibold">Recent Notices</div>

                <div className="space-y-2">
                  {loadingRecent ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="h-3 w-32 animate-pulse rounded bg-zinc-200" />
                        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-zinc-200" />
                      </div>
                    ))
                  ) : top3.length === 0 ? (
                    <div className="rounded-lg border p-4 text-sm text-zinc-500">No notices yet</div>
                  ) : (
                    top3.map((n) => (
                      <div key={n.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 text-sm font-medium truncate">{n.title || (n.kind === "image" ? "Image" : "Video")}</div>
                          <span className={classNames(
                            "shrink-0 rounded-full px-2 py-[2px] text-[10px] font-semibold",
                            n.is_live ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"
                          )}>
                            {n.is_live ? "LIVE" : "Hidden"}
                          </span>
                        </div>

                        {n.body && <div className="mt-1 text-xs text-zinc-600 break-words">{n.body}</div>}

                        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                          <div className="truncate">{new Date(n.created_at).toLocaleString()}</div>
                          <div className="flex items-center gap-2">
                            {confirmDeleteId === n.id ? (
                              <>
                                <button className="rounded border px-2 py-1 hover:bg-zinc-50" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                                <button className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100" onClick={() => doDelete(n.id)}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </>
                            ) : (
                              <button className="inline-flex items-center gap-1 rounded border px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setConfirmDeleteId(n.id)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Older (accordion) */}
                  {older.length > 0 && (
                    <div className="rounded-xl border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowOlder((v) => !v)}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm"
                        aria-expanded={showOlder}
                      >
                        <span>Older</span>
                        {showOlder ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {showOlder && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-2 pb-2"
                          >
                            <div className="space-y-2">
                              {older.map((n) => (
                                <div key={n.id} className="rounded-lg border p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 text-sm font-medium truncate">{n.title || (n.kind === "image" ? "Image" : "Video")}</div>
                                    <span className={classNames(
                                      "shrink-0 rounded-full px-2 py-[2px] text-[10px] font-semibold",
                                      n.is_live ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"
                                    )}>{n.is_live ? "LIVE" : "Hidden"}</span>
                                  </div>

                                  {n.body && <div className="mt-1 text-xs text-zinc-600 break-words">{n.body}</div>}

                                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                                    <div className="truncate">{new Date(n.created_at).toLocaleString()}</div>
                                    <div className="flex items-center gap-2">
                                      {confirmDeleteId === n.id ? (
                                        <>
                                          <button className="rounded border px-2 py-1 hover:bg-zinc-50" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                                          <button className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100" onClick={() => doDelete(n.id)}>
                                            <Trash2 size={14} /> Delete
                                          </button>
                                        </>
                                      ) : (
                                        <button className="inline-flex items-center gap-1 rounded border px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setConfirmDeleteId(n.id)}>
                                          <Trash2 size={14} /> Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
