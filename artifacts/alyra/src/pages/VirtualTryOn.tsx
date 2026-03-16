import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { MOCK_COLORS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Camera, Upload, RefreshCw, Sparkles, ChevronRight,
  X, Loader2, ArrowLeft, AlertCircle, Check, Wand2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── MediaPipe landmark pairs: [fingertip idx, base idx] ──────────────────────
// MediaPipe 21-point hand model:
//   tip=4/8/12/16/20, DIP=3/7/11/15/19, PIP=2/6/10/14/18, MCP=1/5/9/13/17
// For each finger we also need the MCP of the adjacent finger so we can
// compute the true lateral (side-to-side) orientation of the nail plate.
//
// Layout for angle computation per finger:
//   [tipIdx, dipIdx, lateralA, lateralB]
//   lateralA / lateralB are the nearest stable knuckle points for estimating
//   the local side-to-side direction of the nail bed.
//   Each finger also has small per-finger tuning constants for width, height,
//   and cuticle/tip coverage because edge fingers and the thumb sit differently.
// heightScale: nail plate height as a fraction of the tip→DIP segment length.
// widthScale:  nail width as a fraction of nail height.
// dipFrac:     how far along tip→DIP to place the CENTER of the overlay (0 = at tip, 1 = at DIP).
const NAIL_DEFS = [
  // Thumb omitted — in most natural hand poses the thumbnail faces sideways
  // and cannot be reliably overlaid. Future: detect dorsal-facing thumbs.
  { tip: 8,  dip: 7,  latA: 5,  latB: 17, thumbMode: false, heightScale: 0.72, widthScale: 0.85, dipFrac: -0.02 },
  { tip: 12, dip: 11, latA: 9,  latB: 17, thumbMode: false, heightScale: 0.72, widthScale: 0.87, dipFrac: -0.06, lateralShift: -0.25 },
  { tip: 16, dip: 15, latA: 5,  latB: 17, thumbMode: false, heightScale: 0.70, widthScale: 0.83, dipFrac: -0.02 },
  { tip: 20, dip: 19, latA: 5,  latB: 17, thumbMode: false, heightScale: 0.65, widthScale: 0.75, dipFrac: -0.07, lateralShift: 0.18 },
] as const;

// ── Canvas drawing ────────────────────────────────────────────────────────────
function drawNailOverlay(
  canvas: HTMLCanvasElement,
  landmarkSets: Array<{x: number; y: number}[]>,
  hex: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  for (const lms of landmarkSets) {
    for (const def of NAIL_DEFS) {
      const tip  = lms[def.tip];
      const dip  = lms[def.dip];
      const latA = lms[def.latA];
      const latB = lms[def.latB];

      // ── Finger axis (tip → DIP, "into" the finger body) ──
      const ax = (dip.x - tip.x) * W;
      const ay = (dip.y - tip.y) * H;
      const axLen = Math.sqrt(ax * ax + ay * ay) || 1;

      let dirX = ax / axLen;
      let dirY = ay / axLen;

      if (def.thumbMode) {
        // The thumbnail follows the raw distal axis more closely than the
        // other fingers, so we keep the uncorrected direction here.
      } else {
        // Project the finger axis to be perpendicular to the local lateral
        // axis, then blend with the raw direction so spread fingers still
        // keep a natural lean instead of snapping overly upright.
        const lx = (latB.x - latA.x) * W;
        const ly = (latB.y - latA.y) * H;
        const lLen = Math.sqrt(lx * lx + ly * ly) || 1;
        const lnx  = lx / lLen, lny = ly / lLen;

        const dot = dirX * lnx + dirY * lny;
        const px  = dirX - dot * lnx;
        const py  = dirY - dot * lny;
        const pLen = Math.sqrt(px * px + py * py) || 1;
        const projX = px / pLen;
        const projY = py / pLen;
        const blendX = dirX * 0.45 + projX * 0.55;
        const blendY = dirY * 0.45 + projY * 0.55;
        const blendLen = Math.sqrt(blendX * blendX + blendY * blendY) || 1;
        dirX = blendX / blendLen;
        dirY = blendY / blendLen;
      }

      const nailAngle = Math.atan2(dirY, dirX);

      const segLen = axLen;          // tip→DIP distance in pixels
      const nH     = segLen * def.heightScale;
      const nW     = nH * def.widthScale;
      const rad    = nW * 0.42;

      const tx = tip.x * W;
      const ty = tip.y * H;

      // Place the overlay center at dipFrac of the way from tip toward DIP.
      // dipFrac ≈ 0.38 means the center sits just past the free edge of the nail
      // (tip landmark is at the very end of the finger), so the overlay spans
      // from slightly beyond the fingertip down to the cuticle line.
      let centerX = tx + dirX * segLen * def.dipFrac;
      let centerY = ty + dirY * segLen * def.dipFrac;
      // Per-finger lateral shift (perpendicular to finger axis)
      // Positive = shift right (from camera's perspective on a right hand)
      if (def.lateralShift) {
        const perpX = -dirY;
        const perpY =  dirX;
        centerX += perpX * nW * def.lateralShift;
        centerY += perpY * nW * def.lateralShift;
      }
      if (def.thumbMode) {
        // Shift toward dorsal (nail) surface — perpendicular to finger axis
        const perpX = -dirY;
        const perpY =  dirX;
        centerX -= perpX * nW * 0.70;
        centerY -= perpY * nW * 0.70;
      }

      ctx.save();
      ctx.translate(centerX, centerY);

      ctx.rotate(nailAngle + Math.PI / 2);

      // ── Nail polish body ──
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.roundRect(-nW / 2, -nH / 2, nW, nH, [nW * 0.18, nW * 0.18, rad, rad]);
      ctx.fill();

      // ── Glossy shine highlight ──
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(-nW / 2, -nH / 2, nW / 2, -nH / 2);
      shine.addColorStop(0,    "rgba(255,255,255,0)");
      shine.addColorStop(0.22, "rgba(255,255,255,0.42)");
      shine.addColorStop(0.62, "rgba(255,255,255,0.08)");
      shine.addColorStop(1,    "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.roundRect(-nW / 2, -nH / 2 + nH * 0.04, nW, nH * 0.50, [rad, rad, 0, 0]);
      ctx.fill();

      ctx.restore();
    }
  }
}

// ── Lazy MediaPipe init ───────────────────────────────────────────────────────
type HandLandmarkerAny = any;
let cachedLandmarker: HandLandmarkerAny | null = null;

async function getHandLandmarker(): Promise<HandLandmarkerAny> {
  if (cachedLandmarker) return cachedLandmarker;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(`${base}/mediapipe-wasm`);
  cachedLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `${base}/mediapipe-models/hand_landmarker.task`,
      delegate: "CPU",
    },
    runningMode: "IMAGE",
    numHands: 2,
  });
  return cachedLandmarker;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Stage = "idle" | "camera" | "detecting" | "ready" | "error";

// ── Component ─────────────────────────────────────────────────────────────────
export function VirtualTryOn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [stage,      setStage]      = useState<Stage>("idle");
  const [photoUrl,   setPhotoUrl]   = useState<string | null>(null);
  const [landmarks,  setLandmarks]  = useState<Array<{x:number;y:number}[]> | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");

  const imgRef     = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  // Track the current blob URL so we can revoke it when it's no longer needed.
  // Important: do NOT revoke in a useEffect tied to photoUrl — React's cleanup
  // fires before the next paint, which revokes the URL before new Image() loads it.
  const blobUrlRef = useRef<string | null>(null);

  // ── Overlay rendering effect ────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "ready" || !landmarks || !selectedId) return;
    const img    = imgRef.current;
    const canvas = overlayRef.current;
    if (!img || !canvas) return;

    const color = MOCK_COLORS.find(c => c.id === selectedId);
    if (!color) return;

    const render = () => {
      // getBoundingClientRect gives sub-pixel-accurate CSS dimensions;
      // round to nearest integer for the canvas drawing buffer.
      const rect = img.getBoundingClientRect();
      const W = Math.round(rect.width)  || img.naturalWidth;
      const H = Math.round(rect.height) || img.naturalHeight;
      if (!W || !H) return;
      canvas.width  = W;
      canvas.height = H;
      // Keep canvas CSS size explicitly in sync with measured image size.
      canvas.style.width  = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      drawNailOverlay(canvas, landmarks, color.colorCode);
    };

    if (img.complete && img.naturalWidth > 0) {
      render();
    } else {
      img.addEventListener("load", render, { once: true });
      return () => img.removeEventListener("load", render);
    }

    // Re-render overlay if the container is resized (e.g. window resize)
    const ro = new ResizeObserver(render);
    ro.observe(img);
    return () => ro.disconnect();
  }, [stage, landmarks, selectedId]);

  // ── Run hand detection ───────────────────────────────────────────────────────
  // Strategy: load url into an <img>, draw to a capped-size canvas,
  // extract raw ImageData (RGBA bytes), and feed that to detect().
  // ImageData has no "origin" concept so it bypasses every WebGL
  // cross-origin texture restriction that can cause silent {} errors.
  const detectAndShow = useCallback(async (url: string) => {
    // Revoke the PREVIOUS blob URL now that we're starting a new detection.
    // We do this before updating blobUrlRef so we never revoke the new URL.
    if (blobUrlRef.current && blobUrlRef.current !== url) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    if (url.startsWith("blob:")) blobUrlRef.current = url;

    setStage("detecting");
    setPhotoUrl(url);
    setErrorMsg("");

    try {
      const landmarker = await getHandLandmarker();

      // Load image into a browser-decoded element
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = url;
      });

      // Cap at 1024px — large phone-camera images (4000×3000+) cause
      // out-of-memory errors inside the WASM runtime.
      const MAX_PX = 1024;
      const longest = Math.max(imgEl.naturalWidth || 1, imgEl.naturalHeight || 1);
      const scale   = Math.min(1, MAX_PX / longest);
      const W = Math.max(1, Math.round((imgEl.naturalWidth  || 300) * scale));
      const H = Math.max(1, Math.round((imgEl.naturalHeight || 300) * scale));
      const canvas = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const bmp = await createImageBitmap(imgEl, { resizeWidth: W, resizeHeight: H, imageOrientation: "from-image" });
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      // Pass canvas element directly — lets MediaPipe use its WebGL
      // texture path which correctly handles non-square aspect ratios.
      const result = landmarker.detect(canvas);

      if (!result?.landmarks?.length) {
        setErrorMsg("No hand detected. Try a clear, well-lit photo with all fingers spread apart, taken from above.");
        setStage("error");
        return;
      }

      setLandmarks(result.landmarks);
      if (!selectedId) {
        const first = MOCK_COLORS.find(c => c.inStock);
        if (first) setSelectedId(first.id);
      }
      setStage("ready");
    } catch (err: any) {
      console.error("[VirtualTryOn] detect error:", err);
      const msg = (typeof err?.message === "string" && err.message.length > 0)
        ? err.message
        : "Something went wrong running the AI. Please try again.";
      setErrorMsg(msg);
      setStage("error");
    }
  }, [selectedId]);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStage("camera");
    } catch {
      toast({ title: "Camera access denied", description: "Allow camera access in your browser settings and try again." });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement("canvas");
    c.width  = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext("2d")!.drawImage(video, 0, 0);
    stopCamera();
    // Use toBlob → object URL so the resulting <img> load is same-origin
    // and the canvas stays untainted for getImageData().
    c.toBlob(blob => {
      if (!blob) return;
      const objUrl = URL.createObjectURL(blob);
      detectAndShow(objUrl);
    }, "image/jpeg", 0.92);
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      /\.(heic|heif)$/i.test(file.name);

    if (isHeic) {
      // HEIC is not natively decodable by most desktop browsers.
      // Convert to JPEG in-browser before detection.
      setStage("detecting");
      setPhotoUrl(null);
      setErrorMsg("");
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
        const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
        const objUrl = URL.createObjectURL(jpegBlob);
        detectAndShow(objUrl);
      } catch {
        setErrorMsg("Couldn't convert your HEIC photo. Please export it as a JPEG or PNG from your Photos app and try again.");
        setStage("error");
      }
      return;
    }

    const objUrl = URL.createObjectURL(file);
    detectAndShow(objUrl);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    stopCamera();
    // Now it's safe to revoke — we're done with the photo entirely
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setStage("idle");
    setPhotoUrl(null);
    setLandmarks(null);
    setErrorMsg("");
  };

  const selectedColor = MOCK_COLORS.find(c => c.id === selectedId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-white flex flex-col">

      {/* ── Nav ── */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { stopCamera(); setLocation("/salon"); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-white/15 select-none">|</span>
          <span className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="w-4 h-4 text-primary" /> Virtual Try-On
          </span>
        </div>
        <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setLocation("/client/book")}>
          Book Now <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 py-10">

        {/* ── IDLE ── */}
        {stage === "idle" && (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
              <Wand2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display mb-4">
              Try Colors On<br />Your Nails
            </h1>
            <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
              Take or upload a photo of your hand — our AI instantly maps your nail positions
              so you can preview every shade in our inventory before you book.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-8">
              <button
                onClick={startCamera}
                className="group bg-card border border-white/10 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all"
              >
                <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center transition-colors">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">Take a Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Use your camera live</p>
                </div>
              </button>

              <label className="group bg-card border border-white/10 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all cursor-pointer">
                <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center transition-colors">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">Upload a Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP, HEIC</p>
                </div>
                <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
              </label>
            </div>

            <p className="text-xs text-muted-foreground max-w-xs">
              For best results: bright, even lighting · fingers spread apart · photo taken from above
            </p>
          </div>
        )}

        {/* ── CAMERA ── */}
        {stage === "camera" && (
          <div className="flex flex-col items-center gap-5 flex-1">
            <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Corner brackets */}
              <div className="absolute inset-6 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Position your hand in the frame with fingers spread</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { stopCamera(); setStage("idle"); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button variant="gold" size="lg" className="px-10" onClick={captureFromCamera}>
                <Camera className="w-5 h-5 mr-2" /> Capture
              </Button>
            </div>
          </div>
        )}

        {/* ── DETECTING ── */}
        {stage === "detecting" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Analyzing your photo…</p>
              <p className="text-muted-foreground text-sm mt-1">Converting &amp; mapping your hand landmarks</p>
            </div>
            {photoUrl && (
              <img src={photoUrl} alt="" className="w-40 h-28 object-cover rounded-xl opacity-30 blur-sm mt-2" />
            )}
          </div>
        )}

        {/* ── ERROR ── */}
        {stage === "error" && (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-5">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Couldn't Detect Hand</h2>
              <p className="text-muted-foreground max-w-sm leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
              <label className="cursor-pointer">
                <Button variant="gold" asChild>
                  <span><Upload className="w-4 h-4 mr-2" /> Upload Different Photo</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>
          </div>
        )}

        {/* ── READY ── */}
        {stage === "ready" && photoUrl && (
          <div className="flex flex-col lg:flex-row gap-8 flex-1">

            {/* Photo + overlay */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Container sizes to exactly the rendered image — no letterboxing,
                  so the canvas overlay lines up pixel-perfectly with the photo. */}
              <div className="relative w-fit max-w-full">
                <img
                  ref={imgRef}
                  src={photoUrl}
                  alt="Your hand"
                  className="block rounded-2xl max-w-full"
                  style={{ maxHeight: "560px" }}
                />
                <canvas
                  ref={overlayRef}
                  className="absolute top-0 left-0 pointer-events-none rounded-2xl"
                />
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors w-fit"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try a different photo
              </button>
            </div>

            {/* Color picker sidebar */}
            <div className="w-full lg:w-72 flex flex-col gap-5">

              <div>
                <h2 className="text-xl font-semibold">Pick a Color</h2>
                <p className="text-sm text-muted-foreground mt-0.5">From our current inventory</p>
              </div>

              {/* Active selection */}
              {selectedColor && (
                <div className="bg-card border border-white/8 rounded-xl p-4 flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-lg flex-shrink-0 ring-2 ring-primary/60"
                    style={{ backgroundColor: selectedColor.colorCode }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{selectedColor.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {selectedColor.brand} · {selectedColor.finish}
                    </p>
                    {!selectedColor.inStock && (
                      <p className="text-xs text-amber-400 mt-0.5">Out of stock</p>
                    )}
                  </div>
                </div>
              )}

              {/* Color swatches grid */}
              <div className="grid grid-cols-5 gap-2">
                {MOCK_COLORS.map(color => (
                  <button
                    key={color.id}
                    title={`${color.name} — ${color.brand}${!color.inStock ? " (out of stock)" : ""}`}
                    onClick={() => setSelectedId(color.id)}
                    className="relative aspect-square rounded-xl transition-all focus:outline-none hover:scale-110"
                    style={{ backgroundColor: color.colorCode }}
                  >
                    {!color.inStock && (
                      <div className="absolute inset-0 rounded-xl bg-black/55 flex items-center justify-center">
                        <X className="w-3 h-3 text-white/70" />
                      </div>
                    )}
                    {selectedId === color.id && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-white ring-offset-2 ring-offset-background flex items-center justify-center">
                        <Check className="w-3 h-3 drop-shadow-md text-white" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.8))" }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                <X className="inline w-3 h-3 mr-1 opacity-50" />= currently out of stock
              </p>

              {/* CTAs */}
              <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/5">
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  disabled={!selectedColor?.inStock}
                  onClick={() => setLocation("/client/book")}
                >
                  <Sparkles className="w-4 h-4" />
                  Book with this shade
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-white"
                  onClick={() => setLocation("/client/book")}
                >
                  Book without color <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
