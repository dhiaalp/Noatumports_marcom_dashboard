"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { DashboardFilterContext } from "./DashboardFilterContext";

type Props = {
  option: EChartsOption;
  className?: string;
  mapRegistration?: { name: string; geoJSON: unknown };
};

export default function EChart({ option, className = "chart-fill", mapRegistration }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { factor, filtered, selections } = useContext(DashboardFilterContext);
  const filteredOption = useMemo(() => {
    if (!filtered) return option;

    const sourceSeries = Array.isArray(option.series) ? option.series : option.series ? [option.series] : [];
    const selectedSeries = selections.filter(selection => sourceSeries.some(series => "name" in series && series.name === selection));
    const seriesBySelection = selectedSeries.length
      ? sourceSeries.filter(series => "name" in series && selectedSeries.includes(String(series.name)))
      : sourceSeries;

    const categoryAxis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;
    const categoryData = categoryAxis && "data" in categoryAxis && Array.isArray(categoryAxis.data) ? categoryAxis.data : [];
    const selectedCategory = selections.find(selection => categoryData.includes(selection));
    const categoryIndex = selectedCategory ? categoryData.indexOf(selectedCategory) : -1;

    const nextSeries = seriesBySelection.map(series => {
      if (!("data" in series) || !Array.isArray(series.data)) return series;
      const formatter = "label" in series && series.label && typeof series.label === "object" && "formatter" in series.label ? String(series.label.formatter ?? "") : "";
      const preserveRatio = formatter.includes("%") || formatter.includes("x") || ("type" in series && series.type === "pie");
      let data = categoryIndex >= 0 ? series.data.slice(categoryIndex, categoryIndex + 1) : series.data;
      data = data.map(item => {
        if (preserveRatio) return item;
        if (typeof item === "number") return Math.max(item === 0 ? 0 : 1, Number.isInteger(item) ? Math.round(item * factor) : Math.round(item * factor * 10) / 10);
        if (item && typeof item === "object" && "value" in item && typeof item.value === "number") {
          return { ...item, value: Math.max(item.value === 0 ? 0 : 1, Number.isInteger(item.value) ? Math.round(item.value * factor) : Math.round(item.value * factor * 10) / 10) };
        }
        return item;
      });
      return { ...series, data };
    });

    const nextYAxis = categoryIndex >= 0 && categoryAxis
      ? { ...categoryAxis, data: [selectedCategory] }
      : option.yAxis;

    return { ...option, yAxis: nextYAxis, series: nextSeries } as EChartsOption;
  }, [factor, filtered, option, selections]);

  useEffect(() => {
    if (!ref.current) return;
    if (mapRegistration && !echarts.getMap(mapRegistration.name)) echarts.registerMap(mapRegistration.name, mapRegistration.geoJSON as any);
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chart.setOption(filteredOption, true);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [filteredOption, mapRegistration]);

  return <div ref={ref} className={className} />;
}
