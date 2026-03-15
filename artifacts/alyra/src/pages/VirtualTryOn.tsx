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
// MediaPipe 21-point hand model: tip=4/8/12/16/20, base of nail=3/7/11/15/19
const NAIL_PAIRS = [[4,3],[8,7],[12,11],[16,15],[20,19]] as const;

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
    for (const [tipIdx, baseIdx] of NAIL_PAIRS) {
      const tip  = lms[tipIdx];
      const base = lms[baseIdx];

      const tx = tip.x  * W,  ty = tip.y  * H;
      const bx = base.x * W,  by = base.y * H;
      const dx = tx - bx, dy = ty - by;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const angle  = Math.atan2(dy, dx);

      const nH  = segLen * 0.92;
      const nW  = nH * 0.72;
      const rad = nW * 0.42;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(angle + Math.PI / 2);

      // ── Nail polish body ──
      ctx.globalAlpha = 0.86;
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.roundRect(-nW / 2, 0, nW, nH, [rad, rad, nW * 0.2, nW * 0.2]);
      ctx.fill();

      // ── Glossy shine highlight ──
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(-nW / 2, 0, nW / 2, 0);
      shine.addColorStop(0,    "rgba(255,255,255,0)");
      shine.addColorStop(0.22, "rgba(255,255,255,0.42)");
      shine.addColorStop(0.62, "rgba(255,255,255,0.08)");
      shine.addColorStop(1,    "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.roundRect(-nW / 2, nH * 0.04, nW, nH * 0.52, [rad, rad, 0, 0]);
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

  // ── Overlay rendering effect ────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "ready" || !landmarks || !selectedId) return;
    const img    = imgRef.current;
    const canvas = overlayRef.current;
    if (!img || !canvas) return;

    const color = MOCK_COLORS.find(c => c.id === selectedId);
    if (!color) return;

    const render = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawNailOverlay(canvas, landmarks, color.colorCode);
    };

    if (img.complete && img.naturalWidth > 0) {
      render();
    } else {
      img.addEventListener("load", render, { once: true });
      return () => img.removeEventListener("load", render);
    }
  }, [stage, landmarks, selectedId]);

  // ── Run hand detection on a loaded image URL ────────────────────────────────
  const detectAndShow = useCallback(async (url: string) => {
    setStage("detecting");
    setPhotoUrl(url);
    setErrorMsg("");

    try {
      const landmarker = await getHandLandmarker();

      // Decode image → resize if too large → draw onto a canvas and pass
      // the canvas to detect(). HTMLCanvasElement is the most reliable
      // ImageSource for MediaPipe v0.10.32.  Large phone-camera images
      // (4000×3000+) cause an empty {} throw inside the WASM runtime, so
      // we cap at 1280px on the longest edge before detection.
      const MAX_PX = 1280;

      const rawBitmap = await (async () => {
        if (url.startsWith("data:")) {
          const [header, b64] = url.split(",");
          const mime   = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
          const binary = atob(b64);
          const bytes  = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return createImageBitmap(new Blob([bytes], { type: mime }));
        }
        return createImageBitmap(await fetch(url).then(r => r.blob()));
      })();

      const scale  = Math.min(1, MAX_PX / Math.max(rawBitmap.width, rawBitmap.height));
      const W      = Math.round(rawBitmap.width  * scale);
      const H      = Math.round(rawBitmap.height * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width  = W;
      offscreen.height = H;
      offscreen.getContext("2d")!.drawImage(rawBitmap, 0, 0, W, H);
      rawBitmap.close();

      const result = landmarker.detect(offscreen);

      if (!result || !result.landmarks || result.landmarks.length === 0) {
        setErrorMsg("No hand detected. Try a well-lit photo with fingers spread apart and good lighting.");
        setStage("error");
        return;
      }

      setLandmarks(result.landmarks);

      // Auto-pick first in-stock color
      if (!selectedId) {
        const first = MOCK_COLORS.find(c => c.inStock);
        if (first) setSelectedId(first.id);
      }

      setStage("ready");
    } catch (err: any) {
      console.error("[VirtualTryOn] model/detect error:", err);
      // MediaPipe sometimes throws an empty object {} — treat it as a
      // detection failure rather than a model-load failure.
      const hasMsg = err && typeof err.message === "string" && err.message.length > 0;
      const msg = hasMsg
        ? err.message
        : "No hand detected. Make sure your hand is clearly visible with good lighting and fingers spread apart, then try again.";
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
    detectAndShow(c.toDataURL("image/jpeg", 0.92));
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => detectAndShow(ev.target!.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    stopCamera();
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
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
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
              <p className="text-white font-semibold text-lg">Detecting your nails…</p>
              <p className="text-muted-foreground text-sm mt-1">AI is mapping your hand landmarks</p>
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
              <div className="relative inline-block max-w-full">
                <img
                  ref={imgRef}
                  src={photoUrl}
                  alt="Your hand"
                  className="block rounded-2xl w-full"
                  style={{ maxHeight: "560px", objectFit: "contain" }}
                />
                <canvas
                  ref={overlayRef}
                  className="absolute top-0 left-0 pointer-events-none rounded-2xl"
                  style={{ width: "100%", height: "100%" }}
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
