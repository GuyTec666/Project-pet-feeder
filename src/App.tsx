import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Layers,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  ExternalLink,
  Wrench,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Feeder3DViewport } from './components/Feeder3DViewport';
import {
  ENGINEERING_PARTS,
  ACADEMIC_REFERENCES,
  BOM_ITEMS,
  PADDLE_DESIGN_EXAMPLES,
  EngineeringPart,
} from './data/engineeringData';

interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot';
  time: string;
  text: string;
  meta?: string;
}

export default function App() {
  // 3D Viewport & Mechanism States (Default to 'paddle' — 6-Vane Rotary Star Paddle Wheel)
  const [xrayMode, setXrayMode] = useState<boolean>(true);
  const [explodedLevel, setExplodedLevel] = useState<number>(0);
  const [selectedPartId, setSelectedPartId] = useState<string>('motor-775-auger');
  const [mechanismType, setMechanismType] = useState<'paddle' | 'carousel' | 'auger'>('paddle');
  const [cameraPreset, setCameraPreset] = useState<
    'exterior' | 'internal' | 'motor775' | 'ychute' | 'loadcell' | 'rear'
  >('motor775');
  const [trayUnlocked, setTrayUnlocked] = useState<boolean>(false);

  // 775 DC Motor + Relay (GND/N) + Closed-Loop Feeding Simulation States
  const [motorVoltage, setMotorVoltage] = useState<number>(12); // 12V to 36V
  const [motorRunning, setMotorRunning] = useState<boolean>(false);
  const [relayClosed, setRelayClosed] = useState<boolean>(false); // Low-side GND/N switch
  const [targetWeightG, setTargetWeightG] = useState<number>(500);
  const [preCutoffOffsetG, setPreCutoffOffsetG] = useState<number>(35); // Closes at 465g (within 440-480g scope)
  const [leftBowlWeightG, setLeftBowlWeightG] = useState<number>(0);
  const [rightBowlWeightG, setRightBowlWeightG] = useState<number>(0);
  const [buzzerActive, setBuzzerActive] = useState<boolean>(false);
  const [simStatusText, setSimStatusText] = useState<string>(
    'พร้อมทำงาน · กดปุ่มเดินเครื่องเพื่อดูใบพัดกังหัน 6 แฉก หมุนตักอาหารจากถังเดี่ยวลงสู่รางแยก 2 ชาม'
  );

  // Telegram Bot Log States
  const [scheduleMorning, setScheduleMorning] = useState<string>('08:00');
  const [scheduleEvening, setScheduleEvening] = useState<string>('18:00');
  const [telegramLogs, setTelegramLogs] = useState<TelegramMessage[]>([
    {
      id: 'msg-1',
      sender: 'user',
      time: '07:55:10',
      text: '/set_schedule 08:00 18:00 500g',
      meta: 'getUpdates (Long Polling)',
    },
    {
      id: 'msg-2',
      sender: 'bot',
      time: '07:55:12',
      text: 'ตั้งค่าสำเร็จ: มื้อเช้า 08:00 น. และมื้อเย็น 18:00 น. เป้าหมายชามละ 500 กรัม (ใช้ใบพัดกังหันตักอาหาร 6 แฉก + สั่งตัด Relay ฝั่ง GND/N ของมอเตอร์ 775 ที่ 465 กรัม)',
      meta: 'sendMessage · HTTP 200 OK',
    },
    {
      id: 'msg-3',
      sender: 'bot',
      time: '08:00:19',
      text: 'จ่ายอาหารสำเร็จ (ใบพัดกังหัน 6 แฉก + รางแยก 2 ทาง)!\n• ชามซ้าย (LC#1): 499.5 g\n• ชามขวา (LC#2): 500.4 g\n• ตัดไฟ Relay ที่: 465.0 g (ใบพัดล็อคกันรั่วสนิท)',
      meta: 'sendMessage · FEEDING_LOG #106',
    },
  ]);

  const selectedPart: EngineeringPart =
    ENGINEERING_PARTS.find((p) => p.id === selectedPartId) || ENGINEERING_PARTS[0];

  const handleSelectPart = (partId: string) => {
    setSelectedPartId(partId);
    if (partId === 'motor-775-auger') {
      setXrayMode(true);
      setCameraPreset('motor775');
    } else if (partId === 'y-splitter-chute') {
      setXrayMode(true);
      setCameraPreset('ychute');
    } else if (partId === 'loadcell-hx711') {
      setXrayMode(true);
      setCameraPreset('loadcell');
    } else if (partId === 'bowl-lock') {
      setCameraPreset('exterior');
    } else if (partId === 'relay-buck-esp32') {
      setCameraPreset('rear');
    } else if (partId === 'single-hopper') {
      setCameraPreset('exterior');
    } else {
      setCameraPreset('internal');
    }
  };

  // Closed-Loop Feeding Simulation with Single 775 Motor + Rotary Paddle Wheel + Relay GND Cutoff
  const simIntervalRef = useRef<number | null>(null);

  const startClosedLoopFeeding = (sourceLabel: string) => {
    if (trayUnlocked) {
      setTrayUnlocked(false);
    }
    if (simIntervalRef.current) {
      window.clearInterval(simIntervalRef.current);
    }

    const cutoffPoint = Math.max(targetWeightG - preCutoffOffsetG, targetWeightG * 0.88);
    setLeftBowlWeightG(0);
    setRightBowlWeightG(0);
    setBuzzerActive(true);
    setSimStatusText(
      `1. ส่งเสียง Buzzer เรียกสุนัข (Conditioned Stimulus) ก่อนสั่งทริกเกอร์ Relay...`
    );

    const nowStr = new Date().toTimeString().slice(0, 8);
    setTelegramLogs((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        sender: 'user',
        time: nowStr,
        text: `/feed_now target=${targetWeightG}g/bowl (${sourceLabel})`,
        meta: 'getUpdates · ESP32 WiFiClientSecure',
      },
    ]);

    setTimeout(() => {
      setBuzzerActive(false);
      setRelayClosed(true);
      setMotorRunning(true);
      setSimStatusText(
        `2. ESP32 สั่ง Relay ต่อสาย Ground (N) -> มอเตอร์ 775 (${motorVoltage}V) หมุนใบพัดกังหัน 6 แฉกตักอาหารลงรางแยก Y-Splitter สู่ 2 ชาม...`
      );

      let currentL = 0;
      let currentR = 0;
      let relayCutDone = false;
      let inFlightRemainingL = preCutoffOffsetG + (Math.random() * 2.4 - 1.2);
      let inFlightRemainingR = preCutoffOffsetG + (Math.random() * 2.4 - 1.2);

      simIntervalRef.current = window.setInterval(() => {
        if (!relayCutDone) {
          const baseStep = 14.5 * (motorVoltage / 12);
          currentL += baseStep * (0.98 + Math.random() * 0.04);
          currentR += baseStep * (0.98 + Math.random() * 0.04);

          if ((currentL + currentR) / 2 >= cutoffPoint) {
            currentL = cutoffPoint - 0.5;
            currentR = cutoffPoint + 0.5;
            relayCutDone = true;
            setRelayClosed(false);
            setMotorRunning(false);
            setSimStatusText(
              `3. น้ำหนักเฉลี่ยแตะจุดตัดล่วงหน้า ${cutoffPoint.toFixed(0)} กรัม! Relay ตัดสาย Ground (N) หยุดมอเตอร์ 775 ทันที · ใบพัดกังหันล็อคกั้นอาหารไม่ให้รั่วไหลเพิ่ม`
            );
          }
        } else {
          if (inFlightRemainingL > 0) {
            const stepL = Math.min(inFlightRemainingL, 5.5);
            currentL += stepL;
            inFlightRemainingL -= stepL;
          }
          if (inFlightRemainingR > 0) {
            const stepR = Math.min(inFlightRemainingR, 5.5);
            currentR += stepR;
            inFlightRemainingR -= stepR;
          }
        }

        setLeftBowlWeightG(currentL);
        setRightBowlWeightG(currentR);

        if (relayCutDone && inFlightRemainingL <= 0.2 && inFlightRemainingR <= 0.2) {
          if (simIntervalRef.current) {
            window.clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
          }
          const avgFinal = (currentL + currentR) / 2;
          const errorPct = (((avgFinal - targetWeightG) / targetWeightG) * 100).toFixed(2);
          setSimStatusText(
            `4. เสร็จสิ้นลูปปิด: ตัดไฟที่ ${cutoffPoint.toFixed(0)}g -> น้ำหนักสุทธิ ชามซ้าย ${currentL.toFixed(1)}g | ชามขวา ${currentR.toFixed(1)}g (คลาดเคลื่อนเฉลี่ย ${errorPct}%)`
          );

          const doneTime = new Date().toTimeString().slice(0, 8);
          setTelegramLogs((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              time: doneTime,
              text: `รายงานการจ่ายอาหารสำเร็จ (ใบพัดกังหัน 6 แฉก + รางแยก Y)!\n• เป้าหมายต่อชาม: ${targetWeightG} กรัม\n• จุดตัด Relay (GND/N): ${cutoffPoint.toFixed(0)} กรัม\n• น้ำหนักจริงชามซ้าย (LC#1): ${currentL.toFixed(1)} กรัม\n• น้ำหนักจริงชามขวา (LC#2): ${currentR.toFixed(1)} กรัม`,
              meta: 'sendMessage · บันทึกสถิติเข้า Telegram',
            },
          ]);
        }
      }, 90);
    }, 850);
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        window.clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  const activeWeightG = Math.max(leftBowlWeightG, rightBowlWeightG);
  const loadRatio = activeWeightG / 10000;
  const strainMicro = loadRatio * 1000;
  const bridgeOutputMv = 5.0 * 2.0 * loadRatio;
  const hx711Counts = Math.round((bridgeOutputMv / 20) * 16777216);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* =====================================================================
          TOP BAR CONTRACT: Single row, 3 zones separated by gap-8
      ===================================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Smart Dog Farm Feeder 3D
        </a>

        {/* Zone 2: 4–5 Single-line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#workspace-3d"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            โมเดล 3D (ใบพัดกังหันตักอาหาร)
          </a>
          <a
            href="#paddle-examples"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            ตัวอย่างการทำใบพัดกังหัน (DIY)
          </a>
          <a
            href="#wiring-relay"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            วงจร Relay (GND/N) & Buck Converter
          </a>
          <a
            href="#references"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            งบประมาณ & เอกสารอ้างอิง
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => startClosedLoopFeeding('Manual Remote Feed')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            จำลองกังหันตักอาหาร 500g
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT CONTAINER (1440px max-w baseline)
      ===================================================================== */}
      <main id="top" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Project Header Banner */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
              <span>ดีไซน์แนะนำ · เปลี่ยนจากเกลียว Auger เป็น “ใบพัดกังหันตักอาหาร (Rotary Paddle Wheel)”</span>
              <span aria-hidden="true">·</span>
              <span>ตัวเครื่องเดี่ยว + รางแยก 2 ทาง (Y-Splitter)</span>
              <span aria-hidden="true">·</span>
              <span>ชามสแตนเลสคู่ 2 ใบ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              เครื่องให้อาหารฟาร์มสุนัขอัตโนมัติ (มอเตอร์ 775 + ใบพัดกังหันตักอาหาร 6 แฉก + รางแยก 2 ชาม)
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 tabular-nums shrink-0">
            <div>
              <div className="text-slate-400">กลไกตักจ่ายอาหาร (Zero-Jam)</div>
              <div className="font-semibold text-slate-900 mt-0.5">
                ใบพัดกังหันยางซิลิโคน 6 แฉก + มอเตอร์ 775
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="text-slate-400">ภาคจ่ายไฟและสวิตช์ตัดต่อ</div>
              <div className="font-semibold text-slate-900 mt-0.5">
                Buck Converter (5V) + Relay ตัดต่อสาย GND/N
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="text-slate-400">ระบบชั่งน้ำหนักลูปปิด (2 ชาม)</div>
              <div className="font-semibold text-emerald-700 mt-0.5">
                2× Load Cell 10KG (ตัดไฟที่ 440–480g)
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1: INTERACTIVE 3D MODEL & INTERNAL MECHANISM INSPECTOR
        =================================================================== */}
        <section id="workspace-3d" className="space-y-4">
          {/* Mode & Camera Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            {/* Camera View Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 px-2 whitespace-nowrap">
                มุมมอง 3D:
              </span>
              {(
                [
                  { id: 'motor775', label: 'ซูมใบพัดกังหัน 6 แฉก & มอเตอร์ 775' },
                  { id: 'internal', label: 'ผ่าดูระบบภายในทั้งหมด' },
                  { id: 'ychute', label: 'ซูมรางแยก 2 ทาง (Y-Splitter)' },
                  { id: 'loadcell', label: 'ซูม Load Cell ใต้ชามคู่' },
                  { id: 'rear', label: 'ซูมกล่อง ESP32 + Relay + Buck ด้านหลัง' },
                  { id: 'exterior', label: 'รอบตัวเครื่องเดี่ยว (ภายนอก)' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setCameraPreset(preset.id);
                    if (
                      preset.id === 'internal' ||
                      preset.id === 'motor775' ||
                      preset.id === 'ychute' ||
                      preset.id === 'loadcell'
                    ) {
                      setXrayMode(true);
                    } else if (preset.id === 'exterior') {
                      setXrayMode(false);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    cameraPreset === preset.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* 3D Mechanism Example Switcher + X-Ray + Exploded */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => {
                    setMechanismType('paddle');
                    setXrayMode(true);
                    setCameraPreset('motor775');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mechanismType === 'paddle'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ตัวอย่าง 1: กังหันแนวตั้ง 6 แฉก (แนะนำ)
                </button>
                <button
                  onClick={() => {
                    setMechanismType('carousel');
                    setXrayMode(true);
                    setCameraPreset('motor775');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mechanismType === 'carousel'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ตัวอย่าง 2: กังหันจานหมุนแนวราบ
                </button>
                <button
                  onClick={() => {
                    setMechanismType('auger');
                    setXrayMode(true);
                    setCameraPreset('motor775');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mechanismType === 'auger'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เทียบกับ: เกลียว Auger
                </button>
              </div>

              <button
                onClick={() => setXrayMode(!xrayMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  xrayMode
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{xrayMode ? 'X-Ray: เปิด' : 'X-Ray: ปิด'}</span>
              </button>

              <button
                onClick={() => setTrayUnlocked(!trayUnlocked)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  trayUnlocked
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {trayUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{trayUnlocked ? 'ถอดชามออกล้างแล้ว' : 'ปลดล็อคถาดคู่'}</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <label htmlFor="explode-slider" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  แยกชิ้นส่วน: {(explodedLevel * 100).toFixed(0)}%
                </label>
                <input
                  id="explode-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={explodedLevel}
                  onChange={(e) => setExplodedLevel(parseFloat(e.target.value))}
                  className="w-16 accent-sky-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Two-Zone Sandbox Layout: Left 8 Cols 3D Stage | Right 4 Cols Engineering Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 8 Cols: 3D WebGL Viewport + Live Simulator Panel */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="flex-1 min-h-[540px]">
                <Feeder3DViewport
                  xrayMode={xrayMode}
                  explodedLevel={explodedLevel}
                  selectedPartId={selectedPartId}
                  onSelectPart={handleSelectPart}
                  mechanismType={mechanismType}
                  motorRunning={motorRunning}
                  motorVoltage={motorVoltage}
                  relayClosed={relayClosed}
                  leftBowlWeightG={leftBowlWeightG}
                  rightBowlWeightG={rightBowlWeightG}
                  trayUnlocked={trayUnlocked}
                  cameraPreset={cameraPreset}
                  buzzerActive={buzzerActive}
                />
              </div>

              {/* Live 775 Motor + Paddle Wheel + Relay GND Control Panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      แผงจำลองการทำงาน: ใบพัดกังหันตักอาหาร + มอเตอร์ 775 + Relay ตัดต่อสาย Ground (N)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">{simStatusText}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => startClosedLoopFeeding('เดินเครื่องอัตโนมัติ ลูปปิด')}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>เดินเครื่องกังหันตักอาหาร (500g)</span>
                    </button>

                    <button
                      onClick={() => {
                        const nextState = !relayClosed;
                        setRelayClosed(nextState);
                        setMotorRunning(nextState);
                        setSimStatusText(
                          nextState
                            ? `สั่งทริกเกอร์ Relay ด้วยมือ: ต่อสาย Ground (N) -> มอเตอร์ 775 หมุนใบพัดกังหันตักอาหารที่ ${motorVoltage}V`
                            : `สั่งตัด Relay ด้วยมือ: เปิดวงจรสาย Ground (N) -> มอเตอร์ 775 หยุดหมุน (ใบพัดล็อคกันอาหารรั่ว)`
                        );
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        relayClosed
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        {relayClosed ? 'Relay GND/N: ต่อวงจร (ON)' : 'ทดสอบกดสวิตช์ Relay GND/N (OFF)'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        if (simIntervalRef.current) {
                          window.clearInterval(simIntervalRef.current);
                          simIntervalRef.current = null;
                        }
                        setRelayClosed(false);
                        setMotorRunning(false);
                        setLeftBowlWeightG(0);
                        setRightBowlWeightG(0);
                        setSimStatusText('รีเซ็ตน้ำหนักในชามทั้ง 2 ใบเป็น 0 กรัม');
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset 0g</span>
                    </button>
                  </div>
                </div>

                {/* Sliders for Set Point, Pre-cutoff, and 775 Motor Voltage */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs tabular-nums">
                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>ปริมาณเป้าหมายต่อชาม:</span>
                      <span className="font-mono font-semibold text-slate-900">{targetWeightG} กรัม</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={600}
                      step={50}
                      value={targetWeightG}
                      onChange={(e) => setTargetWeightG(parseInt(e.target.value, 10))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      กังหันตักลงรางแยก Y-Splitter สู่ 2 ชามพร้อมกัน
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>จุดสั่งตัด Relay ล่วงหน้า:</span>
                      <span className="font-mono font-semibold text-amber-700">
                        {targetWeightG - preCutoffOffsetG} กรัม (-{preCutoffOffsetG}g)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={60}
                      step={5}
                      value={preCutoffOffsetG}
                      onChange={(e) => setPreCutoffOffsetG(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ขอบเขตข้อ 2: ตัดไฟช่วง 440–480 กรัม เมื่อตั้ง 500g
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>แรงดันไฟเลี้ยงมอเตอร์ 775:</span>
                      <span className="font-mono font-semibold text-sky-700">{motorVoltage} VDC</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={36}
                      step={3}
                      value={motorVoltage}
                      onChange={(e) => setMotorVoltage(parseInt(e.target.value, 10))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      รองรับ 12V–36V (ใช้ 12V เพื่อให้กังหันตักอาหารนุ่มนวล)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Sub-assembly Selector & Detailed Engineering Spec Inspector */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Part Selector List */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 mb-2.5">
                  คลิกเลือกดูสเปกแต่ละส่วนในโมเดล 3D (6 ระบบหลัก):
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {ENGINEERING_PARTS.map((part, index) => {
                    const isSelected = part.id === selectedPartId;
                    return (
                      <button
                        key={part.id}
                        onClick={() => handleSelectPart(part.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-slate-50/70 border-slate-200/80 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">
                            0{index + 1}. {part.nameTh}
                          </div>
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {part.specSummary}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-mono tabular-nums shrink-0 ${
                            isSelected ? 'text-sky-300' : 'text-slate-500'
                          }`}
                        >
                          x{part.quantity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Part Engineering Details Card */}
              <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                    <span>รหัสชิ้นส่วน: {selectedPart.id}</span>
                    <span>
                      จำนวน {selectedPart.quantity} ชิ้น · {selectedPart.totalPriceThb} บาท
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedPart.nameTh}
                    </h3>
                    <p className="text-xs font-medium text-sky-700 mt-0.5">{selectedPart.nameEn}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    {selectedPart.roleInProject}
                  </p>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-900">
                      รายละเอียดการออกแบบและหลักวิศวกรรม:
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                      {selectedPart.engineeringDetails.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* References Box inside Inspector */}
                <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800">ความสอดคล้องกับไฟล์โครงงาน: </span>
                    <span className="text-slate-600">{selectedPart.pdfReference}</span>
                  </div>
                  <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200/70 text-slate-700 space-y-1">
                    <div className="font-semibold text-sky-900">
                      มาตรฐานวิศวกรรมที่นำมาอ้างอิงเสริม:
                    </div>
                    <div className="font-medium text-slate-800">
                      {selectedPart.externalStandardRef.title}
                    </div>
                    <div className="text-slate-600">{selectedPart.externalStandardRef.citation}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: HOW THE ROTARY AIRLOCK BLOCKS FOOD FROM POURING THROUGH
        =================================================================== */}
        <section id="paddle-examples" className="space-y-6 pt-4">
          {/* Interactive Cross-Section Explanation of the "Revolving Door Airlock" */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-semibold text-sky-400">
                  คำตอบข้อสงสัยสำคัญ · ทำไมเทอาหารใส่ถังแล้วอาหารถึงไม่ไหลทะลักลงมาเอง?
                </div>
                <h2 className="text-lg sm:text-xl font-bold mt-1">
                  หลักการ “ประตูหมุนกั้นอาหาร (Rotary Airlock Seal)” โดยไม่ต้องมีฝาวาล์วเปิด-ปิดแยก
                </h2>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                ไม่ต้องใช้มอเตอร์ตัวที่ 2 เปิด-ปิดฝาถัง
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 5 Cols: Interactive SVG Cross-Section Diagram of the 6-Vane Airlock */}
              <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  ภาพผ่าตัดขวาง (Cross-Section) ห้องใบพัดกังหัน 6 แฉกในท่อ PVC 4 นิ้ว
                </div>

                <svg viewBox="0 0 320 320" className="w-full max-w-[290px] h-auto">
                  {/* Top Hopper Funnel */}
                  <polygon
                    points="65,15 255,15 205,78 115,78"
                    fill="#D97706"
                    fillOpacity="0.28"
                    stroke="#94A3B8"
                    strokeWidth="2"
                  />
                  <text x="160" y="42" textAnchor="middle" fill="#FBBF24" fontSize="11" fontWeight="bold">
                    อาหารเม็ดในถังพักด้านบน
                  </text>
                  <text x="160" y="57" textAnchor="middle" fill="#CBD5E1" fontSize="9">
                    (กดลงมาที่ช่องบนสุดช่องเดียว)
                  </text>

                  {/* Half-Cover Anti-Flood Baffle Shield (Right side of inlet) */}
                  <path
                    d="M 160 76 L 212 76 L 212 86 L 160 86 Z"
                    fill="#F59E0B"
                  />
                  <text x="248" y="72" textAnchor="middle" fill="#FBBF24" fontSize="9" fontWeight="bold">
                    แผ่นหลังคากั้นครึ่งซีก
                  </text>
                  <line x1="205" y1="78" x2="225" y2="70" stroke="#F59E0B" strokeWidth="1.5" />

                  {/* Close-Fitting Cylindrical PVC Housing (Left & Right curved walls) */}
                  {/* Left wall arc from 115,78 down to 115,232 */}
                  <path
                    d="M 118 82 A 82 82 0 0 0 118 228"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Right wall arc from 202,82 down to 202,228 */}
                  <path
                    d="M 202 82 A 82 82 0 0 1 202 228"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* Top Pocket Kibble (Trapped & Blocked by Vanes!) */}
                  <path
                    d="M 122 86 L 160 155 L 195 86 Z"
                    fill="#D97706"
                    fillOpacity="0.85"
                  />
                  {/* Left Side Pocket Kibble (Being carried down) */}
                  <path
                    d="M 155 155 L 86 120 A 75 75 0 0 0 86 190 Z"
                    fill="#D97706"
                    fillOpacity="0.85"
                  />

                  {/* 6 Silicone Vanes touching the inner wall of PVC pipe */}
                  <g
                    transform={`translate(160, 155) ${
                      motorRunning && relayClosed ? 'rotate(-25)' : 'rotate(0)'
                    }`}
                  >
                    {[0, 60, 120, 180, 240, 300].map((deg) => (
                      <g key={deg} transform={`rotate(${deg})`}>
                        <line
                          x1="0"
                          y1="0"
                          x2="76"
                          y2="0"
                          stroke="#0EA5E9"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        {/* Silicone flexible tip touching PVC wall */}
                        <circle cx="76" cy="0" r="3.5" fill="#38BDF8" />
                      </g>
                    ))}
                    {/* Center 775 Motor Hub */}
                    <circle cx="0" cy="0" r="16" fill="#1E293B" stroke="#F8FAFC" strokeWidth="3" />
                    <circle cx="0" cy="0" r="5" fill="#F59E0B" />
                  </g>

                  {/* Seal Callout Badges on Left & Right Walls */}
                  <circle cx="92" cy="116" r="6" fill="#10B981" />
                  <text x="44" y="114" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="bold">
                    ปลายยางแนบท่อ
                  </text>
                  <text x="44" y="125" textAnchor="middle" fill="#94A3B8" fontSize="8">
                    (กั้นอาหารไม่ให้รั่ว)
                  </text>

                  <circle cx="228" cy="116" r="6" fill="#10B981" />
                  <text x="275" y="114" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="bold">
                    กั้นสนิท 2 ฝั่ง
                  </text>
                  <text x="275" y="125" textAnchor="middle" fill="#94A3B8" fontSize="8">
                    (เหมือนประตูหมุน)
                  </text>

                  {/* Bottom Drop Outlet onto Y-Splitter */}
                  <polygon points="160,242 135,285 185,285" fill="#38BDF8" />
                  <text x="160" y="302" textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="bold">
                    เทลงยอดรางแยก 2 ทาง (Y-Splitter)
                  </text>
                </svg>

                <div className="text-[11px] text-slate-400 text-center mt-1">
                  สังเกตว่าปลายใบพัดสีฟ้าทั้ง 6 แฉกจะแตะชิดผนังท่อโค้งซ้าย-ขวาเสมอ อาหารด้านบนจึงไหลผ่านลงมาตรงๆ ไม่ได้
                </div>
              </div>

              {/* Right 7 Cols: 3 Essential Rules to Prevent Food Flooding */}
              <div className="lg:col-span-7 space-y-3.5 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1">
                  <div className="font-bold text-sky-300 text-sm">
                    1. ห้ามวางใบพัดในที่โล่ง — ต้องมี “เสื้อท่อ PVC โค้งแนบชิดปลายใบพัด”
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    ใบพัด 6 แฉกต้องหมุนอยู่ข้างในท่อกลม (เช่น ท่อ PVC 4 นิ้ว Ø100 มม.) โดยให้{' '}
                    <strong className="text-white">
                      ปลายแผ่นยางซิลิโคนยาวแตะกวาดไปกับผนังด้านในของท่อพอดี
                    </strong>{' '}
                    เมื่อมี 6 แฉก (ห่างกันแฉกละ 60°) ไม่ว่ามอเตอร์จะหยุดที่มุมไหน{' '}
                    <strong className="text-emerald-300">
                      จะมีใบพัดอย่างน้อย 2 แฉกด้านซ้ายและขวายันติดผนังท่อเสมอ
                    </strong>{' '}
                    อาหารที่เทใส่ถังจึงตกลงมาค้างอยู่แค่ “ช่องสามเหลี่ยมด้านบนสุด” เท่านั้น ไหลทะลักลงรูด้านล่างไม่ได้เลย
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1">
                  <div className="font-bold text-amber-300 text-sm">
                    2. ติด “แผ่นหลังคากั้นครึ่งซีก (Half-Cover Shield)” ที่คอถังด้านบน
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    ตามรูปผ่าตัดขวางด้านซ้าย (แถบสีส้มทอง) ที่ปากทางเข้าห้องกังหันด้านบน ให้ปิดแผ่นพลาสติกบังไว้ครึ่งหนึ่ง (ฝั่งที่ใบพัดกำลังหมุนขึ้น) และเปิดช่องให้อาหารเข้าเฉพาะฝั่งที่ใบพัดกำลังหมุนลง วิธีนี้ช่วยรับน้ำหนักอาหารในถังไว้ครึ่งหนึ่ง และป้องกันเม็ดอาหารกระเด็นย้อนกลับ
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1">
                  <div className="font-bold text-emerald-300 text-sm">
                    3. มอเตอร์ 775 ต้องต่อ “หัวเกียร์ทดรอบ (Gearbox 20–40 RPM)” เพื่อล็อคแกนตอนตัดไฟ
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    หากใช้มอเตอร์ 775 ตัวเปล่าที่ไม่มีหัวเกียร์ ตอนตัดไฟแกนมอเตอร์อาจถูกน้ำหนักอาหารกดจนหมุนฟรีได้ และตอนจ่ายไฟจะหมุนเร็วเกินไป (3,000+ รอบ/นาที) ดังนั้น{' '}
                    <strong className="text-white">
                      แนะนำให้ใช้มอเตอร์ 775 รุ่นที่มีหัวเกียร์ทดรอบ (775 Geared Motor รอบต่ำ ~30 RPM)
                    </strong>{' '}
                    เมื่อ Relay ตัดสาย Ground (N) อัตราทดของชุดเฟืองเกียร์จะทำหน้าที่เป็น{' '}
                    <strong className="text-emerald-300">เบรกล็อคแกนใบพัดอัตโนมัติ (Self-Braking)</strong>{' '}
                    ต่อให้เทอาหารใส่เต็มถัง ใบพัดก็จะไม่ขยับและอาหารไม่รั่วลงมาแม้แต่เม็ดเดียว!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-2">
            <div>
              <div className="text-xs text-slate-500">
                เปรียบเทียบตัวอย่างกลไกใบพัดกังหันตักอาหาร · กดเลือกดูแต่ละแบบในโมเดล 3D ด้านบนได้ทันที
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                ตัวอย่างการออกแบบ “ใบพัดกังหันตักอาหาร (Rotary Paddle Wheel)” แทนเกลียวสว่าน
              </h2>
            </div>
            <span className="text-xs text-sky-700 font-medium">
              อ้างอิงมาตรฐาน Rotary Drop-Through Airlock Feeder (Mills, 2003)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PADDLE_DESIGN_EXAMPLES.map((ex) => {
              const isCurrent = mechanismType === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`bg-white p-6 rounded-xl border transition-colors flex flex-col justify-between space-y-5 ${
                    isCurrent ? 'border-sky-500 shadow-xs' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          ex.recommended ? 'text-emerald-700' : 'text-sky-700'
                        }`}
                      >
                        {ex.badge}
                      </span>
                      <button
                        onClick={() => {
                          setMechanismType(ex.id);
                          setXrayMode(true);
                          setCameraPreset('motor775');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isCurrent ? 'กำลังแสดงใน 3D' : 'กดดูในโมเดล 3D'}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{ex.titleTh}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{ex.titleEn}</p>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/70 space-y-1.5">
                      <div>
                        <span className="font-semibold text-slate-900">ต้นแบบการใช้งานจริง: </span>
                        {ex.commercialExample}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">หลักการทำงาน: </span>
                        {ex.howItWorks}
                      </div>
                    </div>

                    {/* Dimensions Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {ex.dimensionsSpec.map((d, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs"
                        >
                          <div className="text-slate-500 text-[10px]">{d.label}</div>
                          <div className="font-mono font-semibold text-slate-900 text-[11px] mt-0.5">
                            {d.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DIY Fabrication Steps */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-sky-600" />
                        <span>วิธีสร้างจริงด้วยตัวเอง (DIY):</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                        {ex.diyFabricationSteps.map((step, i) => (
                          <li key={i} className="bg-slate-50/80 px-3 py-2 rounded border border-slate-100">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ข้อดี</span>
                      </div>
                      <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                        {ex.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>ข้อควรระวัง</span>
                      </div>
                      <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                        {ex.cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            SECTION 3: WIRING DIAGRAM (12-36V -> BUCK CONVERTER -> ESP32 -> RELAY GND/N) & TELEGRAM
        =================================================================== */}
        <section id="wiring-relay" className="space-y-6 pt-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="text-xs text-slate-500">
              วิศวกรรมไฟฟ้าและระบบควบคุมลูปปิด · วงจรขับมอเตอร์ 775 ด้วย Relay (ตัดต่อฝั่ง Ground / N) + Buck Converter
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              แผนผังการต่อวงจรไฟฟ้า (Relay ตัดต่อ GND/N + Buck Converter) และระบบบันทึกสถิติ Telegram
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Electrical Wiring Schematic & Wheatstone Bridge Math */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  01. แผนผังการต่อสายไฟ มอเตอร์ 775 + Relay (ตัดต่อฝั่ง GND/N) + Buck Converter
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ใช้แหล่งจ่ายไฟชุดเดียว 12V–24V จ่ายให้มอเตอร์ 775 หมุนใบพัดกังหัน โดยใช้{' '}
                  <strong>Relay Module ทำหน้าที่เป็นสวิตช์ตัด-ต่อสายฝั่งลบ (Ground หรือ N)</strong> ของมอเตอร์
                  และต่อพ่วงเข้า <strong>Buck Converter (LM2596)</strong> เพื่อลดแรงดันลงเป็น 5.0V เลี้ยงบอร์ด
                  ESP32 และเซนเซอร์ทั้งหมด
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-3 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-sky-400 border-b border-slate-800 pb-2">
                  <span>ELECTRICAL SCHEMATIC (LOW-SIDE GND/N RELAY SWITCHING)</span>
                  <span>PSU: 12V–24V DC (3A–5A)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-amber-400">
                      1. วงจรกำลังมอเตอร์ 775 ขับใบพัดกังหัน
                    </div>
                    <div>
                      • <span className="text-red-400">PSU (+12V..24V)</span> ───► ขั้วบวก{' '}
                      <span className="text-white font-semibold">Motor 775 (+)</span>
                    </div>
                    <div>
                      • ขั้วลบ <span className="text-white font-semibold">Motor 775 (GND/N)</span> ───► ขา{' '}
                      <span className="text-sky-400 font-semibold">NO (Normally Open)</span> ของ Relay
                    </div>
                    <div>
                      • ขา <span className="text-sky-400 font-semibold">COM (Common)</span> ของ Relay ───►{' '}
                      <span className="text-slate-300">PSU Ground (GND / N หลัก)</span>
                    </div>
                    <div className="text-emerald-400 pt-1">
                      *แนะนำ: ต่อไดโอด 1N5408 (Flyback Diode) คร่อมขั้ว Motor 775 เพื่อกันไฟกระชากย้อนกลับตอน
                      Relay ตัดสาย N
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-sky-400">
                      2. วงจรไฟเลี้ยง Buck Converter & ESP32 (5V Logic)
                    </div>
                    <div>
                      • <span className="text-red-400">PSU (+12V..24V) & GND</span> ───► ขา{' '}
                      <span className="text-white font-semibold">IN+ / IN- ของ Buck Converter</span>
                    </div>
                    <div>
                      • ปรับหมุนเกือกม้า Buck Converter ให้ขา <span className="text-emerald-400">OUT+ = 5.0V</span>
                    </div>
                    <div>
                      • <span className="text-emerald-400">Buck OUT+ (5V)</span> ───► ขา{' '}
                      <span className="text-white">VIN (5V) ของ ESP32</span>, VCC ของ Relay, RTC, HX711
                    </div>
                    <div>
                      • <span className="text-slate-300">Buck OUT- (GND)</span> ───► เชื่อมร่วมกับ{' '}
                      <span className="text-white">GND ของ ESP32 และ Relay</span> (Common Ground)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] tabular-nums">
                  <div>
                    สถานะขา GPIO สั่งงาน Relay:{' '}
                    <span className={relayClosed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {relayClosed ? 'ACTIVE (ต่อสาย GND/N กังหันหมุน)' : 'IDLE (ตัดสาย GND/N กังหันล็อค)'}
                    </span>
                  </div>
                  <div>
                    แรงดันขาออก Buck Converter: <span className="text-emerald-400 font-bold">5.00 VDC</span>
                  </div>
                </div>
              </div>

              {/* Wheatstone Bridge & HX711 Live Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-800">
                    สมการสเตรนเกจใต้ชามคู่ (บทที่ 2 ข้อ 2.6.1)
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-900 bg-white px-3 py-1.5 rounded border border-slate-200">
                    ΔR / R = GF × ε (GF = 2.0)
                  </div>
                  <div className="text-[11px] text-slate-600 tabular-nums">
                    ความเครียดคาน Load Cell: {strainMicro.toFixed(1)} με (ที่น้ำหนัก {activeWeightG.toFixed(1)} g)
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-800">
                    วงจรบริดจ์วีทสโตน + HX711 24-Bit ADC
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-900 bg-white px-3 py-1.5 rounded border border-slate-200">
                    V_O = V_EX × [R3/(R3+R4) - R2/(R1+R2)]
                  </div>
                  <div className="text-[11px] text-slate-600 tabular-nums">
                    สัญญาณ: {bridgeOutputMv.toFixed(4)} mV ➔ {hx711Counts.toLocaleString()} Counts
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Telegram Bot API Interactive Simulator */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    02. ระบบสั่งการและบันทึกสถิติผ่าน Telegram Bot API
                  </h3>
                  <span className="text-xs font-mono text-slate-500">ESP32 HTTPS JSON</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ตั้งเวลาการให้อาหารแต่ละมื้อผ่าน Telegram และรับรายงานน้ำหนักอาหารที่จ่ายลงสู่ชามซ้าย (LC#1)
                  และชามขวา (LC#2) แบบเรียลไทม์
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    ตั้งเวลามื้อที่ 1 (RTC DS3231):
                  </label>
                  <input
                    type="time"
                    value={scheduleMorning}
                    onChange={(e) => setScheduleMorning(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    ตั้งเวลามื้อที่ 2 (RTC DS3231):
                  </label>
                  <input
                    type="time"
                    value={scheduleEvening}
                    onChange={(e) => setScheduleEvening(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-[220px] max-h-[260px] overflow-y-auto space-y-2.5 p-3 bg-slate-900 rounded-lg text-xs">
                {telegramLogs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-lg max-w-[92%] ${
                      msg.sender === 'user'
                        ? 'ml-auto bg-sky-700 text-white'
                        : 'mr-auto bg-slate-800 text-slate-100 border border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 font-mono mb-1 tabular-nums">
                      <span>{msg.sender === 'user' ? 'Owner (@FarmAdmin)' : 'DogFeederBot (ESP32)'}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                    {msg.meta && (
                      <div className="text-[10px] font-mono text-sky-300 mt-1">{msg.meta}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    const nowStr = new Date().toTimeString().slice(0, 8);
                    setTelegramLogs((prev) => [
                      ...prev,
                      {
                        id: `u-${Date.now()}`,
                        sender: 'user',
                        time: nowStr,
                        text: `/set_schedule ${scheduleMorning} ${scheduleEvening} ${targetWeightG}g`,
                        meta: 'getUpdates',
                      },
                      {
                        id: `b-${Date.now() + 1}`,
                        sender: 'bot',
                        time: nowStr,
                        text: `บันทึกตารางเวลาลง RTC DS3231 สำเร็จ: ${scheduleMorning} น. และ ${scheduleEvening} น. เป้าหมายชามละ ${targetWeightG}g (สั่งตัด Relay มอเตอร์ 775 ที่ ${targetWeightG - preCutoffOffsetG}g)`,
                        meta: 'sendMessage · FEEDING_SCHEDULE Updated',
                      },
                    ]);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  ส่งคำสั่ง /set_schedule
                </button>
                <button
                  onClick={() => startClosedLoopFeeding('Telegram /feed_now')}
                  className="px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  สั่งจ่ายทันที /feed_now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 4: UPDATED BILL OF MATERIALS & ACADEMIC REFERENCES
        =================================================================== */}
        <section id="references" className="space-y-8 pt-4 pb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  ตารางรายการวัสดุอุปกรณ์ (รุ่นใช้ใบพัดกังหันตักอาหาร 6 แฉก + มอเตอร์ 775 + รางแยก 2 ชาม)
                </h2>
                <p className="text-xs text-slate-500">
                  อ้างอิงจากตารางที่ 3.6 ในเอกสารโครงงาน และปรับรายการวัสดุให้ตรงกับชุดใบพัดกังหันและวงจร Relay + Buck Converter
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-700 tabular-nums">
                สร้างง่ายด้วยท่อ PVC 4" + ยางซิลิโคน · อาหารไม่ติด 100%
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-medium">ลำดับ</th>
                    <th className="py-2 px-3 font-medium">รายการอุปกรณ์</th>
                    <th className="py-2 px-3 font-medium text-right">จำนวน</th>
                    <th className="py-2 px-3 font-medium text-right">ราคาประมาณการ (บาท)</th>
                    <th className="py-2 pl-3 font-medium">หน้าที่ในระบบและการเชื่อมต่อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {BOM_ITEMS.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80">
                      <td className="py-2 pr-3 font-mono text-slate-400">{row.no}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{row.item}</td>
                      <td className="py-2 px-3 text-right font-mono">{row.qty}</td>
                      <td className="py-2 px-3 text-right font-mono">{row.price.toLocaleString()}</td>
                      <td className="py-2 pl-3 text-slate-600">{row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic & Engineering References */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-xs text-slate-500">
                แหล่งอ้างอิงทางวิศวกรรมและวิชาการ (แนบประกอบในรายงานบทที่ 2 และบทที่ 3 ได้ทันที)
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                เอกสารอ้างอิงจากไฟล์โครงงานและมาตรฐานวิศวกรรมที่นำมาเสริม
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACADEMIC_REFERENCES.map((ref, idx) => (
                <div
                  key={ref.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span
                        className={
                          ref.category === 'external_engineering'
                            ? 'font-semibold text-sky-700'
                            : 'text-slate-500'
                        }
                      >
                        {ref.category === 'external_engineering'
                          ? 'แหล่งอ้างอิงเสริมทางวิศวกรรม (ใบพัดกังหัน / รางแยก Y / วงจร Relay)'
                          : 'อ้างอิงจากเอกสารโครงงาน (บทที่ 2)'}
                      </span>
                      <span className="font-mono tabular-nums">{ref.year}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      0{idx + 1}. {ref.title}
                    </h3>

                    <div className="text-xs font-medium text-slate-700">
                      {ref.authors} — <span className="text-slate-500 font-normal">{ref.source}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">การนำไปใช้ออกแบบ: </span>
                    {ref.appliedInDesign}
                    {ref.url && (
                      <div className="mt-1.5">
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline font-mono text-[11px]"
                        >
                          <span>{ref.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            โครงงานอุปกรณ์ให้อาหารฟาร์มสุนัขอัตโนมัติโดยบันทึกสถิติใน Telegram (รุ่นใบพัดกังหันตักอาหาร 6
            แฉก + มอเตอร์ 775 + รางแยก 2 ชาม)
          </div>
          <div>อ้างอิงข้อมูลจากบทที่ 1–3 และมาตรฐานวิศวกรรม Rotary Drop-Through Feeder (Mills, 2003)</div>
        </div>
      </footer>
    </div>
  );
}
