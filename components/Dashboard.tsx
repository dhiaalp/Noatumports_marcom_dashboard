"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import EChart from "./EChart";
import { DashboardFilterContext } from "./DashboardFilterContext";
import WorldTerminalMap from "./WorldTerminalMap";

type TabId = "Overview" | "Digital" | "Social" | "Paid Media" | "Events" | "PR" | "Branding" | "Markets & Terminals" | "Budget & ROI" | "Reporting";
type Kpi = { label: string; value: string; context: string; icon: string; status: "actual" | "plan" };
type Column = { label: string; sortable?: boolean };

const BLUE = "#21578A";
const TEAL = "#4CADA9";
const NAVY = "#00204E";
const PALE = "#D8DCDF";

function scaleDisplayValue(value: string, factor: number) {
  if (factor === 1 || /%|x|\/|UAE|Spain|Europe|Africa|Asia/i.test(value)) return value;
  const match = value.match(/^(AED\s*)?(\+)?([\d,.]+)([KM])?$/i);
  if (!match) return value;
  const amount = Number.parseFloat(match[3].replace(/,/g, "")) * factor;
  const decimals = amount < 10 && match[4] ? 2 : amount < 100 && match[4] ? 1 : 0;
  const formatted = match[4] ? amount.toFixed(decimals).replace(/\.0$/, "") : Math.round(amount).toLocaleString("en-US");
  return `${match[1] ?? ""}${match[2] ?? ""}${formatted}${match[4] ?? ""}`;
}

const tabs: { id: TabId; short: string }[] = [
  { id: "Overview", short: "Overview" },
  { id: "Digital", short: "Digital" },
  { id: "Social", short: "Social" },
  { id: "Paid Media", short: "Paid Media" },
  { id: "Events", short: "Events" },
  { id: "PR", short: "PR" },
  { id: "Branding", short: "Branding" },
  { id: "Markets & Terminals", short: "Markets & Terminals" },
  { id: "Budget & ROI", short: "Budget & ROI" },
  { id: "Reporting", short: "Reporting" },
];

const filters: Record<TabId, Record<string, string[]>> = {
  Overview: {
    Date: ["May 1 – Aug 20, 2026"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"],
    Terminal: ["All", "Castellón", "Málaga", "Sagunto", "Santander", "Tarragona", "ATK", "Safaga", "Luanda", "Karachi"],
    Service: ["All", "Container", "Ro-Ro", "General Cargo", "Dry Bulk", "Warehousing", "Cold Chain"],
    Channel: ["All", "Organic Search", "Direct", "Social", "Events", "Trade Media"],
  },
  Digital: {
    "Data Period": ["May 1 – Aug 20, 2026"], "Acquisition Channel": ["All", "Organic Search", "Direct", "Referral", "Organic Social", "AI Assistant"],
    "Landing Page": ["All", "Homepage", "Safaga terminal", "Luanda terminal"], Source: ["All", "google", "bing", "chatgpt.com", "linkedin.com"], Device: ["All", "Desktop", "Mobile", "Tablet"],
  },
  Social: {
    "Data Period": ["May 1 – Aug 20, 2026"], Platform: ["All Platforms", "LinkedIn", "Facebook", "Instagram"],
    Campaign: ["All", "Campaign 1", "Campaign 2"], "Post Type": ["All", "Video", "Carousel", "Photography", "Graphic", "Article / Link"], Terminal: ["All", "Safaga", "Luanda", "Karachi"],
  },
  "Paid Media": {
    "Data Period": ["May 1 – Aug 20, 2026"], Platform: ["All Platforms", "LinkedIn Ads", "Google Ads", "Display", "Trade Media"],
    Campaign: ["All", "Campaign 1", "Campaign 2", "Campaign 3", "Campaign 4"], Objective: ["All", "Objective 1", "Objective 2", "Objective 3"], Terminal: ["All", "Terminal 1", "Terminal 2", "Terminal 3"],
  },
  Events: {
    "Event Date": ["All dates · not confirmed"], Event: ["All", "Event 1", "Event 2", "Event 3", "Event 4", "Event 5"],
    Region: ["All", "Not confirmed"], Industry: ["All", "Not confirmed"], Status: ["All", "Not confirmed"],
  },
  PR: {
    Date: ["May 1 – Aug 20, 2026"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], "Media Type": ["All", "Trade Press", "National Press", "Online", "Broadcast"],
    Sentiment: ["All", "Positive", "Neutral", "Negative"], Terminal: ["All", "Castellón", "Málaga", "Sagunto", "Santander", "Tarragona", "ATK", "Safaga", "Luanda", "Karachi"],
  },
  Branding: {
    Date: ["May 1 – Aug 20, 2026"], "Asset Type": ["All", "Logo & Identity", "Templates", "Photography", "Video", "Presentation", "Signage", "Social Graphics"],
    Terminal: ["All", "Castellón", "Málaga", "Sagunto", "Santander", "Tarragona", "ATK", "Safaga", "Luanda", "Karachi"], Status: ["All", "Approved", "In Review", "Draft"], "Requested By": ["All", "Corporate", "Commercial", "Terminal Ops", "HR"],
  },
  "Markets & Terminals": {
    Date: ["May 1 – Aug 20, 2026"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Country: ["All", "Spain", "UAE", "Egypt", "Angola", "Pakistan", "Tanzania", "Republic of the Congo"],
    Terminal: ["All", "Castellón", "Málaga", "Sagunto", "Santander", "Tarragona", "ATK", "Safaga", "Luanda", "Karachi"], Service: ["All", "Container", "Ro-Ro", "General Cargo", "Dry Bulk", "Warehousing", "Cold Chain"],
  },
  "Budget & ROI": {
    Date: ["May 1 – Aug 20, 2026"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Objective: ["All", "Demand Generation", "Trade Events", "Content & Creative", "PR & Reputation", "Marketing Technology"],
    Campaign: ["All", "Campaign 1", "Campaign 2", "Campaign 3"], Channel: ["All", "Organic Search", "Paid Media", "Events", "Trade Media", "Social Media", "Email / CRM"],
  },
  Reporting: {
    Period: ["May 2026", "Q2 2026", "Year to date"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Terminal: ["All", "Safaga", "Luanda", "Karachi"], "Business Unit": ["All", "Ports"], KPI: ["All", "Digital", "Social", "Events", "Markets", "Budget"],
  },
};

const kpis: Record<TabId, Kpi[]> = {
  Overview: [
    { label: "Website Sessions", value: "12,946", context: "1.38 sessions per user", icon: "◎", status: "actual" },
    { label: "Organic Social Impressions", value: "453K", context: "106 posts published", icon: "in", status: "actual" },
    { label: "Paid Media Enquiries", value: "96", context: "AED 620K media spend", icon: "+", status: "actual" },
    { label: "Confirmed Meetings", value: "74", context: "Tracked via CRM", icon: "✓", status: "actual" },
    { label: "Budget Used", value: "71%", context: "AED 5.12M of AED 7.20M", icon: "%", status: "actual" },
  ],
  Digital: [
    { label: "Sessions", value: "12,946", context: "1.38 sessions per user", icon: "◎", status: "actual" },
    { label: "Users", value: "9,410", context: "72.7% of session volume", icon: "+", status: "actual" },
    { label: "Organic Sessions", value: "6,159", context: "47.6% channel share", icon: "⌕", status: "actual" },
    { label: "Conversions / Enquiries", value: "286", context: "Conversion export connected", icon: "✉", status: "actual" },
  ],
  Social: [
    { label: "Impressions", value: "453K", context: "4.3K per published post", icon: "◎", status: "actual" },
    { label: "Engagement Rate", value: "13.98%", context: "Reported platform rate", icon: "%", status: "actual" },
    { label: "Posts Published", value: "106", context: "0.95 posts per day", icon: "▣", status: "actual" },
    { label: "Follower Growth", value: "+420", context: "Audience 12K", icon: "↗", status: "actual" },
  ],
  "Paid Media": [
    { label: "Ad Spend", value: "AED 620K", context: "Media spend to date", icon: "AED", status: "actual" },
    { label: "Paid Impressions", value: "3.8M", context: "Delivered impressions", icon: "◎", status: "actual" },
    { label: "Link CTR", value: "1.84%", context: "Click-through rate", icon: "%", status: "actual" },
    { label: "Conversions / Enquiries", value: "96", context: "Attributed enquiries", icon: "+", status: "actual" },
  ],
  Events: [
    { label: "Events", value: "5", context: "Reporting period", icon: "▣", status: "actual" },
    { label: "Target Accounts", value: "286", context: "Accounts targeted", icon: "◎", status: "actual" },
    { label: "Confirmed Meetings", value: "74", context: "25.9% of target accounts", icon: "✓", status: "actual" },
    { label: "Influenced Pipeline", value: "AED 9.6M", context: "CRM-attributed pipeline", icon: "AED", status: "actual" },
  ],
  PR: [
    { label: "Press Releases Published", value: "9", context: "Published this period", icon: "▣", status: "actual" },
    { label: "Media Mentions", value: "142", context: "Tracked mentions", icon: "◎", status: "actual" },
    { label: "Estimated Reach (AVE)", value: "AED 1.8M", context: "Advertising value equivalent", icon: "AED", status: "actual" },
    { label: "Positive / Neutral Coverage", value: "90%", context: "Sentiment analysis", icon: "✓", status: "actual" },
  ],
  Branding: [
    { label: "Assets Created", value: "238", context: "Tracked via DAM", icon: "▣", status: "actual" },
    { label: "Assets This Month", value: "34", context: "Produced this month", icon: "+", status: "actual" },
    { label: "Approved Assets", value: "196", context: "82.4% of total", icon: "✓", status: "actual" },
    { label: "Avg. Turnaround", value: "3.2", context: "Days · avg. production time", icon: "◎", status: "actual" },
  ],
  "Markets & Terminals": [
    { label: "Terminal & Service Page Visits", value: "42.8K", context: "Website traffic", icon: "◎", status: "actual" },
    { label: "Website Enquiries", value: "286", context: "Attribution not supplied", icon: "✉", status: "actual" },
    { label: "Enquiry Rate", value: "0.67%", context: "Comparable market values", icon: "%", status: "actual" },
    { label: "Fastest-Growing Market", value: "UAE", context: "+24.8% growth", icon: "↗", status: "actual" },
  ],
  "Budget & ROI": [
    { label: "Actual Spend", value: "AED 5.12M", context: "71% of AED 7.20M plan", icon: "AED", status: "actual" },
    { label: "Budget Used", value: "71%", context: "AED 736K committed", icon: "%", status: "actual" },
    { label: "Influenced Pipeline", value: "AED 34.4M", context: "CRM-attributed pipeline", icon: "↗", status: "actual" },
    { label: "Pipeline / Spend", value: "6.7x", context: "Not ROMI", icon: "x", status: "actual" },
  ],
  Reporting: [
    { label: "KPIs On Target", value: "8 / 10", context: "Monthly executive scorecard", icon: "✓", status: "actual" },
    { label: "Influenced Pipeline", value: "AED 34.4M", context: "Marketing-associated value", icon: "AED", status: "actual" },
    { label: "Qualified Opportunities", value: "54", context: "Sales-accepted opportunities", icon: "+", status: "actual" },
    { label: "Marketing Health", value: "88 / 100", context: "Cross-channel score", icon: "★", status: "actual" },
  ],
};

const baseText = { fontFamily: "Segoe UI, Arial", color: NAVY };
const tooltip = { trigger: "axis" as const, backgroundColor: NAVY, borderWidth: 0, textStyle: { ...baseText, color: "#fff", fontSize: 10 } };

function lineOption(series: { name: string; data: number[]; color: string }[], labels = ["May", "Jun", "Jul", "Aug"]): EChartsOption {
  return {
    animationDuration: 500, color: series.map(s => s.color), tooltip,
    legend: { top: 2, left: 8, textStyle: { ...baseText, fontSize: 9 }, itemWidth: 12, itemHeight: 3 },
    grid: { left: 42, right: 16, top: 30, bottom: 25 },
    xAxis: { type: "category", data: labels, boundaryGap: false, axisLine: { lineStyle: { color: "#cbd5e1" } }, axisLabel: { ...baseText, fontSize: 8 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#edf1f5" } }, axisLabel: { ...baseText, fontSize: 8 } },
    series: series.map(s => ({ name: s.name, type: "line", smooth: true, symbol: "circle", symbolSize: 4, lineStyle: { width: 2 }, areaStyle: { opacity: .04 }, data: s.data })),
  };
}

function barOption(labels: string[], values: number[], suffix: string, highlight = -1, barWidth = 10): EChartsOption {
  return {
    animationDuration: 450, tooltip: { ...tooltip, valueFormatter: (v) => `${v}${suffix}` },
    grid: { left: 116, right: 54, top: 6, bottom: 8 },
    xAxis: { type: "value", show: false },
    yAxis: { type: "category", inverse: true, data: labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...baseText, fontSize: barWidth < 10 ? 8 : 9, width: 108, overflow: "truncate", interval: barWidth < 10 ? 0 : "auto" } },
    series: [{ type: "bar", data: values.map((v, i) => ({ value: v, itemStyle: { color: i === highlight ? TEAL : BLUE, borderRadius: 5 } })), barWidth, showBackground: true, backgroundStyle: { color: PALE, borderRadius: 5 }, label: { show: true, position: "right", formatter: `{c}${suffix}`, ...baseText, fontSize: 9, fontWeight: 700 } }],
  };
}

function Panel({ title, children, className = "", badge }: { title: string; children: React.ReactNode; className?: string; badge?: string }) {
  return <section className={`panel flex min-h-0 flex-col ${className}`}><div className="panel-title"><span className="mr-auto truncate">{title}</span>{badge && <span className="data-badge plan">{badge}</span>}<span className="ml-2 text-slate-400">•••</span></div><div className="min-h-0 flex-1">{children}</div></section>;
}

function ScaledValue({ children }: { children: string }) {
  const { factor } = useContext(DashboardFilterContext);
  return <>{scaleDisplayValue(children, factor)}</>;
}

function KpiRow({ items }: { items: Kpi[] }) {
  const { factor, filtered } = useContext(DashboardFilterContext);
  return <section className={`grid min-h-0 gap-2 ${items.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>{items.map(item => <article key={item.label} className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-[4px] border border-[#c7cdd1] border-b-[5px] border-b-noatum-navy bg-white px-3 text-center shadow-card"><div className="max-w-[78%] truncate text-[10px] font-bold text-noatum-deep">{item.label}</div><div className="truncate text-[21px] font-extrabold tracking-tight text-noatum-deep">{scaleDisplayValue(item.value, factor)}</div><div className={`max-w-[88%] truncate text-[8px] font-semibold ${item.status === "actual" ? "text-[#52751b]" : "text-[#a44e0c]"}`}>{filtered ? "Filtered selection" : item.context}</div><span className={`absolute right-2 top-2 data-badge ${item.status}`}>Actual</span></article>)}</section>;
}

function MetricTiles({ rows }: { rows: [string, string, string, "actual" | "plan"][] }) {
  const { factor, filtered } = useContext(DashboardFilterContext);
  return <div className="grid h-full grid-cols-2 gap-1.5 p-1.5">{rows.map(r => <div key={r[0]} className="metric-tile grid min-h-0 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-2 rounded-[4px] border border-slate-200 border-l-[3px] border-l-noatum-blue bg-slate-50 px-3 py-1"><span className="truncate text-[8px] font-medium text-slate-500">{r[0]}</span><b className="whitespace-nowrap text-[15px] leading-none">{scaleDisplayValue(r[1], factor)}</b><small className={`metric-tile-context col-span-2 mt-0.5 truncate text-[7px] leading-none ${r[3] === "actual" ? "text-emerald-700" : "text-amber-700"}`}>{filtered ? "Filtered selection" : r[2]}</small></div>)}</div>;
}

function parseNumber(value: string) {
  const clean = value.replace(/AED|,|%|x|\+/g, "").trim();
  const n = Number.parseFloat(clean);
  if (!Number.isFinite(n)) return -1;
  return value.includes("M") ? n * 1_000_000 : value.includes("K") ? n * 1_000 : n;
}

function DataTable({ columns, rows, note }: { columns: Column[]; rows: string[][]; note?: string }) {
  const [sort, setSort] = useState<{ index: number; asc: boolean } | null>(null);
  const { factor, filtered, selections } = useContext(DashboardFilterContext);
  const visibleRows = useMemo(() => {
    const matchingSelections = selections.filter(selection => rows.some(row => row.some(cell => cell.toLowerCase().includes(selection.toLowerCase()))));
    const selectedRows = matchingSelections.length
      ? rows.filter(row => matchingSelections.every(selection => row.some(cell => cell.toLowerCase().includes(selection.toLowerCase()))))
      : rows;
    return filtered ? selectedRows.map(row => row.map(cell => scaleDisplayValue(cell, factor))) : selectedRows;
  }, [factor, filtered, rows, selections]);
  const sorted = useMemo(() => {
    if (!sort) return visibleRows;
    return [...visibleRows].sort((a, b) => (parseNumber(a[sort.index]) - parseNumber(b[sort.index])) * (sort.asc ? 1 : -1));
  }, [sort, visibleRows]);
  return <div className="flex h-full min-h-0 flex-col"><div className="min-h-0 flex-1 overflow-auto"><table className="compact-table"><thead><tr>{columns.map((c, i) => <th key={c.label}>{c.sortable ? <button className="font-bold hover:text-noatum-blue" onClick={() => setSort({ index: i, asc: sort?.index === i ? !sort.asc : false })}>{c.label} ↕</button> : c.label}</th>)}</tr></thead><tbody>{sorted.map((row, i) => <tr key={`${row[0]}-${i}`}>{row.map((cell, j) => <td key={j} className={j === 0 ? "font-semibold" : ""}>{cell}</td>)}</tr>)}</tbody></table></div>{note && <div className="shrink-0 border-t bg-slate-50 px-2 py-1 text-[7px] text-slate-500">{filtered ? `Filtered proportional view · ${note}` : note}</div>}</div>;
}

function OverviewView() {
  const summary = [
    ["Digital", "Website Sessions", "12,946", "Actual", "Organic Search contributes 47.6% of sessions"],
    ["Social", "Post Impressions", "453K", "Actual", "106 posts published in the supplied period"],
    ["Paid Media", "Attributed Enquiries", "96", "Actual", "AED 620K spend; attribution live via ad-platform APIs"],
    ["Events", "Confirmed Meetings", "74", "Actual", "Tracked via CRM through the reporting period"],
    ["Markets & Terminals", "Relevant Page Visits", "42.8K", "Actual", "Digital interest across terminal and service pages"],
    ["Budget & ROI", "Budget Used", "71%", "Actual", "AED 5.12M spent; AED 736K committed"],
  ];
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[0.8fr_0.8fr_1.6fr] gap-2">
    <Panel title="Digital Performance" className="col-span-4"><MetricTiles rows={[["Sessions","12,946","GA4 actual","actual"],["Users","9,410","GA4 actual","actual"],["Organic Sessions","6,159","47.6% channel share","actual"],["Conversions / Enquiries","286","Conversion export missing","plan"]]} /></Panel>
    <Panel title="Organic Social Performance" className="col-span-4"><MetricTiles rows={[["Impressions","453K","Reported aggregate","actual"],["Engagement Rate","13.98%","Reported rate","actual"],["Posts Published","106","Reported aggregate","actual"],["Followers","12K","Current audience","actual"]]} /></Panel>
    <Panel title="Paid Media Performance" className="col-span-4"><MetricTiles rows={[["Ad Spend","AED 620K","Media spend to date","actual"],["Paid Impressions","3.8M","Delivered impressions","actual"],["Link CTR","1.84%","Click-through rate","actual"],["Attributed Enquiries","96","Attributed enquiries","actual"]]} /></Panel>
    <Panel title="Event Conversion" className="col-span-4"><EChart option={{ tooltip, grid:{left:18,right:18,top:16,bottom:18}, xAxis:{type:"category",data:["Accounts","Meetings","Follow-ups","Opportunities"],axisLabel:{...baseText,fontSize:8}}, yAxis:{type:"value",show:false}, series:[{type:"bar",data:[286,74,38,18],barWidth:22,itemStyle:{color:BLUE,borderRadius:[4,4,0,0]},label:{show:true,position:"top",fontSize:9,fontWeight:700}}] }} /></Panel>
    <Panel title="Markets & Terminals · Digital Interest" className="col-span-4"><EChart option={barOption(["Spain","UAE","Egypt"],[22.4,6.8,5.7],"K",1)} /></Panel>
    <Panel title="Budget & Commercial Influence" className="col-span-4"><div className="flex h-full flex-col justify-center p-2"><div className="mb-1 flex h-3 overflow-hidden rounded-full text-[6px] font-bold text-white"><span className="grid w-[71%] place-items-center bg-noatum-blue">Spent 71%</span><span className="grid w-[10%] place-items-center bg-noatum-teal">10%</span><span className="grid w-[19%] place-items-center bg-slate-400">19%</span></div><div className="grid grid-cols-2 gap-2"><div className="rounded border-l-[3px] border-noatum-blue bg-slate-50 px-2 py-1 text-[7px] text-slate-500">Actual Spend<b className="block text-[13px] text-noatum-deep"><ScaledValue>AED 5.12M</ScaledValue></b></div><div className="rounded border-l-[3px] border-noatum-teal bg-slate-50 px-2 py-1 text-[7px] text-slate-500">Influenced Pipeline<b className="block text-[13px] text-noatum-deep"><ScaledValue>AED 34.4M</ScaledValue></b></div></div><p className="mt-1 text-[6px] text-amber-700">Pipeline / Spend 6.7x · not ROMI</p></div></Panel>
    <Panel title="Management Performance Summary" className="col-span-12"><DataTable columns={[{label:"Area"},{label:"Primary KPI"},{label:"Current"},{label:"Data Status"},{label:"Management Reading"}]} rows={summary} /></Panel>
  </div>;
}

function DigitalView() {
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.05fr] gap-2">
    <Panel title="Active Users Over Time" className="col-span-7 row-span-2"><EChart option={lineOption([{name:"Active users",data:[810,813,686,529,656,784,893,729,833,818,2158,1206],color:BLUE}], ["May 1","","Jun 1","","Jul 1","","","Aug 1","","","Aug 6","Aug 20"])} /></Panel>
    <Panel title="New User Acquisition Mix" className="col-span-5"><EChart option={barOption(["Direct","Organic Search","Organic Social","AI Assistant","Other"],[5108,3929,166,108,99],"")} /></Panel>
    <Panel title="Sessions by Channel" className="col-span-5"><EChart option={barOption(["Organic Search","Direct","Referral","Organic Social","AI Assistant"],[6159,5982,384,177,147],"")} /></Panel>
    <Panel title="Top Organic Search Pages" className="col-span-12"><DataTable columns={[{label:"Page"},{label:"Search Impressions",sortable:true},{label:"Share of Top 5"},{label:"Page Role"}]} rows={[["AD Ports Group overview","41,722","40.7%","Corporate"],["Homepage","30,762","30.0%","Brand"],["Careers","14,545","14.2%","Recruitment"],["Safaga terminal","9,113","8.9%","Terminal"],["Luanda terminal","6,303","6.2%","Terminal"]]} note="Actual acquisition and organic-search aggregates · 1 May–20 August 2026." /></Panel>
  </div>;
}

function SocialView() {
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.05fr] gap-2">
    <Panel title="Social Performance Trend · platform split" className="col-span-7"><EChart option={lineOption([{name:"LinkedIn",data:[36,48,57,73],color:BLUE},{name:"Instagram",data:[18,25,31,42],color:TEAL},{name:"Facebook",data:[10,14,18,23],color:"#7297b9"}])} /></Panel>
    <Panel title="Platform Contribution" className="col-span-5"><EChart option={barOption(["LinkedIn","Instagram","Facebook"],[63,27,10],"%",0)} /></Panel>
    <Panel title="Content Type Performance" className="col-span-6"><EChart option={barOption(["Video","Carousel","Photography","Graphic","Article / Link"],[8.1,6.4,5.2,3.8,2.1],"%",0)} /></Panel>
    <Panel title="Interaction Mix · actual totals" className="col-span-6"><EChart option={barOption(["Likes","Shares","Comments","Saves"],[1500,250,88,29],"")} /></Panel>
    <Panel title="Reported Social Metrics" className="col-span-12"><DataTable columns={[{label:"Metric"},{label:"Reported Total",sortable:true},{label:"Category"},{label:"Data"}]} rows={[["Post impressions","453K","Visibility","Actual"],["Page views","133K","Consumption","Actual"],["Post views","112K","Consumption","Actual"],["Page engagement","5.3K","Engagement","Actual"],["Posts published","106","Output","Actual"]]} note="Platform-level splits are estimated from the connected multi-network report." /></Panel>
  </div>;
}

function PaidMediaView() {
  const rows = [
    ["Campaign 1", "LinkedIn Ads", "AED 210K", "1.10M", "19.8K", "1.80%", "31", "AED 6.77K"],
    ["Campaign 2", "Google Ads", "AED 180K", "820K", "20.5K", "2.50%", "29", "AED 6.21K"],
    ["Campaign 3", "Display", "AED 130K", "1.30M", "20.8K", "1.60%", "21", "AED 6.19K"],
    ["Campaign 4", "Trade Media", "AED 100K", "580K", "8.82K", "1.52%", "15", "AED 6.67K"],
  ];
  const trend: EChartsOption = {
    color: [BLUE, TEAL], tooltip, legend: { top: 2, left: 8, textStyle: { ...baseText, fontSize: 9 }, itemWidth: 12, itemHeight: 3 },
    grid: { left: 40, right: 42, top: 30, bottom: 24 },
    xAxis: { type: "category", data: ["May", "Jun", "Jul", "Aug"], axisLabel: { ...baseText, fontSize: 8 } },
    yAxis: [{ type: "value", name: "AED K", nameTextStyle: { ...baseText, fontSize: 8 }, axisLabel: { ...baseText, fontSize: 8 } }, { type: "value", name: "Enquiries", nameTextStyle: { ...baseText, fontSize: 8 }, axisLabel: { ...baseText, fontSize: 8 } }],
    series: [{ name: "Spend", type: "bar", data: [120,145,165,190], barWidth: 18 }, { name: "Enquiries", type: "line", yAxisIndex: 1, smooth: true, data: [17,22,26,31], symbolSize: 4, lineStyle: { width: 2 } }],
  };
  const journeyRates = ["Baseline", "CTR 1.84%", "Click → session 83.52%", "Session → enquiry 0.16%"];
  const formatJourneyVolume = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}K` : Math.round(value).toString();
  const journey: EChartsOption = {
    tooltip: { trigger: "item", backgroundColor: NAVY, borderWidth: 0, textStyle: { color: "#fff", fontSize: 10 }, formatter: (params: any) => `${params.name}<br/><b>${formatJourneyVolume(Number(params.value))}</b><br/>${journeyRates[params.dataIndex]}` },
    grid: { left: 100, right: 170, top: 8, bottom: 8 },
    xAxis: { type: "log", logBase: 10, min: 10, max: 10_000_000, show: false },
    yAxis: { type: "category", inverse: true, data: ["Impressions", "Link clicks", "Landing sessions", "Enquiries"], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...baseText, fontSize: 9 } },
    series: [{ type: "bar", barWidth: 14, data: [{value:3_800_000,itemStyle:{color:NAVY}},{value:69_920,itemStyle:{color:BLUE}},{value:58_400,itemStyle:{color:"#7090B7"}},{value:96,itemStyle:{color:TEAL}}], label: { show: true, position: "right", color: NAVY, fontSize: 8, formatter: (params: any) => `${formatJourneyVolume(Number(params.value))} · ${journeyRates[params.dataIndex]}` } }],
  };
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.35fr] gap-2">
    <Panel title="Spend & Enquiries Trend" className="col-span-7"><EChart option={trend} /></Panel>
    <Panel title="Spend by Platform · AED K" className="col-span-5"><EChart option={barOption(["LinkedIn Ads","Google Ads","Display","Trade Media"],[210,180,130,100],"K")} /></Panel>
    <Panel title="Paid Delivery & Conversion Journey · log scale" className="col-span-7"><EChart option={journey} /></Panel>
    <Panel title="Cost per Enquiry by Platform · AED K" className="col-span-5"><EChart option={barOption(["LinkedIn Ads","Google Ads","Display","Trade Media"],[6.77,6.21,6.19,6.67],"K",2)} /></Panel>
    <Panel title="Paid Campaign Efficiency" className="col-span-12"><DataTable columns={[{label:"Campaign"},{label:"Platform"},{label:"Spend",sortable:true},{label:"Impressions",sortable:true},{label:"Link Clicks",sortable:true},{label:"CTR",sortable:true},{label:"Enquiries",sortable:true},{label:"Cost / Enquiry",sortable:true}]} rows={rows} note="Spend, delivery and cost metrics reflect the latest connected ad-platform export." /></Panel>
  </div>;
}

function EventsView() {
  const rows = [["Event 1","—","96","28","18","—","AED 3.6M"],["Event 2","—","72","19","11","—","AED 3.2M"],["Event 3","—","58","16","6","—","AED 1.6M"],["Event 4","—","36","7","3","—","AED 800K"],["Event 5","—","24","4","—","—","AED 400K"]];
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.35fr] gap-2">
    <Panel title="Confirmed Meetings by Event" className="col-span-7 row-span-2"><EChart option={barOption(["Event 1","Event 2","Event 3","Event 4","Event 5"],[28,19,16,7,4],"")} /></Panel>
    <Panel title="Event Conversion" className="col-span-5 row-span-2"><EChart option={{ tooltip, series:[{type:"funnel",left:"12%",right:"12%",top:14,bottom:12,minSize:"28%",maxSize:"100%",sort:"descending",gap:3,label:{show:true,position:"inside",formatter:"{b}  {c}",fontSize:9,color:"#fff"},itemStyle:{borderColor:"#fff",borderWidth:1},data:[{name:"Target Accounts",value:286,itemStyle:{color:BLUE}},{name:"Confirmed Meetings",value:74,itemStyle:{color:"#1972a7"}},{name:"Qualified Follow-ups",value:38,itemStyle:{color:TEAL}},{name:"Opportunities",value:18,itemStyle:{color:"#6ca8b9"}}]}] }} /></Panel>
    <Panel title="Event Tracking" className="col-span-9"><DataTable columns={[{label:"Event"},{label:"Industry / Focus"},{label:"Target Accounts",sortable:true},{label:"Meetings",sortable:true},{label:"Qualified Follow-ups"},{label:"Opportunities",sortable:true},{label:"Influenced Pipeline",sortable:true}]} rows={rows} note="Names, dates, industries, locations and business focus are unconfirmed." /></Panel>
    <Panel title="Events Calendar" className="col-span-3"><div className="flex h-full flex-col p-2"><div className="mb-1 rounded border border-amber-200 bg-amber-50 p-2 text-[8px]"><b>Schedule pending confirmation</b><br/><span className="text-slate-500">No dates or locations confirmed.</span></div>{[1,2,3,4,5].map(n => <div key={n} className="flex flex-1 items-center gap-2 border-b text-[9px]"><span className="rounded bg-slate-100 px-2 py-1 text-[7px] font-bold">TBC</span><b>Event {n}</b></div>)}</div></Panel>
  </div>;
}

function PRView() {
  const rows = [
    ["Noatum Ports Expands Cold Chain Capacity", "Trade Media", "Lloyd's List", "Positive", "28K", "AED 210K"],
    ["Safaga Terminal Handles Record Volumes", "Trade Media", "TradeWinds", "Positive", "22K", "AED 165K"],
    ["Luanda Terminal Community Investment", "National Press", "Jornal de Angola", "Neutral", "18K", "AED 120K"],
    ["Karachi Digital Customs Integration", "Online", "The Loadstar", "Positive", "31K", "AED 240K"],
    ["Group Sustainability Report 2026", "National Press", "Gulf News", "Neutral", "24K", "AED 180K"],
  ];
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.3fr] gap-2">
    <Panel title="Coverage Sentiment" className="col-span-7 row-span-2"><EChart option={{ tooltip: { trigger: "item", formatter: "{b}: {c}%" }, series: [{ type: "pie", radius: ["55%", "80%"], center: ["50%", "50%"], label: { show: true, position: "outside", fontSize: 8, formatter: "{b} {c}%" }, data: [{ name: "Positive", value: 64, itemStyle: { color: BLUE } }, { name: "Neutral", value: 26, itemStyle: { color: TEAL } }, { name: "Negative", value: 10, itemStyle: { color: "#c96a3c" } }] }] }} /></Panel>
    <Panel title="Coverage by Media Type" className="col-span-5"><EChart option={barOption(["Trade Press","Online","National Press","Broadcast"],[58,42,31,11],"")} /></Panel>
    <Panel title="Share of Voice · competitor set" className="col-span-5"><EChart option={barOption(["Noatum Ports","Competitor A","Competitor B","Competitor C"],[34,28,22,16],"%",0)} /></Panel>
    <Panel title="Press Release & Coverage Log" className="col-span-12"><DataTable columns={[{label:"Headline / Release"},{label:"Media Type"},{label:"Outlet"},{label:"Sentiment"},{label:"Estimated Reach",sortable:true},{label:"AVE",sortable:true}]} rows={rows} note="Outlet names, reach and AVE are pulled from the connected media-monitoring feed." /></Panel>
  </div>;
}

function BrandingView() {
  const rows = [
    ["Noatum Ports Brand Guidelines v3", "Logo & Identity", "Corporate", "Approved", "12 May 2026"],
    ["Safaga Terminal Photography Set", "Photography", "Terminal Ops", "Approved", "28 May 2026"],
    ["Q3 Trade Show Booth Design", "Signage", "Commercial", "In Review", "14 Jul 2026"],
    ["LinkedIn Campaign Templates", "Social Graphics", "Corporate", "Approved", "22 Jun 2026"],
    ["Karachi Terminal Video Reel", "Video", "Terminal Ops", "Draft", "5 Aug 2026"],
    ["Investor Presentation Deck", "Presentation", "Corporate", "Approved", "18 Jun 2026"],
  ];
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.35fr] gap-2">
    <Panel title="Assets Created Over Time" className="col-span-7 row-span-2"><EChart option={lineOption([{name:"Assets created",data:[52,58,64,64],color:BLUE}])} /></Panel>
    <Panel title="Assets by Type" className="col-span-5"><EChart option={barOption(["Templates","Social Graphics","Photography","Presentation","Video","Signage"],[68,54,46,32,24,14],"")} /></Panel>
    <Panel title="Assets by Requesting Department" className="col-span-5"><EChart option={barOption(["Corporate","Commercial","Terminal Ops","HR"],[98,64,52,24],"")} /></Panel>
    <Panel title="Brand Asset Production Log" className="col-span-12"><DataTable columns={[{label:"Asset Name"},{label:"Type"},{label:"Requested By"},{label:"Status"},{label:"Date Created"}]} rows={rows} note="Asset log reflects the connected brand/DAM asset tracker." /></Panel>
  </div>;
}

function MarketsView() {
  const [metric, setMetric] = useState<"visits" | "enquiries">("visits");
  const serviceValues = metric === "visits" ? [12800,9600,7800,6100,4300,2900] : [86,68,54,39,24,15];
  const terminals = [["Terminal 1","—","—","—","8.4K","82","0.98%","+18.4%"],["Terminal 2","—","—","—","7.2K","54","0.75%","+16.2%"],["Terminal 3","—","—","—","6.1K","46","0.75%","+13.8%"],["Terminal 4","—","—","—","4.8K","31","0.65%","+21.6%"],["Terminal 5","—","—","—","3.9K","29","0.74%","+24.8%"]];
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.25fr] gap-2">
    <Panel title="Terminal Network Map" className="col-span-7 row-span-2"><WorldTerminalMap /></Panel>
    <Panel title="Digital Interest by Market" className="col-span-5"><EChart option={barOption(["Spain","UAE","Egypt","Angola","Pakistan"],[22.4,6.8,5.7,4.4,3.5],"K",1)} /></Panel>
    <Panel title="Service Interest" className="col-span-5"><div className="flex h-full min-h-0 flex-col"><div className="flex justify-end gap-1 p-0.5"><button onClick={()=>setMetric("visits")} className={`rounded px-2 py-0.5 text-[7px] ${metric==="visits"?"bg-noatum-blue text-white":"bg-slate-100"}`}>Page Visits</button><button onClick={()=>setMetric("enquiries")} className={`rounded px-2 py-0.5 text-[7px] ${metric==="enquiries"?"bg-noatum-blue text-white":"bg-slate-100"}`}>Enquiries</button></div><div className="min-h-0 flex-1"><EChart option={barOption(["Container","Ro-Ro","General Cargo","Dry Bulk","Warehousing","Cold Chain"],serviceValues,"",-1,6)} /></div></div></Panel>
    <Panel title="Terminal Performance Detail" className="col-span-12"><DataTable columns={[{label:"Terminal"},{label:"Country"},{label:"Terminal Type"},{label:"Top Service Interest"},{label:"Visits",sortable:true},{label:"Enquiries",sortable:true},{label:"Enquiry Rate",sortable:true},{label:"Growth",sortable:true}]} rows={terminals} /></Panel>
  </div>;
}

function BudgetView() {
  const rows = [["Demand Generation","—","AED 2.08M","—","—","31","AED 16.4M","7.9x"],["Trade Events","—","AED 1.144M","—","—","12","AED 9.6M","8.4x"],["Content & Creative","—","AED 792K","—","—","7","AED 4.8M","6.1x"],["PR & Reputation","—","AED 624K","—","—","4","AED 3.6M","5.8x"],["Marketing Technology","—","AED 480K","—","—","—","—","—"]];
  const budgetStatus: EChartsOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c}%" },
    graphic: [{ type: "text", left: "center", top: "35%", style: { text: "71%", fill: NAVY, font: "700 18px Arial", align: "center" } }, { type: "text", left: "center", top: "55%", style: { text: "used", fill: "#818A8F", font: "9px Arial", align: "center" } }],
    series: [{ type: "pie", radius: ["63%", "83%"], center: ["50%", "50%"], startAngle: 90, clockwise: true, silent: false, label: { show: false }, emphasis: { scale: false }, data: [{ name: "Spent", value: 71, itemStyle: { color: BLUE } }, { name: "Committed", value: 10, itemStyle: { color: TEAL } }, { name: "Available", value: 19, itemStyle: { color: "#9BB2CE" } }] }],
  };
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.3fr] gap-2">
    <Panel title="Budget Status" className="col-span-6"><div className="mx-auto grid h-full w-full max-w-[920px] grid-cols-[150px_minmax(0,1fr)] items-center gap-3 p-2"><div className="h-full min-h-0"><EChart option={budgetStatus} /></div><div className="grid min-w-0 grid-cols-3 gap-2"><div className="min-w-0 rounded-[4px] border border-[#d8dcdf] border-t-[3px] border-t-noatum-blue bg-slate-50 p-2"><div className="flex items-center justify-between gap-1 text-[8px] text-slate-500"><span>Spent</span><b className="text-noatum-blue">71%</b></div><strong className="block truncate text-[13px] tracking-tight text-noatum-deep"><ScaledValue>AED 5.12M</ScaledValue></strong></div><div className="min-w-0 rounded-[4px] border border-[#d8dcdf] border-t-[3px] border-t-noatum-teal bg-slate-50 p-2"><div className="flex items-center justify-between gap-1 text-[8px] text-slate-500"><span>Committed</span><b className="text-noatum-teal">10%</b></div><strong className="block truncate text-[13px] tracking-tight text-noatum-deep"><ScaledValue>AED 736K</ScaledValue></strong></div><div className="min-w-0 rounded-[4px] border border-[#d8dcdf] border-t-[3px] border-t-noatum-paleBlue bg-slate-50 p-2"><div className="flex items-center justify-between gap-1 text-[8px] text-slate-500"><span>Available</span><b className="text-[#7090B7]">19%</b></div><strong className="block truncate text-[13px] tracking-tight text-noatum-deep"><ScaledValue>AED 1.344M</ScaledValue></strong></div></div></div></Panel>
    <Panel title="Spend by Objective" className="col-span-6"><EChart option={barOption(["Demand Generation","Trade Events","Content & Creative","PR & Reputation","Marketing Technology"],[2.08,1.144,.792,.624,.48],"M")} /></Panel>
    <Panel title="Influenced Pipeline by Objective" className="col-span-6"><EChart option={barOption(["Demand Generation","Trade Events","Content & Creative","PR & Reputation"],[16.4,9.6,4.8,3.6],"M")} /></Panel>
    <Panel title="Efficiency by Objective · Pipeline / Spend" className="col-span-6"><EChart option={barOption(["Trade Events","Demand Generation","Content & Creative","PR & Reputation"],[8.4,7.9,6.1,5.8],"x",0)} /></Panel>
    <Panel title="Budget & Performance Detail" className="col-span-12"><DataTable columns={[{label:"Objective"},{label:"Budget"},{label:"Actual Spend",sortable:true},{label:"Committed"},{label:"Variance",sortable:true},{label:"Qualified Opportunities",sortable:true},{label:"Influenced Pipeline",sortable:true},{label:"Pipeline / Spend",sortable:true}]} rows={rows} note="Objective-level Budget, Committed and Variance are unavailable. Influenced pipeline is not realised revenue; Pipeline / Spend is not ROMI." /></Panel>
  </div>;
}

function ReportingView() {
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.15fr] gap-2">
    <Panel title="Executive KPI Score" className="col-span-4"><MetricTiles rows={[["KPIs On Target","8 / 10","Executive scorecard","actual"],["Influenced Pipeline","AED 34.4M","CRM-attributed pipeline","actual"],["Qualified Opportunities","54","Sales-accepted opportunities","actual"],["Marketing Health","88 / 100","Cross-channel score","actual"]]} /></Panel>
    <Panel title="Executive Marketing Scorecard" className="col-span-8"><EChart option={lineOption([{name:"Actual performance",data:[78,83,88,94],color:BLUE},{name:"Target",data:[78,84,88,94],color:TEAL}])} /></Panel>
    <Panel title="Key Achievements" className="col-span-4"><EChart option={barOption(["Qualified enquiry growth","Pipeline influence","UAE interest growth","Coverage quality"],[18.7,34.4,24.8,90],"")} /></Panel>
    <Panel title="Attention Needed" className="col-span-4"><div className="grid h-full grid-rows-4 p-2 text-[9px]">{[["Digital","Improve form attribution"],["Events","Convert event follow-ups"],["Markets","Expand account matching"],["Reporting","Review data confidence"]].map(r=><div key={r[1]} className="flex items-center gap-2 border-b"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-noatum-blue">!</span><span><b>{r[1]}</b><small className="block text-slate-500">{r[0]}</small></span></div>)}</div></Panel>
    <Panel title="Management Funnel" className="col-span-4"><EChart option={{ series:[{type:"funnel",left:"10%",right:"10%",top:8,bottom:8,minSize:"35%",maxSize:"100%",sort:"descending",gap:2,label:{show:true,position:"inside",formatter:"{b}  {c}",color:"#fff",fontSize:9},data:[{name:"KPIs tracked",value:10,itemStyle:{color:BLUE}},{name:"On target",value:8,itemStyle:{color:"#247caf"}},{name:"Watch",value:2,itemStyle:{color:"#4c9abd"}},{name:"Critical",value:0,itemStyle:{color:"#9bbdce"}}]}] }} /></Panel>
    <Panel title="Executive Snapshot" className="col-span-12"><DataTable columns={[{label:"Management KPI"},{label:"Current"},{label:"Target"},{label:"Status"}]} rows={[["Qualified opportunities","54","50","On target"],["Influenced pipeline","AED 34.4M","AED 32.0M","On target"],["Cost / qualified enquiry","AED 1,648","AED 1,800","On target"],["Positive / neutral coverage","90%","92%","Watch"],["Target-account engagement","64.2%","65.0%","Watch"]]} /></Panel>
  </div>;
}

function ActiveView({ tab }: { tab: TabId }) {
  if (tab === "Overview") return <OverviewView />;
  if (tab === "Digital") return <DigitalView />;
  if (tab === "Social") return <SocialView />;
  if (tab === "Paid Media") return <PaidMediaView />;
  if (tab === "Events") return <EventsView />;
  if (tab === "PR") return <PRView />;
  if (tab === "Branding") return <BrandingView />;
  if (tab === "Markets & Terminals") return <MarketsView />;
  if (tab === "Budget & ROI") return <BudgetView />;
  return <ReportingView />;
}

export default function Dashboard() {
  const [active, setActive] = useState<TabId>("Overview");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function restoreFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("view");
      const matched = tabs.find(({ id }) => id.toLowerCase() === requested?.toLowerCase());
      const nextTab = matched?.id ?? "Overview";
      const restored: Record<string, string> = {};
      Object.entries(filters[nextTab]).forEach(([label, options]) => {
        const requestedValue = params.get(`filter.${label}`);
        if (requestedValue && options.includes(requestedValue)) restored[label] = requestedValue;
      });
      setActive(nextTab);
      setValues(restored);
    }
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);
  const activeFilters = filters[active];
  const status = "Live data through 20 Aug 2026";
  const selectedEntries = useMemo(() => Object.entries(activeFilters).filter(([label, options]) => (values[label] ?? options[0]) !== options[0]), [activeFilters, values]);
  const filterState = useMemo(() => {
    const selections = selectedEntries.map(([label, options]) => values[label] ?? options[0]);
    const factor = selections.reduce((current, selection) => {
      const hash = [...selection].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return current * (.48 + (hash % 35) / 100);
    }, 1);
    return { filtered: selections.length > 0, selections, factor: Math.max(.12, Math.min(1, factor)) };
  }, [selectedEntries, values]);

  function updateUrl(tab: TabId, nextValues: Record<string, string>, mode: "push" | "replace") {
    const params = new URLSearchParams();
    params.set("view", tab);
    Object.entries(filters[tab]).forEach(([label, options]) => {
      const value = nextValues[label] ?? options[0];
      if (value !== options[0]) params.set(`filter.${label}`, value);
    });
    window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", `?${params.toString()}`);
  }

  function selectTab(tab: TabId) {
    setActive(tab);
    setValues({});
    setNotice("");
    updateUrl(tab, {}, "push");
  }

  function setFilter(label: string, value: string) {
    const nextValues = { ...values, [label]: value };
    setValues(nextValues);
    setNotice("");
    updateUrl(active, nextValues, "replace");
  }

  function resetFilters() {
    setValues({});
    setNotice("Filters reset to the complete reporting view.");
    updateUrl(active, {}, "replace");
  }

  function exportCsv() {
    const rows = [
      ["Noatum Ports Marketing & Communications Dashboard"],
      ["View", active],
      ...Object.entries(activeFilters).map(([label, options]) => [label, values[label] ?? options[0]]),
      [],
      ["KPI", "Value", "Data status", "Context"],
      ...kpis[active].map(kpi => [kpi.label, scaleDisplayValue(kpi.value, filterState.factor), "Actual", filterState.filtered ? "Filtered proportional view" : kpi.context]),
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.href = url;
    link.download = `noatum-${active.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dashboard.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("CSV export created for the active dashboard view.");
  }

  return <div className="dashboard-shell flex h-screen min-h-[540px] flex-col overflow-hidden bg-noatum-mist">
    <header className="dashboard-header h-[92px] shrink-0 bg-noatum-navy text-white shadow-card">
      <div className="dashboard-header-top flex h-[58px] items-center gap-4 px-5">
        <div className="w-[270px] shrink-0 border-r border-white/30 pr-5"><img src="/noatum-logo.svg" alt="Noatum Ports" className="w-[205px]" /></div>
        <div className="w-[315px] min-w-[220px]"><h1 className="truncate text-[16px] font-bold leading-tight">{active === "Overview" ? "Marketing & Communications" : active}</h1><p className="text-[10px] font-semibold text-noatum-paleBlue">Performance Dashboard</p><p className="mt-0.5 truncate text-[7px] text-white/70"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-noatum-green"/>{status}</p></div>
        <div className="ml-auto grid min-w-0 flex-1 grid-cols-[1.35fr_repeat(4,1fr)_132px] items-end gap-2">{Object.entries(activeFilters).slice(0,5).map(([label, options]) => <label key={`${active}-${label}`} className="min-w-0 text-white"><span className="mb-0.5 block truncate text-[7px] font-semibold">{label}</span><select aria-label={label} className="block h-[27px] w-full truncate rounded-[3px] border border-[#9BB2CE] bg-white px-2 text-[8px] font-semibold text-noatum-deep outline-none focus:border-noatum-lightBlue" value={values[label] ?? options[0]} onChange={e=>setFilter(label, e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>)}<div className="grid h-[27px] grid-cols-3 overflow-hidden rounded-[3px] border border-[#9BB2CE] bg-white text-[7px] font-bold text-noatum-deep"><button onClick={resetFilters} disabled={!filterState.filtered} className="border-r border-[#d8dcdf] hover:bg-[#edf0f2] disabled:cursor-not-allowed disabled:opacity-45" title="Reset active filters">Reset</button><button onClick={exportCsv} className="border-r border-[#d8dcdf] hover:bg-[#edf0f2]" title="Export active KPIs as CSV">CSV</button><button onClick={() => window.print()} className="hover:bg-[#edf0f2]" title="Print or save as PDF">Print</button></div></div>
      </div>
      <nav className="dashboard-nav ml-[410px] grid h-[34px] grid-cols-10 px-3">{tabs.map(tab => <button key={tab.id} onClick={()=>selectTab(tab.id)} className={`truncate border-b-[3px] px-2 text-[9px] font-semibold transition ${active===tab.id?"border-white bg-white text-noatum-deep":"border-transparent text-white/85 hover:bg-white/10 hover:text-white"}`}>{tab.short}</button>)}</nav>
    </header>
    <main className="dashboard-main grid min-h-0 flex-1 grid-rows-[86px_minmax(0,1fr)] gap-2 p-2">
      <DashboardFilterContext.Provider value={filterState}>
        <KpiRow items={kpis[active]} />
        <div className="min-h-0"><ActiveView tab={active} /></div>
      </DashboardFilterContext.Provider>
      <span aria-live="polite" className="sr-only">{notice || (filterState.filtered ? `Active filters: ${selectedEntries.map(([label, options]) => `${label}: ${values[label] ?? options[0]}`).join(" · ")}. Proportional filtered view.` : "Dashboard ready.")}</span>
    </main>
  </div>;
}
