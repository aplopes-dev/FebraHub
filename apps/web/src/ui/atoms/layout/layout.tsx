"use client";

import MuiBox from "@mui/material/Box";
import type { BoxProps as MuiBoxProps } from "@mui/material/Box";
import MuiGrid from "@mui/material/Grid";
import type { GridProps as MuiGridProps } from "@mui/material/Grid";
import MuiStack from "@mui/material/Stack";
import type { StackProps as MuiStackProps } from "@mui/material/Stack";
import MuiPaper from "@mui/material/Paper";
import type { PaperProps as MuiPaperProps } from "@mui/material/Paper";

export type BoxProps = MuiBoxProps;
export type StackProps = MuiStackProps;
export type PaperProps = MuiPaperProps;
export type GridProps = MuiGridProps;

export const Box = MuiBox;
export const Stack = MuiStack;
export const Paper = MuiPaper;
export const Grid = MuiGrid;
