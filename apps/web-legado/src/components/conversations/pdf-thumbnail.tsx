"use client";

import { useEffect, useRef, useState } from "react";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";

/** Largura do canvas do thumbnail em CSS px. */
const THUMB_WIDTH = 200;

/**
 * Configura o worker do pdfjs uma vez por page load. O worker é servido de
 * /public (copiado do pacote instalado) — nunca CDN.
 */
let workerReady = false;
async function ensurePdfjsWorker() {
  if (workerReady) return;
  workerReady = true;
  const { GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

type PdfThumbnailProps = {
  /** URL assinada (inline) do PDF. */
  url: string;
  title: string;
  onClick: () => void;
};

function PdfThumbnailInner({
  url,
  title,
  onClick,
}: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderState, setRenderState] = useState<"loading" | "done" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ensurePdfjsWorker();
        const pdfjsLib = await import("pdfjs-dist");

        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = THUMB_WIDTH / baseViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Fundo branco para páginas com transparência.
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvas, viewport }).promise;
        if (!cancelled) setRenderState("done");
      } catch {
        if (!cancelled) setRenderState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <ButtonBase
      onClick={onClick}
      aria-label={`Abrir ${title}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: THUMB_WIDTH,
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        textAlign: "left",
        "&:hover": { opacity: 0.92 },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", bgcolor: "#fff" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            display: renderState === "done" ? "block" : "none",
          }}
        />
        {renderState === "loading" ? (
          <Box
            sx={{
              height: 180,
              display: "grid",
              placeItems: "center",
              bgcolor: "background.default",
            }}
          >
            <CircularProgress size={20} />
          </Box>
        ) : null}
        {renderState === "error" ? (
          <Box
            sx={{
              height: 180,
              display: "grid",
              placeItems: "center",
              bgcolor: "background.default",
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 34, color: "text.disabled" }} />
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
          width: "100%",
        }}
      >
        <DescriptionOutlinedIcon
          sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          noWrap
          sx={{ fontWeight: 600, minWidth: 0 }}
        >
          {title}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

/**
 * Renderiza a primeira página de um PDF como thumbnail dentro da bolha.
 * Clicar abre o PDF completo no MediaViewerModal.
 */
export default function PdfThumbnail(props: PdfThumbnailProps) {
  return <PdfThumbnailInner key={props.url} {...props} />;
}
