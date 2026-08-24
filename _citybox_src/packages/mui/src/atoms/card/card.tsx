"use client";

import MuiCard from "@mui/material/Card";
import type { CardProps as MuiCardProps } from "@mui/material/Card";
import MuiCardActionArea from "@mui/material/CardActionArea";
import type { CardActionAreaProps as MuiCardActionAreaProps } from "@mui/material/CardActionArea";
import MuiCardActions from "@mui/material/CardActions";
import type { CardActionsProps as MuiCardActionsProps } from "@mui/material/CardActions";
import MuiCardContent from "@mui/material/CardContent";
import type { CardContentProps as MuiCardContentProps } from "@mui/material/CardContent";
import MuiCardHeader from "@mui/material/CardHeader";
import type { CardHeaderProps as MuiCardHeaderProps } from "@mui/material/CardHeader";
import MuiCardMedia from "@mui/material/CardMedia";
import type { CardMediaProps as MuiCardMediaProps } from "@mui/material/CardMedia";

/**
 * Thin wrappers MUI Card.
 *
 * Composição (docs MUI):
 * - `Card` + `CardContent` + `CardActions` (card básico)
 * - `Card` + `CardActionArea` + `CardMedia` + `CardContent` (área clicável)
 * - `Card` + `CardHeader` + `CardContent` + `CardActions` (cabeçalho com avatar)
 *
 * Sem cores de produto — o app define `variant`/`sx`/`elevation`.
 */
export type CardProps = MuiCardProps;
export type CardHeaderProps = MuiCardHeaderProps;
export type CardContentProps = MuiCardContentProps;
export type CardActionsProps = MuiCardActionsProps;
export type CardMediaProps = MuiCardMediaProps;
export type CardActionAreaProps = MuiCardActionAreaProps;

export function Card(props: CardProps) {
  return <MuiCard {...props} />;
}

export function CardHeader(props: CardHeaderProps) {
  return <MuiCardHeader {...props} />;
}

export function CardContent(props: CardContentProps) {
  return <MuiCardContent {...props} />;
}

export function CardActions(props: CardActionsProps) {
  return <MuiCardActions {...props} />;
}

export function CardMedia(props: CardMediaProps) {
  return <MuiCardMedia {...props} />;
}

export function CardActionArea(props: CardActionAreaProps) {
  return <MuiCardActionArea {...props} />;
}
