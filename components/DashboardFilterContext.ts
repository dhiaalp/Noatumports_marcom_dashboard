"use client";

import { createContext } from "react";

export type DashboardFilterState = {
  factor: number;
  filtered: boolean;
  selections: string[];
};

export const DashboardFilterContext = createContext<DashboardFilterState>({
  factor: 1,
  filtered: false,
  selections: [],
});

