"use client";

import MuiSkeleton from "@mui/material/Skeleton";
import type { SkeletonProps as MuiSkeletonProps } from "@mui/material/Skeleton";

export type SkeletonProps = MuiSkeletonProps;

export function Skeleton(props: SkeletonProps) {
  return <MuiSkeleton {...props} />;
}
