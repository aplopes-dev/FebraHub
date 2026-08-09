"use client";

/* Camada de mídia do Hub Executivo: vídeo em loop com poster, sem som. */

import { useState } from "react";

export function ExecMedia({
  videoSrc,
  posterSrc,
  className,
}: {
  videoSrc?: string;
  posterSrc: string;
  className?: string;
}) {
  const [pronto, setPronto] = useState(false);

  return (
    <div className={className} aria-hidden>
      <img className="fh-exec-media-img" src={posterSrc} alt="" />
      {videoSrc && (
        <video
          className={`fh-exec-media-video${pronto ? " fh-exec-media-video-on" : ""}`}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setPronto(true)}
          onError={() => setPronto(false)}
        />
      )}
    </div>
  );
}
