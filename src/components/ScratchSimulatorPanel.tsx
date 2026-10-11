import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, StepForward, Volume2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Sb3InspectionData } from "../types/grading";

interface ScratchSimulatorPanelProps {
  data: Sb3InspectionData;
}

export const ScratchSimulatorPanel: React.FC<ScratchSimulatorPanelProps> = ({ data }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(data.simulationTrajectory.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const steps = data.simulationTrajectory;
  const activeStep = steps[currentStepIdx] || steps[0];

  useEffect(() => {
    setCurrentStepIdx(data.simulationTrajectory.length - 1);
    setIsPlaying(false);
  }, [data]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 850);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const handlePlayReplay = () => {
    if (currentStepIdx >= steps.length - 1) {
      setCurrentStepIdx(0);
    }
    setIsPlaying(true);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  // Convert Scratch coordinates (x: -150..150, y: -150..150) to SVG viewBox (0..320, 0..240)
  // Center (0,0) in Scratch -> (110, 85) in SVG so the square (0..100, 0..-100) sits centered
  const toSvgX = (x: number) => 110 + x * 0.9;
  const toSvgY = (y: number) => 85 - y * 0.9;

  const pathPoints = steps
    .slice(0, currentStepIdx + 1)
    .map((s) => `${toSvgX(s.x)},${toSvgY(s.y)}`)
    .join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl p-5">
      {/* Left Zone: Interactive 2D Coordinate Stage (60% width -> 7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between bg-[#0F172A] text-white rounded-lg p-4 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div>
            <span className="text-xs font-mono text-sky-400">SANDBOX 2D STAGE · TỌA ĐỘ OXY</span>
            <h4 className="text-sm font-semibold text-white mt-0.5">
              Trình giả lập AI chạy thử dự án Scratch (.sb3)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
            {data.formsClosedSquare ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> ● QUỸ ĐẠO KHÉP KÍN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> ▲ LỆCH QUỸ ĐẠO HÌNH VUÔNG
              </span>
            )}
          </div>
        </div>

        {/* SVG Stage */}
        <div className="relative w-full aspect-[4/3] bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden">
          <svg viewBox="0 0 320 240" className="w-full h-full">
            {/* Coordinate grid */}
            <defs>
              <pattern id="scratchGrid" width="22.5" height="22.5" patternUnits="userSpaceOnUse">
                <path
                  d="M 22.5 0 L 0 0 0 22.5"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="320" height="240" fill="url(#scratchGrid)" />

            {/* X and Y axes passing through Scratch (0,0) -> (110, 85) */}
            <line x1="0" y1="85" x2="320" y2="85" stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
            <line x1="110" y1="0" x2="110" y2="240" stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
            <text x="114" y="14" fill="#64748B" fontSize="8" fontFamily="IBM Plex Mono">
              Y (+180)
            </text>
            <text x="270" y="80" fill="#64748B" fontSize="8" fontFamily="IBM Plex Mono">
              X (+240)
            </text>

            {/* Target Expected Square (100x100) dashed reference */}
            <rect
              x={toSvgX(0)}
              y={toSvgY(0)}
              width={90}
              height={90}
              fill="none"
              stroke="rgba(56, 189, 248, 0.3)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text x={toSvgX(8)} y={toSvgY(-50)} fill="rgba(56, 189, 248, 0.55)" fontSize="8" fontFamily="IBM Plex Mono">
              Hình mẫu 100×100
            </text>

            {/* Student Sprite Drawn Trajectory */}
            {currentStepIdx > 0 && (
              <polyline
                fill="none"
                stroke={data.formsClosedSquare ? "#10B981" : "#F59E0B"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pathPoints}
              />
            )}

            {/* Visited vertices */}
            {steps.slice(0, currentStepIdx + 1).map((st) => (
              <circle
                key={st.stepIndex}
                cx={toSvgX(st.x)}
                cy={toSvgY(st.y)}
                r="3.5"
                fill="#0F172A"
                stroke={data.formsClosedSquare ? "#34D399" : "#FBBF24"}
                strokeWidth="2"
              />
            ))}

            {/* Animated Scratch Cat Sprite Marker */}
            <g
              transform={`translate(${toSvgX(activeStep.x)}, ${toSvgY(activeStep.y)}) rotate(${
                activeStep.direction - 90
              })`}
            >
              <circle r="13" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
              {/* Cat ears */}
              <polygon points="-9,-8 -12,-17 -3,-11" fill="#F97316" />
              <polygon points="9,-8 12,-17 3,-11" fill="#F97316" />
              {/* Eyes & nose */}
              <circle cx="-4" cy="-2" r="2" fill="#FFFFFF" />
              <circle cx="4" cy="-2" r="2" fill="#FFFFFF" />
              <circle cx="-4" cy="-2" r="1" fill="#0F172A" />
              <circle cx="4" cy="-2" r="1" fill="#0F172A" />
              <polygon points="-2,2 2,2 0,5" fill="#FFFBEB" />
            </g>
          </svg>

          {/* Speech / Sound Bubble Overlay */}
          {(activeStep.sayText || activeStep.soundPlayed) && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 border border-slate-700 px-3 py-2 rounded-md text-xs">
              {activeStep.sayText && (
                <span className="text-slate-200 font-medium">💬 Nhân vật: “{activeStep.sayText}”</span>
              )}
              {activeStep.soundPlayed && (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                  <Volume2 className="w-3.5 h-3.5" /> 🔊 {activeStep.soundPlayed}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Telemetry Readout */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-400 block">Bước chạy</span>
            <span className="text-white font-semibold">
              {currentStepIdx + 1} / {steps.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Tọa độ X</span>
            <span className="text-sky-400 font-semibold">{activeStep.x}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Tọa độ Y</span>
            <span className="text-sky-400 font-semibold">{activeStep.y}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Hướng xoay</span>
            <span className="text-amber-400 font-semibold">{activeStep.direction}°</span>
          </div>
        </div>
      </div>

      {/* Right Zone: Playback Controls & AST (Abstract Syntax Tree) (40% width -> 5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono text-slate-500">AST PARSER · PROJECT.JSON</span>
              <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                Cây cú pháp Khối lệnh ({data.totalBlocks} blocks)
              </h4>
            </div>
            {/* Playback Controller Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={isPlaying ? () => setIsPlaying(false) : handlePlayReplay}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? "Tạm dừng" : "Chạy thử"}
              </button>
              <button
                type="button"
                onClick={handleStepForward}
                title="Chạy từng bước"
                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <StepForward className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Đặt lại về đầu"
                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step description banner */}
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-mono text-slate-500">Đang thực thi: </span>
            <span className="font-semibold text-slate-900">{activeStep.blockLabel}</span>
          </div>

          {/* AST Block List */}
          <div className="mt-3 space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {data.astBlocks.map((block) => {
              const borderColors: Record<string, string> = {
                event: "border-l-amber-500 bg-amber-50/50",
                control: "border-l-orange-500 bg-orange-50/50",
                motion: "border-l-sky-600 bg-sky-50/50",
                looks: "border-l-indigo-500 bg-indigo-50/50",
                sound: "border-l-rose-500 bg-rose-50/50",
              };

              return (
                <div
                  key={block.id}
                  style={{ marginLeft: `${block.depth * 14}px` }}
                  className={`p-2.5 rounded-r-md border border-slate-200 border-l-4 ${
                    borderColors[block.category] || "border-l-slate-500 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{block.label}</span>
                    <span className="text-[11px] font-mono text-slate-500">{block.opcode}</span>
                  </div>
                  {block.warning && (
                    <p className="text-[11px] text-red-700 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {block.warning}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary AST Verdict */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Cấu trúc vòng lặp <code className="font-mono text-slate-900">control_repeat</code>:{" "}
            <strong className={data.hasRepeatLoop ? "text-emerald-700" : "text-red-600"}>
              {data.hasRepeatLoop ? `Đạt (${data.repeatCountValue} lần)` : "Chưa dùng (Ghép thủ công)"}
            </strong>
          </span>
          <span>·</span>
          <span>
            Khối Âm thanh:{" "}
            <strong className={data.hasSoundBlock ? "text-emerald-700" : "text-red-600"}>
              {data.hasSoundBlock ? "Đã gắn" : "Thiếu"}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
