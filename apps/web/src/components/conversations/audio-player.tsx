"use client";

import { useRef, useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, IconButton, Slider, Typography } from "@mui/material";

type AudioPlayerProps = {
  url: string;
  /** Nota de voz ganha estilo distinto (ícone de mic + destaque). */
  isVoiceNote?: boolean;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || Number.isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Player de áudio custom para bolhas de mensagem: play/pause, barra de
 * progresso "scrubável" (Slider) e tempo decorrido/total.
 */
export default function AudioPlayer({ url, isVoiceNote = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const element = audioRef.current;
    if (!element) return;
    if (playing) {
      element.pause();
    } else {
      element.play().catch(() => {});
    }
  };

  const handleSeek = (_event: Event, value: number | number[]) => {
    const element = audioRef.current;
    if (!element || !duration) return;
    const next = Array.isArray(value) ? value[0] : value;
    element.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        width: { xs: 220, sm: 260 },
        maxWidth: "100%",
        py: 0.25,
      }}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        style={{ display: "none" }}
      />

      {isVoiceNote ? (
        <MicIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
      ) : null}

      <IconButton
        onClick={togglePlay}
        aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        {playing ? (
          <PauseRoundedIcon fontSize="small" />
        ) : (
          <PlayArrowRoundedIcon fontSize="small" />
        )}
      </IconButton>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Slider
          size="small"
          aria-label="Progresso do áudio"
          min={0}
          max={Math.max(duration, 0.01)}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={handleSeek}
          sx={{
            py: 1,
            "& .MuiSlider-thumb": { width: 10, height: 10 },
          }}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: -0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}
          >
            {formatTime(currentTime)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}
          >
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
