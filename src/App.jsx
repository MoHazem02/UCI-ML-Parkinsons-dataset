import { useState, useRef, useEffect } from "react";

const S = {
  app: { minHeight: "100vh", background: "#0b1120", color: "#e2eaf4", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" },
  page: { width: "100%", maxWidth: 860, padding: "32px 20px 60px" },
  card: { background: "#121c30", border: "1px solid #1e2f4a", borderRadius: 14, padding: "28px 32px", marginBottom: 20 },
  label: { fontSize: 12, letterSpacing: 1.2, color: "#4a7fa8", textTransform: "uppercase", fontWeight: 600, marginBottom: 6, display: "block" },
  input: { width: "100%", background: "#0d1628", border: "1px solid #1e3050", borderRadius: 8, padding: "9px 13px", color: "#e2eaf4", fontSize: 14, fontFamily: "monospace", outline: "none", boxSizing: "border-box" },
  btn: (variant = "primary") => ({
    padding: variant === "small" ? "7px 16px" : "12px 28px",
    borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: variant === "small" ? 13 : 15, letterSpacing: 0.4,
    background: variant === "primary" ? "#0ea5e9" : variant === "success" ? "#10b981" : variant === "ghost" ? "transparent" : "#1e3050",
    color: variant === "ghost" ? "#7aa3c4" : "#fff",
    border: variant === "ghost" ? "1px solid #1e3050" : "none",
    transition: "opacity 0.2s"
  }),
  badge: (level) => ({
    display: "inline-block", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
    background: level === "High" ? "#ef444420" : level === "Moderate" ? "#f59e0b20" : "#22c55e20",
    color: level === "High" ? "#f87171" : level === "Moderate" ? "#fbbf24" : "#4ade80",
    border: `1px solid ${level === "High" ? "#ef4444" : level === "Moderate" ? "#f59e0b" : "#22c55e"}`,
  }),
  tab: (active) => ({
    padding: "9px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: active ? "#0ea5e9" : "transparent", color: active ? "#fff" : "#4a7fa8",
    transition: "all 0.2s"
  }),
};

const GROUPS = [
  {
    name: "Fundamental Frequency", icon: "〜",
    features: [
      { key: "fo", label: "MDVP:Fo(Hz)", desc: "Average vocal fundamental frequency", step: "0.001" },
      { key: "fhi", label: "MDVP:Fhi(Hz)", desc: "Maximum vocal fundamental frequency", step: "0.001" },
      { key: "flo", label: "MDVP:Flo(Hz)", desc: "Minimum vocal fundamental frequency", step: "0.001" },
    ]
  },
  {
    name: "Jitter Measures", icon: "⚡",
    features: [
      { key: "jitter_pct", label: "MDVP:Jitter(%)", desc: "Variation in fundamental frequency (%)", step: "0.00001" },
      { key: "jitter_abs", label: "MDVP:Jitter(Abs)", desc: "Absolute variation in fundamental frequency", step: "0.000001" },
      { key: "rap", label: "MDVP:RAP", desc: "Relative average perturbation", step: "0.00001" },
      { key: "ppq", label: "MDVP:PPQ", desc: "Five-point period perturbation quotient", step: "0.00001" },
      { key: "ddp", label: "Jitter:DDP", desc: "Average absolute differences of consecutive periods", step: "0.00001" },
    ]
  },
  {
    name: "Shimmer Measures", icon: "◌",
    features: [
      { key: "shimmer", label: "MDVP:Shimmer", desc: "Variation in amplitude", step: "0.00001" },
      { key: "shimmer_db", label: "MDVP:Shimmer(dB)", desc: "Amplitude variation in decibels", step: "0.001" },
      { key: "apq3", label: "Shimmer:APQ3", desc: "Three-point amplitude perturbation quotient", step: "0.00001" },
      { key: "apq5", label: "Shimmer:APQ5", desc: "Five-point amplitude perturbation quotient", step: "0.00001" },
      { key: "apq", label: "MDVP:APQ", desc: "Amplitude perturbation quotient", step: "0.00001" },
      { key: "dda", label: "Shimmer:DDA", desc: "Average absolute differences between consecutive amplitudes", step: "0.00001" },
    ]
  },
  {
    name: "Noise & Nonlinear", icon: "∿",
    features: [
      { key: "nhr", label: "NHR", desc: "Noise-to-harmonics ratio", step: "0.00001" },
      { key: "hnr", label: "HNR", desc: "Harmonics-to-noise ratio (dB)", step: "0.001" },
      { key: "rpde", label: "RPDE", desc: "Recurrence period density entropy", step: "0.000001" },
      { key: "dfa", label: "DFA", desc: "Signal fractal scaling exponent", step: "0.000001" },
      { key: "spread1", label: "spread1", desc: "Nonlinear measure of fundamental frequency variation", step: "0.000001" },
      { key: "spread2", label: "spread2", desc: "Nonlinear measure of fundamental frequency variation", step: "0.000001" },
      { key: "d2", label: "D2", desc: "Correlation dimension", step: "0.000001" },
      { key: "ppe", label: "PPE", desc: "Pitch period entropy", step: "0.000001" },
    ]
  }
];

const PD_SAMPLE = {
  fo: 119.992, fhi: 157.302, flo: 74.997,
  jitter_pct: 0.00784, jitter_abs: 0.00007, rap: 0.0037, ppq: 0.00554, ddp: 0.01109,
  shimmer: 0.04374, shimmer_db: 0.426, apq3: 0.02182, apq5: 0.0313, apq: 0.02971, dda: 0.06545,
  nhr: 0.02211, hnr: 21.033, rpde: 0.414783, dfa: 0.815285,
  spread1: -4.813031, spread2: 0.266482, d2: 2.301442, ppe: 0.284654
};

const HEALTHY_SAMPLE = {
  fo: 197.076, fhi: 206.896, flo: 192.055,
  jitter_pct: 0.00289, jitter_abs: 0.0000148, rap: 0.00166, ppq: 0.00168, ddp: 0.00498,
  shimmer: 0.01098, shimmer_db: 0.097, apq3: 0.00563, apq5: 0.0068, apq: 0.00802, dda: 0.01689,
  nhr: 0.00339, hnr: 26.775, rpde: 0.422229, dfa: 0.741367,
  spread1: -7.3483, spread2: 0.177551, d2: 1.743867, ppe: 0.085569
};

const DEFAULT_FORM = {
  fo: 150, fhi: 185, flo: 110, jitter_pct: 0.004, jitter_abs: 0.00004,
  rap: 0.002, ppq: 0.003, ddp: 0.006, shimmer: 0.02, shimmer_db: 0.2,
  apq3: 0.01, apq5: 0.015, apq: 0.015, dda: 0.03, nhr: 0.015, hnr: 23,
  rpde: 0.48, dfa: 0.71, spread1: -6, spread2: 0.22, d2: 2.0, ppe: 0.16
};

const FEATURE_LABEL_TO_KEY = GROUPS.reduce((acc, group) => {
  group.features.forEach(feature => {
    acc[feature.label] = feature.key;
  });
  return acc;
}, {});

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
const API_FALLBACK_URL = "http://localhost:5000";

async function fetchBackend(path, options = {}) {
  const urls = Array.from(new Set([API_BASE_URL, API_FALLBACK_URL]));
  let lastError;

  for (const baseUrl of urls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      return { response, baseUrl };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch");
}

// Removed: SYSTEM_PROMPT (no longer needed - using local XGBoost backend)
// The backend server handles all analysis using the trained XGBoost model

function RiskGauge({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  const angle = Math.PI - (pct / 100) * Math.PI;
  const r = 78, cx = 110, cy = 100;
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);
  const arcColor = pct < 31 ? "#22c55e" : pct < 66 ? "#f59e0b" : "#ef4444";
  const bgArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const endX = cx + r * Math.cos(angle);
  const endY = cy - r * Math.sin(angle);
  const large = pct > 50 ? 1 : 0;
  const fillArc = `M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`;
  return (
    <svg width={220} height={120} viewBox="0 0 220 120">
      <path d={bgArc} fill="none" stroke="#1e3050" strokeWidth={14} strokeLinecap="round" />
      {pct > 0 && <path d={fillArc} fill="none" stroke={arcColor} strokeWidth={14} strokeLinecap="round" />}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#e2eaf4" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#e2eaf4" />
      <text x={cx} y={cy + 20} textAnchor="middle" fill={arcColor} fontSize={26} fontWeight={700}>{pct}</text>
      <text x={cx} y={cy + 36} textAnchor="middle" fill="#4a7fa8" fontSize={11}>/100 risk score</text>
      <text x={cx - r} y={cy + 16} fill="#4a7fa8" fontSize={10}>0</text>
      <text x={cx + r - 10} y={cy + 16} fill="#4a7fa8" fontSize={10}>100</text>
    </svg>
  );
}

function FeatureCard({ feat }) {
  const statusColors = { normal: "#22c55e", elevated: "#ef4444", reduced: "#f59e0b", borderline: "#a78bfa" };
  const statusBg = { normal: "#22c55e15", elevated: "#ef444415", reduced: "#f59e0b15", borderline: "#a78bfa15" };
  return (
    <div style={{ background: statusBg[feat.status] || "#1a2540", border: `1px solid ${statusColors[feat.status] || "#1e3050"}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: statusColors[feat.status] || "#e2eaf4" }}>{feat.name}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "#e2eaf4" }}>{typeof feat.value === "number" ? feat.value.toFixed(6).replace(/\.?0+$/, "") : feat.value}</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: statusBg[feat.status], color: statusColors[feat.status], border: `1px solid ${statusColors[feat.status]}50`, textTransform: "capitalize" }}>{feat.status}</span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#7aa3c4", margin: 0 }}>{feat.significance}</p>
    </div>
  );
}

function WelcomeScreen({ onStart, onManual }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 72, height: 72, background: "#0ea5e920", border: "2px solid #0ea5e940", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 34 }}>🧠</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#e2eaf4", margin: "0 0 12px", letterSpacing: -1 }}>NeuroVoice <span style={{ color: "#0ea5e9" }}>PD Analyzer</span></h1>
      <p style={{ fontSize: 17, color: "#7aa3c4", maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.7 }}>
        XGBoost-powered Parkinson's Disease risk assessment from voice biomarkers, trained on the UCI Parkinson's Dataset.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: "24px 0 40px" }}>
        {["Voice Recording", "Feature Extraction", "AI Analysis", "Clinical Interpretation"].map(t => (
          <span key={t} style={{ background: "#0ea5e915", border: "1px solid #0ea5e930", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#7dd3fc" }}>{t}</span>
        ))}
      </div>
      <div style={{ background: "#121c30", border: "1px solid #1e2f4a", borderRadius: 12, padding: "20px 28px", maxWidth: 520, margin: "0 auto 36px", textAlign: "left" }}>
        <p style={{ fontSize: 12, color: "#4a7fa8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "0 0 10px" }}>⚠ Clinical Disclaimer</p>
        <p style={{ fontSize: 13, color: "#7aa3c4", margin: 0, lineHeight: 1.7 }}>
          This tool is for research and educational purposes only. It is not a medical diagnostic device and should not replace professional clinical evaluation by a licensed neurologist.
        </p>
      </div>
      <button style={{ ...S.btn("secondary"), marginRight: 12 }} onClick={onManual}>Enter Features Manually</button>
      <button style={S.btn("primary")} onClick={onStart}>Record Voice Sample →</button>
    </div>
  );
}

function audioBufferToWav(audioBuffer) {
  const channels = [];
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    channels.push(audioBuffer.getChannelData(channel));
  }

  const sampleRate = audioBuffer.sampleRate;
  const sampleCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + sampleCount * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < sampleCount; i += 1) {
    let sample = 0;
    for (let channel = 0; channel < channels.length; channel += 1) {
      sample += channels[channel][i];
    }
    sample = Math.max(-1, Math.min(1, sample / channels.length));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function getSupportedAudioMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
}

function RecordingScreen({ onComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close?.();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const mimeType = getSupportedAudioMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        try {
          const recordedBlob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
          const arrayBuffer = await recordedBlob.arrayBuffer();
          const decodedAudio = await audioContext.decodeAudioData(arrayBuffer.slice(0));
          setAudioBlob(audioBufferToWav(decodedAudio));
        } catch (err) {
          setError("Could not convert the recording to WAV. Please try recording again.");
        } finally {
          streamRef.current?.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      setError("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const extractFeatures = async () => {
    if (!audioBlob) {
      setError("No audio recorded");
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const { response: resp } = await fetchBackend("/extract_features", {
        method: "POST",
        body: formData
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || `Server error: ${resp.status}`);
      }

      const data = await resp.json();
      
      if (data.success) {
        onComplete(data.features);
      } else {
        setError(data.error || "Failed to extract features");
      }
    } catch (e) {
      setError(
        e.message.includes("fetch")
          ? `Cannot connect to server at ${API_BASE_URL} or ${API_FALLBACK_URL}. Browser error: ${e.message}`
          : "Failed to extract features: " + e.message
      );
    } finally {
      setExtracting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 80, height: 80, background: "#0ea5e920", border: "2px solid #0ea5e940", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 40 }}>🎤</div>
      
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#e2eaf4", margin: "0 0 12px" }}>Voice Recording</h2>
      <p style={{ fontSize: 14, color: "#7aa3c4", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
        Please read the following statement clearly and naturally into your microphone:
      </p>

      <div style={{ background: "#0ea5e910", border: "1px solid #0ea5e930", borderRadius: 12, padding: "20px 24px", maxWidth: 500, margin: "0 auto 36px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#e2eaf4", fontStyle: "italic", margin: 0, lineHeight: 1.8 }}>
          "Aa" - Sustained phonation for at least 5 seconds, or read a short sentence naturally.
        </p>
      </div>

      {error && (
        <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: 10, padding: "12px 16px", margin: "0 auto 20px", maxWidth: 500, color: "#f87171", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: "#121c30", border: "1px solid #1e2f4a", borderRadius: 14, padding: "32px", maxWidth: 500, margin: "0 auto 28px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: isRecording ? "#ef4444" : audioBlob ? "#10b981" : "#1e3050",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `3px solid ${isRecording ? "#f87171" : audioBlob ? "#34d399" : "#38587a"}`,
            animation: isRecording ? "pulse 1s infinite" : "none"
          }}>
            <span style={{ fontSize: 48 }}>
              {isRecording ? "⏹️" : audioBlob ? "✓" : "🎤"}
            </span>
          </div>
        </div>

        {isRecording && (
          <p style={{ fontSize: 24, fontWeight: 700, color: "#ef4444", margin: "0 0 20px" }}>
            {formatTime(recordingTime)}
          </p>
        )}

        {audioBlob && !isRecording && (
          <p style={{ fontSize: 13, color: "#4ade80", margin: "0 0 20px" }}>
            ✓ Audio recorded ({formatTime(recordingTime)})
          </p>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          }
        `}</style>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {!isRecording && !audioBlob && (
            <button style={S.btn("primary")} onClick={startRecording}>
              Start Recording
            </button>
          )}

          {isRecording && (
            <button style={{ ...S.btn("primary"), background: "#ef4444" }} onClick={stopRecording}>
              Stop Recording
            </button>
          )}

          {audioBlob && !extracting && (
            <>
              <button style={S.btn("ghost")} onClick={() => { setAudioBlob(null); setRecordingTime(0); }}>
                Re-record
              </button>
              <button style={S.btn("success")} onClick={extractFeatures}>
                Extract Features
              </button>
            </>
          )}

          {extracting && (
            <button style={{ ...S.btn("primary"), opacity: 0.6 }} disabled>
              Extracting Features...
            </button>
          )}
        </div>
      </div>

      <button style={S.btn("ghost")} onClick={onCancel}>
        ← Back to Start
      </button>
    </div>
  );
}

/*
function LegacyWelcomeScreen({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 72, height: 72, background: "#0ea5e920", border: "2px solid #0ea5e940", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 34 }}>🧠</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#e2eaf4", margin: "0 0 12px", letterSpacing: -1 }}>NeuroVoice <span style={{ color: "#0ea5e9" }}>PD Analyzer</span></h1>
      <p style={{ fontSize: 17, color: "#7aa3c4", maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.7 }}>
        XGBoost-powered Parkinson's Disease risk assessment from voice biomarkers, trained on the UCI Parkinson's Dataset.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: "24px 0 40px" }}>
        {["Voice Recording", "Feature Extraction", "AI Analysis", "Clinical Interpretation"].map(t => (
          <span key={t} style={{ background: "#0ea5e915", border: "1px solid #0ea5e930", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#7dd3fc" }}>{t}</span>
        ))}
      </div>
      <div style={{ background: "#121c30", border: "1px solid #1e2f4a", borderRadius: 12, padding: "20px 28px", maxWidth: 520, margin: "0 auto 36px", textAlign: "left" }}>
        <p style={{ fontSize: 12, color: "#4a7fa8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "0 0 10px" }}>⚠ Clinical Disclaimer</p>
        <p style={{ fontSize: 13, color: "#7aa3c4", margin: 0, lineHeight: 1.7 }}>
          This tool is for research and educational purposes only. It is not a medical diagnostic device and should not replace professional clinical evaluation by a licensed neurologist.
        </p>
      </div>
      <button style={S.btn("primary")} onClick={onStart}>Record Voice Sample →</button>
    </div>
  );
}

*/
function InputForm({ formData, setFormData, onAnalyze, patientName, setPatientName, extractedFrom, onRecord, onUseManual }) {
  const [tab, setTab] = useState(0);
  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  const loadSample = (type) => {
    onUseManual?.();
    setFormData(type === "pd" ? { ...PD_SAMPLE } : { ...HEALTHY_SAMPLE });
  };
  const group = GROUPS[tab];
  return (
    <div>
      <div style={S.card}>
        <p style={S.label}>Patient Identifier (optional)</p>
        <input style={S.input} value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Patient ID or initials" />
        {extractedFrom && (
          <p style={{ fontSize: 12, color: "#4ade80", margin: "8px 0 0" }}>✓ Features extracted from voice recording</p>
        )}
      </div>
      <div style={{ ...S.card, marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#e2eaf4", fontWeight: 700 }}>Voice Biomarker Input</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4a7fa8" }}>Review or adjust the 22 voice measurements</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={S.btn("small")} onClick={onRecord}>{extractedFrom ? "Record Again" : "Record Voice"}</button>
            {extractedFrom && (
              <button style={S.btn("ghost")} onClick={onUseManual}>Use Manual Input</button>
            )}
            {!extractedFrom && (
              <>
                <button style={S.btn("small")} onClick={() => loadSample("healthy")}>Load Healthy Sample</button>
                <button style={{ ...S.btn("small"), background: "#7c3aed20", color: "#a78bfa", border: "1px solid #7c3aed50" }} onClick={() => loadSample("pd")}>Load PD Sample</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {GROUPS.map((g, i) => (
            <button key={g.name} style={S.tab(i === tab)} onClick={() => setTab(i)}>
              {g.icon} {g.name}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px 24px" }}>
          {group.features.map(f => (
            <div key={f.key}>
              <label style={S.label}>{f.label}</label>
              <input
                type="number" step={f.step}
                style={S.input}
                value={formData[f.key] ?? ""}
                onChange={e => handleChange(f.key, e.target.value)}
              />
              <p style={{ margin: "5px 0 0", fontSize: 11, color: "#38587a" }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
          {tab > 0 && <button style={S.btn("ghost")} onClick={() => setTab(t => t - 1)}>← Previous</button>}
          {tab < GROUPS.length - 1 && <button style={S.btn("secondary")} onClick={() => setTab(t => t + 1)}>Next →</button>}
          {tab === GROUPS.length - 1 && (
            <button style={{ ...S.btn("primary"), marginLeft: "auto" }} onClick={onAnalyze}>
              🔬 Analyze with XGBoost
            </button>
          )}
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "#38587a" }}>Tab {tab + 1} of {GROUPS.length} — {GROUPS.reduce((a, g) => a + g.features.length, 0)} features total</span>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(id);
  }, []);
  const steps = ["Extracting jitter & shimmer patterns", "Computing harmonic ratios", "Analyzing nonlinear dynamics", "Calibrating against UCI dataset", "Generating risk assessment"];
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ width: 64, height: 64, border: "3px solid #0ea5e920", borderTop: "3px solid #0ea5e9", borderRadius: "50%", margin: "0 auto 32px", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{ fontSize: 22, color: "#e2eaf4", margin: "0 0 8px" }}>Analyzing Voice Biomarkers{dots}</h2>
      <p style={{ color: "#4a7fa8", marginBottom: 36 }}>AI model cross-referencing against UCI Parkinson's Dataset</p>
      <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "left" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < steps.length - 1 ? "1px solid #1a2a40" : "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ea5e9", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#7aa3c4" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsScreen({ result, patientName, onReset }) {
  if (!result) return null;
  const { riskScore, riskLevel, confidence, keyFeatures = [], interpretation, recommendation } = result;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, color: "#e2eaf4", margin: "0 0 4px", fontWeight: 800 }}>Analysis Complete</h2>
          {patientName && <p style={{ margin: 0, fontSize: 13, color: "#4a7fa8" }}>Patient: {patientName}</p>}
        </div>
        <button style={S.btn("ghost")} onClick={onReset}>← New Analysis</button>
      </div>

      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ ...S.label, textAlign: "center", marginBottom: 8 }}>Risk Assessment</p>
          <RiskGauge score={riskScore} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <span style={S.badge(riskLevel)}>{riskLevel} Risk</span>
            <span style={{ ...S.badge("Low"), background: "#7aa3c420", color: "#7aa3c4", border: "1px solid #7aa3c430" }}>Confidence: {confidence}</span>
          </div>
          <p style={{ fontSize: 14, color: "#a0c4e0", lineHeight: 1.8, margin: "0 0 20px" }}>{interpretation}</p>
          <div style={{ background: "#0ea5e910", border: "1px solid #0ea5e930", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>💡 Recommendation</p>
            <p style={{ fontSize: 14, color: "#a0c4e0", margin: 0, lineHeight: 1.7 }}>{recommendation}</p>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ fontSize: 16, color: "#e2eaf4", margin: "0 0 16px", fontWeight: 700 }}>Key Biomarker Analysis</h3>
        {keyFeatures.map((f, i) => <FeatureCard key={i} feat={f} />)}
      </div>

      <div style={{ ...S.card, background: "#0e1928", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        {[
          { label: "Risk Score", value: `${riskScore}/100` },
          { label: "Risk Level", value: riskLevel },
          { label: "Confidence", value: confidence },
          { label: "Features Analyzed", value: "22" },
          { label: "Dataset", value: "UCI PD" },
          { label: "Model", value: "XGBoost" },
        ].map(m => (
          <div key={m.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#38587a", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 4px" }}>{m.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#7dd3fc", margin: 0, fontFamily: "monospace" }}>{m.value}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "#38587a", textAlign: "center", marginTop: 12, lineHeight: 1.7 }}>
        ⚠ This AI analysis is for research and educational purposes only. Consult a licensed neurologist for clinical diagnosis.
        <br />Based on UCI ML Parkinson's Dataset — 195 recordings, 23 with PD.
      </p>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("welcome");
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [patientName, setPatientName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [extractedFrom, setExtractedFrom] = useState(null);

  const switchToManualInput = () => {
    setExtractedFrom(null);
    setError(null);
  };

  const handleExtractedFeatures = (features) => {
    setFormData(prev => {
      const next = { ...prev };
      Object.entries(features || {}).forEach(([label, value]) => {
        const key = FEATURE_LABEL_TO_KEY[label];
        if (key && value !== null && value !== undefined && value !== "") {
          next[key] = Number(value);
        }
      });
      return next;
    });
    setExtractedFrom("voice recording");
    setError(null);
    setStep("input");
  };

  const resetAnalysis = () => {
    setStep("welcome");
    setFormData({ ...DEFAULT_FORM });
    setPatientName("");
    setResult(null);
    setError(null);
    setExtractedFrom(null);
  };

  const handleAnalyze = async () => {
    setStep("loading");
    setError(null);
    try {
      // Build feature map matching the expected backend format
      const featureMap = {};
      GROUPS.forEach(g => g.features.forEach(f => { 
        featureMap[f.label] = formData[f.key]; 
      }));

      // Call local backend server instead of Anthropic API
      const { response: resp } = await fetchBackend("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureMap)
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || `Server error: ${resp.status}`);
      }

      const result = await resp.json();
      setResult(result);
      setStep("results");
    } catch (e) {
      setError(
        e.message.includes("fetch") || e.message.includes("Failed") 
          ? `Cannot connect to server at ${API_BASE_URL} or ${API_FALLBACK_URL}. Browser error: ${e.message}`
          : `Analysis failed: ${e.message}`
      );
      setStep("input");
    }
  };

  return (
    <div style={S.app}>
      <div style={{ width: "100%", maxWidth: 860, padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e2f4a", paddingBottom: 16, marginBottom: 28 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0ea5e9", letterSpacing: 0.5 }}>🧠 NeuroVoice PD Analyzer</span>
          <span style={{ fontSize: 12, color: "#38587a", fontFamily: "monospace" }}>UCI Parkinson's Dataset · v1.0</span>
        </div>
      </div>
      <div style={{ width: "100%", maxWidth: 860, padding: "0 20px 60px" }}>
        {error && <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 14 }}>{error}</div>}
        {step === "welcome" && <WelcomeScreen onStart={() => setStep("recording")} onManual={() => { switchToManualInput(); setStep("input"); }} />}
        {step === "recording" && <RecordingScreen onComplete={handleExtractedFeatures} onCancel={() => setStep("welcome")} />}
        {step === "input" && <InputForm formData={formData} setFormData={setFormData} onAnalyze={handleAnalyze} patientName={patientName} setPatientName={setPatientName} extractedFrom={extractedFrom} onRecord={() => setStep("recording")} onUseManual={switchToManualInput} />}
        {step === "loading" && <LoadingScreen />}
        {step === "results" && <ResultsScreen result={result} patientName={patientName} onReset={resetAnalysis} />}
      </div>
    </div>
  );
}
