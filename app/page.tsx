"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TestId = "mouse" | "keyboard" | "controller" | "audio" | "report";
type TestResult = { score: number; status: "passed" | "warning"; detail: string };
const TESTS = [
  { id: "mouse", number: "01", name: "Mouse", short: "Buttons · wheel · movement" },
  { id: "keyboard", number: "02", name: "Keyboard", short: "Keys · repeat detection" },
  { id: "controller", number: "03", name: "Controller", short: "Buttons · sticks · drift" },
  { id: "audio", number: "04", name: "Audio", short: "Left · right · microphone" },
] as const;
const KEYBOARD_ROWS = [
  ["Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
  ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
  ["Ctrl", "Alt", "Space", "Alt", "Ctrl"],
];

function normalizeKey(key: string) {
  const map: Record<string, string> = { Escape: "Esc", " ": "Space", Control: "Ctrl", CapsLock: "Caps", Shift: "Shift", Alt: "Alt", Enter: "Enter", Tab: "Tab" };
  return map[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

function Ring({ value }: { value: number }) {
  return <div className="score-ring" style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}</strong><span>/100</span></div></div>;
}

export default function Home() {
  const [active, setActive] = useState<TestId>("mouse");
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [deviceName, setDeviceName] = useState("My setup");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("gearproof-results");
    let data: { results?: Record<string, TestResult>; deviceName?: string; savedAt?: string | null } = {};
    try { if (stored) data = JSON.parse(stored); } catch { /* ignore invalid local draft */ }
    const timer = window.setTimeout(() => {
      setResults(data.results ?? {});
      setDeviceName(data.deviceName ?? "My setup");
      setSavedAt(data.savedAt ?? null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveResult = useCallback((id: string, result: TestResult) => {
    setResults((current) => {
      const next = { ...current, [id]: result };
      const time = new Date().toISOString();
      localStorage.setItem("gearproof-results", JSON.stringify({ results: next, deviceName, savedAt: time }));
      setSavedAt(time); return next;
    });
  }, [deviceName]);

  const completed = Object.keys(results).length;
  const average = completed ? Math.round(Object.values(results).reduce((sum, item) => sum + item.score, 0) / completed) : 0;

  return <main>
    <header className="topbar">
      <button className="brand" onClick={() => setActive("mouse")} aria-label="GearProof home"><span className="brand-mark">G</span><span>GearProof</span></button>
      <nav aria-label="Main navigation"><span className="local-pill"><i /> Free · runs locally</span><a className="account-button" href="https://github.com/floriankawalec-ctrl/GearProof" target="_blank" rel="noreferrer">GitHub</a></nav>
    </header>

    <section className="hero">
      <div><p className="eyebrow">HARDWARE DIAGNOSTICS</p><h1>Test your gear.<br/><span>Prove the result.</span></h1><p className="hero-copy">One clean test for your mouse, keyboard, controller and audio. No install and no data uploads.</p></div>
      <div className="hero-score"><Ring value={average} /><div><strong>{completed} of 4</strong><span>tests completed</span></div></div>
    </section>

    <section className="workspace">
      <aside className="test-menu" aria-label="Choose a test">
        <div className="menu-heading"><span>TESTS</span><span>{completed}/4</span></div>
        {TESTS.map((test) => <button key={test.id} className={`test-nav ${active === test.id ? "active" : ""}`} onClick={() => setActive(test.id)}><span className="test-number">{results[test.id] ? "✓" : test.number}</span><span><strong>{test.name}</strong><small>{test.short}</small></span><b>›</b></button>)}
        <button className={`report-nav ${active === "report" ? "active" : ""}`} onClick={() => setActive("report")}><span>▣</span><strong>Test report</strong><b>›</b></button>
        <p className="privacy-note">Results stay in this browser.</p>
      </aside>
      <section className="test-panel">
        {active === "mouse" && <MouseTest result={results.mouse} onComplete={(r) => saveResult("mouse", r)} />}
        {active === "keyboard" && <KeyboardTest result={results.keyboard} onComplete={(r) => saveResult("keyboard", r)} />}
        {active === "controller" && <ControllerTest result={results.controller} onComplete={(r) => saveResult("controller", r)} />}
        {active === "audio" && <AudioTest result={results.audio} onComplete={(r) => saveResult("audio", r)} />}
        {active === "report" && <Report results={results} average={average} deviceName={deviceName} setDeviceName={setDeviceName} savedAt={savedAt} />}
      </section>
    </section>
    <footer><span>GearProof — free &amp; open source</span><span>Local tests · No account · No uploads</span></footer>
  </main>;
}

function PanelHeader({ step, title, copy }: { step: string; title: string; copy: string }) {
  return <div className="panel-header"><div><p className="eyebrow">TEST {step}</p><h2>{title}</h2><p>{copy}</p></div><span className="live-badge"><i /> READY</span></div>;
}

function MouseTest({ result, onComplete }: { result?: TestResult; onComplete: (r: TestResult) => void }) {
  const [counts, setCounts] = useState({ left: 0, right: 0, middle: 0, back: 0, forward: 0, up: 0, down: 0 });
  const [moves, setMoves] = useState<number[]>([]); const [lastButton, setLastButton] = useState("—");
  const addButton = (button: number) => {
    const keys = ["left", "middle", "right", "back", "forward"] as const; const key = keys[button]; if (!key) return;
    setCounts((c) => ({ ...c, [key]: c[key] + 1 })); setLastButton({ left: "Left", right: "Right", middle: "Middle", back: "Back", forward: "Forward" }[key]);
  };
  const intervals = moves.slice(1).map((t, i) => t - moves[i]);
  const hz = intervals.length ? Math.min(1000, Math.round(1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length))) : 0;
  const gaps = intervals.filter((v) => v > 40).length;
  const done = counts.left > 0 && counts.right > 0 && counts.middle > 0 && counts.up > 0 && counts.down > 0 && moves.length > 20;
  const labels = { left:"Left", right:"Right", middle:"Wheel", back:"Back", forward:"Forward", up:"Scroll ↑", down:"Scroll ↓" };
  return <>
    <PanelHeader step="01" title="Mouse" copy="Click every button, use the wheel and move the pointer inside the test area." />
    <div className="mouse-grid"><div className="mouse-zone" onMouseDown={(e) => { e.preventDefault(); addButton(e.button); }} onContextMenu={(e) => e.preventDefault()} onMouseMove={() => setMoves((m) => [...m.slice(-99), performance.now()])} onWheel={(e) => { e.preventDefault(); e.stopPropagation(); const k = e.deltaY < 0 ? "up" : "down"; setCounts((c) => ({ ...c, [k]: c[k] + 1 })); }}><div className="cursor-target"><span>+</span></div><strong>Test here</strong><small>Scrolling is locked only inside this area</small></div><div className="metrics"><Metric label="Last button" value={lastButton} /><Metric label="Move events" value={String(moves.length)} /><Metric label="Browser event rate*" value={hz ? `${hz} Hz` : "—"} /><Metric label="Gaps over 40 ms" value={String(gaps)} warn={gaps > 2} /></div></div>
    <div className="button-checks">{(Object.keys(counts) as Array<keyof typeof counts>).map((key) => <div key={key} className={counts[key] ? "checked" : ""}><span>{counts[key] ? "✓" : "○"}</span><small>{labels[key]}</small><b>{counts[key]}</b></div>)}</div>
    {gaps > 4 && <FixCard title="Movement gaps detected" steps={["Clean the sensor with dry compressed air.", "Try another USB port without a hub.", "Test on a plain, non-reflective mouse pad."]} />}
    <div className="panel-actions"><small>* Browser event rate, not raw USB polling. Normal page scrolling returns when the pointer leaves the test area.</small><button disabled={!done} onClick={() => onComplete({ score: Math.max(70, 100 - gaps * 3), status: gaps > 4 ? "warning" : "passed", detail: `${hz || 0} Hz in browser, ${gaps} longer movement gaps` })}>{result ? "Save again" : "Finish test"} <span>→</span></button></div>
  </>;
}

function KeyboardTest({ result, onComplete }: { result?: TestResult; onComplete: (r: TestResult) => void }) {
  const [seen, setSeen] = useState<Set<string>>(new Set()); const [pressed, setPressed] = useState<Set<string>>(new Set()); const [repeats, setRepeats] = useState(0); const areaRef = useRef<HTMLDivElement>(null);
  useEffect(() => areaRef.current?.focus(), []);
  const down = (e: React.KeyboardEvent) => { e.preventDefault(); const key = normalizeKey(e.key); if (e.repeat) setRepeats((r) => r + 1); setSeen((s) => new Set(s).add(key)); setPressed((s) => new Set(s).add(key)); };
  const up = (e: React.KeyboardEvent) => setPressed((s) => { const n = new Set(s); n.delete(normalizeKey(e.key)); return n; });
  return <>
    <PanelHeader step="02" title="Keyboard" copy="Click the test area, then press every key you want to check." />
    <div className="keyboard-area" ref={areaRef} tabIndex={0} onKeyDown={down} onKeyUp={up}><div className="keyboard-status"><strong>{seen.size}</strong><span>keys detected</span><small>{pressed.size ? `Now: ${[...pressed].join(" + ")}` : "Press any key"}</small></div><div className="keyboard">{KEYBOARD_ROWS.map((row, i) => <div className="key-row" key={i}>{row.map((key, j) => <span key={`${key}-${j}`} className={`${seen.has(key) ? "seen" : ""} ${pressed.has(key) ? "pressed" : ""} key-${key.toLowerCase()}`}>{key}</span>)}</div>)}</div></div>
    <div className="inline-stats"><Metric label="Unique keys" value={String(seen.size)} /><Metric label="System repeats" value={String(repeats)} /><Metric label="Status" value={seen.size >= 10 ? "Testing" : "Waiting"} /></div>
    {repeats > 20 && <FixCard title="Many repeat events detected" steps={["Tap the key instead of holding it down.", "Turn down Repeat rate in system keyboard settings.", "If one key repeats on a tap, clean that switch and retest."]} />}
    <div className="panel-actions"><small>Holding a key normally creates system repeat events.</small><button disabled={seen.size < 5} onClick={() => onComplete({ score: repeats > 20 ? 85 : 100, status: repeats > 20 ? "warning" : "passed", detail: `${seen.size} keys detected; ${repeats} hold-repeat events` })}>{result ? "Save again" : "Finish test"} <span>→</span></button></div>
  </>;
}

function ControllerTest({ result, onComplete }: { result?: TestResult; onComplete: (r: TestResult) => void }) {
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);
  useEffect(() => { let frame = 0; const poll = () => { setGamepad(navigator.getGamepads?.()[0] ?? null); frame = requestAnimationFrame(poll); }; poll(); return () => cancelAnimationFrame(frame); }, []);
  const axes = gamepad?.axes ?? [0,0,0,0];
  const restDrift = Math.max(...axes.map(Math.abs));
  return <>
    <PanelHeader step="03" title="Controller" copy="Connect a controller and press any button to let the browser detect it." />
    {!gamepad ? <div className="empty-device"><div className="gamepad-shape"><span>＋</span><b>● ●</b></div><h3>Waiting for a controller</h3><p>Connect it by cable or Bluetooth, then press any button.</p></div> : <><div className="device-found"><span>✓</span><div><strong>{gamepad.id}</strong><small>Connected · {gamepad.buttons.length} buttons · {gamepad.axes.length} axes</small></div></div><div className="controller-grid"><div className="sticks">{[0,2].map((offset, index) => <div key={offset}><div className="stick-base"><i style={{ transform: `translate(${(axes[offset] ?? 0) * 33}px, ${(axes[offset+1] ?? 0) * 33}px)` }} /></div><small>{index ? "Right" : "Left"} stick</small><b>{(axes[offset] ?? 0).toFixed(2)} / {(axes[offset+1] ?? 0).toFixed(2)}</b></div>)}</div><div className="pad-buttons">{gamepad.buttons.map((button, i) => <span key={i} className={button.pressed ? "pressed" : ""}>{i}</span>)}</div></div><div className="inline-stats"><Metric label="Current drift" value={restDrift.toFixed(2)} warn={restDrift >= .12} /><Metric label="Active buttons" value={String(gamepad.buttons.filter((b) => b.pressed).length)} /><Metric label="Timestamp" value={Math.round(gamepad.timestamp).toString()} /></div></>}
    {gamepad && restDrift >= .12 && <FixCard title="Stick drift detected" steps={["Release both sticks and test again on a flat surface.", "Reconnect the controller and recalibrate it in Windows.", "Increase the in-game deadzone slightly; clean around the stick if needed."]} />}
    <div className="panel-actions"><small>Release both sticks before saving. Below 0.10 is usually a good result.</small><button disabled={!gamepad} onClick={() => onComplete({ score: restDrift < .12 ? 100 : restDrift < .2 ? 80 : 60, status: restDrift < .2 ? "passed" : "warning", detail: `Axis offset after releasing sticks: ${restDrift.toFixed(2)}` })}>{result ? "Save again" : "Finish test"} <span>→</span></button></div>
  </>;
}

function AudioTest({ result, onComplete }: { result?: TestResult; onComplete: (r: TestResult) => void }) {
  const contextRef = useRef<AudioContext | null>(null); const [heard, setHeard] = useState({ left: false, right: false }); const [mic, setMic] = useState<"idle" | "active" | "denied">("idle"); const [level, setLevel] = useState(0);
  const play = (side: "left" | "right") => { const ctx = contextRef.current ?? new AudioContext(); contextRef.current = ctx; const osc = ctx.createOscillator(), gain = ctx.createGain(), pan = ctx.createStereoPanner(); osc.frequency.value = 440; gain.gain.setValueAtTime(.16, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .7); pan.pan.value = side === "left" ? -1 : 1; osc.connect(gain).connect(pan).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .72); setHeard((h) => ({ ...h, [side]: true })); };
  const startMic = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const ctx = contextRef.current ?? new AudioContext(); contextRef.current = ctx; const analyser = ctx.createAnalyser(); analyser.fftSize = 256; ctx.createMediaStreamSource(stream).connect(analyser); const data = new Uint8Array(analyser.frequencyBinCount); setMic("active"); const tick = () => { analyser.getByteFrequencyData(data); setLevel(Math.round(data.reduce((a,b)=>a+b,0)/data.length/255*100)); if (stream.active) requestAnimationFrame(tick); }; tick(); } catch { setMic("denied"); } };
  const done = heard.left && heard.right;
  return <>
    <PanelHeader step="04" title="Audio" copy="Play a sample through each channel and check the microphone input." />
    <div className="audio-grid"><button className={heard.left ? "heard" : ""} onClick={() => play("left")}><span>◖</span><strong>Left channel</strong><small>{heard.left ? "Played ✓" : "Play sound"}</small></button><button className={heard.right ? "heard" : ""} onClick={() => play("right")}><span>◗</span><strong>Right channel</strong><small>{heard.right ? "Played ✓" : "Play sound"}</small></button></div>
    <div className="mic-card"><div><p className="eyebrow">MICROPHONE</p><strong>{mic === "active" ? "Microphone active" : mic === "denied" ? "Access blocked" : "Check input level"}</strong><small>No audio recording leaves your device.</small></div><div className="level"><i style={{ width: `${level}%` }} /></div><button onClick={startMic}>{mic === "active" ? `${level}%` : "Start"}</button></div>
    {mic === "denied" && <FixCard title="Microphone access is blocked" steps={["Click the lock icon next to the address bar.", "Allow microphone access for GearProof.", "Check that the correct input is selected in system sound settings."]} />}
    <div className="panel-actions"><small>This confirms channels and input signal, not sound quality.</small><button disabled={!done} onClick={() => onComplete({ score: mic === "denied" ? 80 : 100, status: mic === "denied" ? "warning" : "passed", detail: `Left and right channels played${mic === "active" ? ", microphone detected" : ""}` })}>{result ? "Save again" : "Finish test"} <span>→</span></button></div>
  </>;
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) { return <div className={`metric ${warn ? "warn" : ""}`}><small>{label}</small><strong>{value}</strong></div>; }

function FixCard({ title, steps }: { title: string; steps: string[] }) {
  return <div className="fix-card"><span>!</span><div><p className="eyebrow">TRY THIS FIX</p><strong>{title}</strong><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></div></div>;
}

function Report({ results, average, deviceName, setDeviceName, savedAt }: { results: Record<string, TestResult>; average: number; deviceName: string; setDeviceName: (v: string) => void; savedAt: string | null }) {
  const copy = async () => { const lines = TESTS.map((t) => `${t.name}: ${results[t.id]?.score ?? "—"}/100`).join("\n"); await navigator.clipboard.writeText(`GearProof report — ${deviceName}\nScore: ${average}/100\n${lines}`); };
  return <div className="report-view"><div className="panel-header"><div><p className="eyebrow">TEST REPORT</p><h2>Summary</h2><p>A clean result you can keep or attach to a sales listing.</p></div><Ring value={average} /></div><label className="device-name"><span>Device or setup name</span><input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="e.g. Logitech G502 HERO" /></label><div className="report-list">{TESTS.map((test) => { const r = results[test.id]; return <div key={test.id}><span className={r ? "done" : "pending"}>{r ? "✓" : test.number}</span><div><strong>{test.name}</strong><small>{r?.detail ?? "Test not completed"}</small></div><b>{r ? `${r.score}/100` : "—"}</b></div>; })}</div><div className="report-meta"><span>Generated by GearProof</span><span>{savedAt ? new Date(savedAt).toLocaleString("en-GB") : "No saved results"}</span></div><div className="report-actions"><button className="secondary" onClick={copy}>Copy summary</button><button onClick={() => window.print()}>Save PDF <span>↗</span></button></div><p className="report-disclaimer">This report describes browser-based test results. It is not a certification or a warranty of technical condition.</p></div>;
}
