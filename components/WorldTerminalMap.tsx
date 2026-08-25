"use client";

import { useContext, useMemo } from "react";
import type { EChartsOption } from "echarts";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";
import EChart from "./EChart";
import { DashboardFilterContext } from "./DashboardFilterContext";

const MAP_NAME = "noatum-network-world";
const worldGeoJSON = feature(worldTopology as any, (worldTopology as any).objects.countries) as any;
const crossesDateline = (ring: number[][]) => {
  const longitudes = ring.map(point => point[0]);
  return Math.max(...longitudes) - Math.min(...longitudes) > 300;
};
worldGeoJSON.features.forEach((mapFeature: any) => {
  if (mapFeature.geometry.type === "Polygon") mapFeature.geometry.coordinates = mapFeature.geometry.coordinates.filter((ring: number[][]) => !crossesDateline(ring));
  if (mapFeature.geometry.type === "MultiPolygon") mapFeature.geometry.coordinates = mapFeature.geometry.coordinates.map((polygon: number[][][]) => polygon.filter(ring => !crossesDateline(ring))).filter((polygon: number[][][]) => polygon.length);
});
const mapRegistration = { name: MAP_NAME, geoJSON: worldGeoJSON };

type TerminalPoint = {
  name: string;
  country: string;
  region: string;
  coordinates: [number, number];
};

const terminalPoints: TerminalPoint[] = [
  { name: "Castellón", country: "Spain", region: "Europe", coordinates: [-0.03, 39.98] },
  { name: "Málaga", country: "Spain", region: "Europe", coordinates: [-4.42, 36.72] },
  { name: "Sagunto", country: "Spain", region: "Europe", coordinates: [-0.27, 39.68] },
  { name: "Santander", country: "Spain", region: "Europe", coordinates: [-3.81, 43.46] },
  { name: "Tarragona", country: "Spain", region: "Europe", coordinates: [1.25, 41.12] },
  { name: "ATK", country: "UAE", region: "Middle East", coordinates: [54.62, 24.82] },
  { name: "Adabiya", country: "Egypt", region: "Africa", coordinates: [32.49, 29.87] },
  { name: "Safaga", country: "Egypt", region: "Africa", coordinates: [33.94, 26.75] },
  { name: "Luanda", country: "Angola", region: "Africa", coordinates: [13.23, -8.81] },
  { name: "Pointe-Noire", country: "Republic of the Congo", region: "Africa", coordinates: [11.86, -4.78] },
  { name: "Dar Es Salam", country: "Tanzania", region: "Africa", coordinates: [39.21, -6.82] },
  { name: "Karachi", country: "Pakistan", region: "South Asia", coordinates: [67.01, 24.86] },
];

export default function WorldTerminalMap() {
  const { selections } = useContext(DashboardFilterContext);
  const visiblePoints = useMemo(() => {
    const locationSelections = selections.filter(selection => terminalPoints.some(point => point.name === selection || point.country === selection || point.region === selection));
    return locationSelections.length
      ? terminalPoints.filter(point => locationSelections.every(selection => point.name === selection || point.country === selection || point.region === selection))
      : terminalPoints;
  }, [selections]);

  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 450,
    tooltip: {
      trigger: "item",
      backgroundColor: "#00204E",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 10 },
      formatter: (params: any) => `<b>${params.data.name}</b><br/>${params.data.country} · ${params.data.region}<br/><span style="color:#9BB2CE">Terminal analytics: not confirmed</span>`,
    },
    toolbox: { show: true, right: 8, top: 6, itemSize: 12, iconStyle: { borderColor: "#21578A" }, feature: { restore: { title: "Reset map" } } },
    geo: {
      map: MAP_NAME,
      roam: true,
      center: [24, 16],
      zoom: 1.2,
      scaleLimit: { min: 1, max: 8 },
      itemStyle: { areaColor: "#E4E9ED", borderColor: "#9BB2CE", borderWidth: .6 },
      emphasis: { itemStyle: { areaColor: "#D3DEE8" }, label: { show: false } },
      select: { disabled: true },
    },
    graphic: [{ type: "text", right: 10, bottom: 6, style: { text: "Drag to pan · scroll to zoom", fill: "#818A8F", font: "8px Arial" } }],
    series: [{
      name: "Terminal network",
      type: "effectScatter",
      coordinateSystem: "geo",
      symbolSize: 8,
      rippleEffect: { scale: 2.4, brushType: "stroke" },
      itemStyle: { color: "#21578A", borderColor: "#fff", borderWidth: 1 },
      emphasis: { scale: 1.5 },
      data: visiblePoints.map(point => ({ name: point.name, country: point.country, region: point.region, value: point.coordinates })),
    }],
  }), [visiblePoints]);

  return <EChart option={option} mapRegistration={mapRegistration} />;
}
