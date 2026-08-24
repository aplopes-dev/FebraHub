'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';

type PatientCameraCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
};

export function PatientCameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: PatientCameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCameraError(true);
      return;
    }

    setIsStarting(true);
    setHasCameraError(false);
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setHasCameraError(true);
      stopStream();
    } finally {
      setIsStarting(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (open) {
      void startCamera();
      return;
    }
    stopStream();
    setHasCameraError(false);
  }, [open, startCamera, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasCameraError) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onOpenChange(false);
      },
      'image/jpeg',
      0.92,
    );
  }, [hasCameraError, onCapture, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tirar foto</DialogTitle>
        </DialogHeader>

        {hasCameraError ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Camera className="size-12 text-muted-foreground" aria-hidden />
            <p className="max-w-xs text-sm text-muted-foreground">
              Não foi possível acessar a câmera. Verifique as permissões.
            </p>
            <Button type="button" variant="outline" onClick={() => void startCamera()} disabled={isStarting}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              playsInline
              muted
              aria-label="Pré-visualização da câmera"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!hasCameraError ? (
            <Button type="button" onClick={handleCapture} disabled={isStarting}>
              Capturar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
