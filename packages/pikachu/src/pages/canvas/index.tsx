import { useRef, useMemo, useEffect } from "react";
import Shell from "../shell";

type PikaPalette = Readonly<{
  yellow: string;
  red: string;
  black: string;
  eye: string;
  tongue: string;
  white: string;
}>;

function CanvasPikachu() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = useMemo<PikaPalette>(
    () => ({
      yellow: "#f7d400",
      red: "#f51217",
      black: "#111",
      eye: "#2f2f2f",
      tongue: "#ff4b6b",
      white: "#fff",
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseWidth = 520;
    const baseHeight = 280;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.round(rect.width));
      const cssHeight = Math.max(1, Math.round(rect.height));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const scale = Math.min(cssWidth / baseWidth, cssHeight / baseHeight);
      const offsetX = (cssWidth - baseWidth * scale) / 2;
      const offsetY = (cssHeight - baseHeight * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      const fillStroke = (fill: string | null, stroke: string | null) => {
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 3;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.stroke();
        }
      };

      const drawBackground = () => {
        ctx.fillStyle = palette.yellow;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
      };

      const drawEye = (cx: number, cy: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        fillStroke(palette.eye, palette.black);

        ctx.beginPath();
        ctx.arc(cx - 6, cy - 10, 8, 0, Math.PI * 2);
        fillStroke(palette.white, null);
      };

      const drawCheek = (cx: number, cy: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        fillStroke(palette.red, palette.black);
      };

      const drawNose = (cx: number, cy: number) => {
        ctx.beginPath();
        ctx.moveTo(cx - 5.5, cy - 3.5);
        ctx.lineTo(cx + 5.5, cy - 3.5);
        ctx.lineTo(cx, cy + 3.5);
        ctx.closePath();
        fillStroke(palette.black, null);
      };

      const drawMouth = (cx: number, cy: number) => {
        ctx.strokeStyle = palette.black;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        const mouthTopY = cy - 8;
        ctx.beginPath();
        ctx.moveTo(cx - 50, mouthTopY - 12);
        ctx.quadraticCurveTo(cx - 30, mouthTopY + 12, cx, mouthTopY + 2);
        ctx.quadraticCurveTo(cx + 30, mouthTopY + 12, cx + 50, mouthTopY - 12);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - 50, mouthTopY - 12);
        ctx.quadraticCurveTo(cx - 30, mouthTopY + 12, cx, mouthTopY + 2);
        ctx.quadraticCurveTo(cx + 30, mouthTopY + 12, cx + 50, mouthTopY - 12);
        ctx.bezierCurveTo(
          cx + 35,
          cy + 125,
          cx - 35,
          cy + 125,
          cx - 50,
          mouthTopY - 12,
        );
        ctx.clip();

        ctx.fillStyle = "#a2041b";
        ctx.fillRect(cx - 60, cy - 20, 120, 160);

        ctx.beginPath();
        ctx.moveTo(cx - 40, cy + 45);
        ctx.quadraticCurveTo(cx, cy + 10, cx + 40, cy + 45);
        ctx.lineTo(cx + 40, cy + 140);
        ctx.lineTo(cx - 40, cy + 140);
        ctx.closePath();
        ctx.fillStyle = palette.tongue;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - 50, mouthTopY - 12);
        ctx.quadraticCurveTo(cx - 30, mouthTopY + 12, cx, mouthTopY + 2);
        ctx.quadraticCurveTo(cx + 30, mouthTopY + 12, cx + 50, mouthTopY - 12);
        ctx.bezierCurveTo(
          cx + 35,
          cy + 125,
          cx - 35,
          cy + 125,
          cx - 50,
          mouthTopY - 12,
        );
        ctx.stroke();

        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(cx - 50, mouthTopY - 12);
        ctx.quadraticCurveTo(cx - 30, mouthTopY + 12, cx, mouthTopY + 2);
        ctx.quadraticCurveTo(cx + 30, mouthTopY + 12, cx + 50, mouthTopY - 12);
        ctx.stroke();
      };

      drawBackground();
      drawEye(160, 100);
      drawEye(360, 100);
      drawCheek(110, 174);
      drawCheek(410, 174);
      drawNose(260, 102);
      drawMouth(260, 120);

      ctx.restore();
    };

    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    draw();

    return () => {
      ro.disconnect();
    };
  }, [palette]);

  return (
    <Shell title="/canvas" subtitle="Canvas Implementation">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mx-auto aspect-520/280 w-full max-w-130">
          <canvas
            ref={canvasRef}
            className="h-full w-full rounded-2xl bg-[#f7d400]"
          />
        </div>
      </div>
    </Shell>
  );
}

export default CanvasPikachu;
