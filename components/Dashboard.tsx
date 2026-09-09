"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import EChart from "./EChart";
import { DashboardFilterContext } from "./DashboardFilterContext";
import WorldTerminalMap from "./WorldTerminalMap";

type SectionId = "Overview" | "Digital" | "Social" | "Paid Media" | "Events" | "PR" | "Branding" | "Markets & Terminals" | "Budget & ROI" | "Reporting";
type PrimaryTabId = "Overview" | "Digital Activities" | "Other Activities" | "Report";
type Kpi = { label: string; value: string; context: string; comparison?: string; icon: string; status: "actual" | "plan" };
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

const tabs: PrimaryTabId[] = ["Overview", "Digital Activities", "Other Activities", "Report"];
const primaryFilters: Record<PrimaryTabId, Record<string, string[]>> = {
  Overview: { Period: ["May 1 – Aug 20, 2026"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Terminal: ["All", "Safaga", "Luanda", "Karachi"] },
  "Digital Activities": { Period: ["May 1 – Aug 20, 2026"], Channel: ["All", "Website & SEO", "Organic Social", "Paid Media"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Terminal: ["All", "Safaga", "Luanda", "Karachi"] },
  "Other Activities": { Period: ["May 1 – Aug 20, 2026"], Activity: ["All", "Events", "PR & Media", "Branding", "Markets & Terminals"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Terminal: ["All", "Safaga", "Luanda", "Karachi"] },
  Report: { Period: ["May 2026", "Q2 2026", "Year to date"], Region: ["All", "Europe", "Middle East", "Africa", "South Asia"], Terminal: ["All", "Safaga", "Luanda", "Karachi"] },
};

const filters: Record<SectionId, Record<string, string[]>> = {
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

const kpis: Record<SectionId, Kpi[]> = {
  Overview: [
    { label: "Website Sessions", value: "12,946", context: "1.38 sessions per user", comparison: "+15.1% vs last month", icon: "◎", status: "actual" },
    { label: "Organic Social Impressions", value: "453K", context: "106 posts published", comparison: "+5.8% vs last month", icon: "in", status: "actual" },
    { label: "Paid Media Enquiries", value: "96", context: "AED 620K media spend", comparison: "+39.6% vs last month", icon: "+", status: "actual" },
    { label: "Confirmed Meetings", value: "74", context: "Tracked via CRM", comparison: "+26.3% vs last month", icon: "✓", status: "actual" },
    { label: "Budget Used", value: "71%", context: "AED 5.12M of AED 7.20M", comparison: "+2.0 pp vs last month", icon: "%", status: "actual" },
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
    { label: "Pipeline", value: "AED 9.6M", context: "CRM-attributed pipeline", icon: "AED", status: "actual" },
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
    { label: "Pipeline", value: "AED 34.4M", context: "CRM-attributed pipeline", icon: "↗", status: "actual" },
    { label: "Pipeline / Spend", value: "6.7x", context: "Not ROMI", icon: "x", status: "actual" },
  ],
  Reporting: [
    { label: "KPIs On Target", value: "8 / 10", context: "Monthly executive scorecard", comparison: "+1 KPI vs last month", icon: "✓", status: "actual" },
    { label: "Pipeline", value: "AED 34.4M", context: "Marketing-associated value", comparison: "+11.0% vs last month", icon: "AED", status: "actual" },
    { label: "Qualified Opportunities", value: "54", context: "Sales-accepted opportunities", comparison: "+21.4% vs last month", icon: "+", status: "actual" },
    { label: "Marketing Health", value: "88 / 100", context: "Cross-channel score", comparison: "+4 pts vs last month", icon: "★", status: "actual" },
  ],
};

const primaryKpis: Record<PrimaryTabId, Kpi[]> = {
  Overview: kpis.Overview,
  "Digital Activities": [
    { label: "Website Sessions", value: "12,946", context: "47.6% from organic search", comparison: "+15.1% vs last month", icon: "◎", status: "actual" },
    { label: "Digital Enquiries", value: "382", context: "Website and paid media", comparison: "+39.6% vs last month", icon: "+", status: "actual" },
    { label: "Social Impressions", value: "453K", context: "106 posts published", comparison: "+5.8% vs last month", icon: "in", status: "actual" },
    { label: "Digital Spend", value: "AED 2.00M", context: "71% of allocation", comparison: "+15.2% vs last month", icon: "AED", status: "actual" },
  ],
  "Other Activities": [
    { label: "Confirmed Meetings", value: "74", context: "Events tracked via CRM", comparison: "+26.3% vs last month", icon: "✓", status: "actual" },
    { label: "Media Mentions", value: "142", context: "90% positive / neutral", comparison: "+10.5% vs last month", icon: "◎", status: "actual" },
    { label: "Approved Assets", value: "196", context: "82.4% approval rate", comparison: "+5.8% vs last month", icon: "▣", status: "actual" },
    { label: "Other Activities Spend", value: "AED 3.12M", context: "71% of allocation", comparison: "+12.7% vs last month", icon: "AED", status: "actual" },
  ],
  Report: kpis.Reporting,
};

const baseText = { fontFamily: "Segoe UI, Arial", color: NAVY };
const tooltip = { trigger: "axis" as const, backgroundColor: NAVY, borderWidth: 0, textStyle: { ...baseText, color: "#fff", fontSize: 10 } };

function lineOption(series: { name: string; data: number[]; color: string }[], labels = ["May", "Jun", "Jul", "Aug"]): EChartsOption {
  return {
    animationDuration: 500, color: series.map(s => s.color), tooltip,
    legend: { top: 2, left: 8, textStyle: { ...baseText, fontSize: 11 }, itemWidth: 12, itemHeight: 3 },
    grid: { left: 42, right: 16, top: 30, bottom: 25 },
    xAxis: { type: "category", data: labels, boundaryGap: false, axisLine: { lineStyle: { color: "#cbd5e1" } }, axisLabel: { ...baseText, fontSize: 11 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#edf1f5" } }, axisLabel: { ...baseText, fontSize: 11 } },
    series: series.map(s => ({ name: s.name, type: "line", smooth: true, symbol: "circle", symbolSize: 4, lineStyle: { width: 2 }, areaStyle: { opacity: .04 }, data: s.data })),
  };
}

function barOption(labels: string[], values: number[], suffix: string, highlight = -1, barWidth = 10): EChartsOption {
  return {
    animationDuration: 450, tooltip: { ...tooltip, valueFormatter: (v) => `${v}${suffix}` },
    grid: { left: 116, right: 54, top: 6, bottom: 8 },
    xAxis: { type: "value", show: false },
    yAxis: { type: "category", inverse: true, data: labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...baseText, fontSize: 12, width: 108, overflow: "truncate", interval: barWidth < 10 ? 0 : "auto" } },
    series: [{ type: "bar", data: values.map((v, i) => ({ value: v, itemStyle: { color: i === highlight ? TEAL : BLUE, borderRadius: 5 } })), barWidth, showBackground: true, backgroundStyle: { color: PALE, borderRadius: 5 }, label: { show: true, position: "right", formatter: `{c}${suffix}`, ...baseText, fontSize: 11, fontWeight: 700 } }],
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
  const { factor } = useContext(DashboardFilterContext);
  return <section className={`grid min-h-0 gap-2 ${items.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>{items.map(item => <article key={item.label} className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-[4px] border border-[#c7cdd1] border-b-[5px] border-b-noatum-navy bg-white px-3 text-center shadow-card"><div className="max-w-full text-[14px] leading-tight font-bold text-noatum-deep">{item.label}</div><div className="truncate text-[28px] leading-tight font-extrabold tracking-tight text-noatum-deep">{scaleDisplayValue(item.value, factor)}</div>{item.comparison && <div className={`text-[12px] leading-tight font-semibold ${item.comparison.startsWith("-") ? "text-red-700" : "text-emerald-700"}`}><span aria-hidden="true">{item.comparison.startsWith("-") ? "▼" : "▲"}</span> {item.comparison}</div>}</article>)}</section>;
}

function MetricTiles({ rows }: { rows: [string, string, string, "actual" | "plan"][] }) {
  const { factor } = useContext(DashboardFilterContext);
  return <div className="grid h-full grid-cols-2 gap-1.5 p-1.5">{rows.map(r => <div key={r[0]} className="metric-tile grid min-h-0 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-2 rounded-[4px] border border-slate-200 border-l-[3px] border-l-noatum-blue bg-slate-50 px-3 py-1"><span className="truncate text-[12px] font-medium text-slate-600">{r[0]}</span><b className="whitespace-nowrap text-[16px] leading-none">{scaleDisplayValue(r[1], factor)}</b></div>)}</div>;
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
  return <div className="flex h-full min-h-0 flex-col"><div className="min-h-0 flex-1 overflow-auto"><table className="compact-table"><thead><tr>{columns.map((c, i) => <th key={c.label}>{c.sortable ? <button className="font-bold hover:text-noatum-blue" onClick={() => setSort({ index: i, asc: sort?.index === i ? !sort.asc : false })}>{c.label} ↕</button> : c.label}</th>)}</tr></thead><tbody>{sorted.map((row, i) => <tr key={`${row[0]}-${i}`}>{row.map((cell, j) => <td key={j} className={j === 0 ? "font-semibold" : ""}>{cell}</td>)}</tr>)}</tbody></table></div></div>;
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
  return <div className="grid h-full min-h-[600px] grid-cols-12 grid-rows-[1fr_1fr_auto] gap-2">
    <Panel title="Digital Performance" className="col-span-4"><MetricTiles rows={[["Sessions","12,946","GA4 actual","actual"],["Users","9,410","GA4 actual","actual"],["Organic Sessions","6,159","47.6% channel share","actual"],["Conversions / Enquiries","286","Conversion export missing","plan"]]} /></Panel>
    <Panel title="Organic Social Performance" className="col-span-4"><MetricTiles rows={[["Impressions","453K","Reported aggregate","actual"],["Engagement Rate","13.98%","Reported rate","actual"],["Posts Published","106","Reported aggregate","actual"],["Followers","12K","Current audience","actual"]]} /></Panel>
    <Panel title="Paid Media Performance" className="col-span-4"><MetricTiles rows={[["Ad Spend","AED 620K","Media spend to date","actual"],["Paid Impressions","3.8M","Delivered impressions","actual"],["Link CTR","1.84%","Click-through rate","actual"],["Attributed Enquiries","96","Attributed enquiries","actual"]]} /></Panel>
    <Panel title="Event Conversion" className="col-span-4"><EChart option={{ tooltip, grid:{left:18,right:18,top:20,bottom:24}, xAxis:{type:"category",data:["Accounts","Meetings","Follow-ups","Opportunities"],axisLabel:{...baseText,fontSize:11}}, yAxis:{type:"value",show:false}, series:[{type:"bar",data:[286,74,38,18],barWidth:22,itemStyle:{color:BLUE,borderRadius:[4,4,0,0]},label:{show:true,position:"top",fontSize:11,fontWeight:700}}] }} /></Panel>
    <Panel title="Markets & Terminals · Digital Interest" className="col-span-4"><EChart option={barOption(["Spain","UAE","Egypt"],[22.4,6.8,5.7],"K",1)} /></Panel>
    <Panel title="Budget & Commercial Influence" className="col-span-4"><div className="flex h-full flex-col justify-center p-2"><div className="mb-2 flex h-4 overflow-hidden rounded-full text-[9px] font-bold text-white"><span className="grid w-[71%] place-items-center bg-noatum-blue">Spent 71%</span><span className="grid w-[10%] place-items-center bg-noatum-teal">10%</span><span className="grid w-[19%] place-items-center bg-slate-400">19%</span></div><div className="grid grid-cols-2 gap-2"><div className="rounded border-l-[3px] border-noatum-blue bg-slate-50 px-2 py-1 text-[10px] text-slate-500">Actual Spend<b className="block text-[15px] text-noatum-deep"><ScaledValue>AED 5.12M</ScaledValue></b></div><div className="rounded border-l-[3px] border-noatum-teal bg-slate-50 px-2 py-1 text-[10px] text-slate-500">Influenced Pipeline<b className="block text-[15px] text-noatum-deep"><ScaledValue>AED 34.4M</ScaledValue></b></div></div><p className="mt-1 text-[9px] text-amber-700">Pipeline / Spend 6.7x · not ROMI</p></div></Panel>
    <Panel title="Management Performance Summary" className="management-summary col-span-12"><DataTable columns={[{label:"Area"},{label:"Primary KPI"},{label:"Current"},{label:"Data Status"},{label:"Management Reading"}]} rows={summary} /></Panel>
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
  const [mode, setMode] = useState<"report" | "raw" | "definitions">("report");
  const months = ["May-26", "Jun-26", "Jul-26", "Aug-26"];
  const rows = [
    ["Digital Activities", "section", "", "", "", "", "", "", "", "", "", "", ""],
    ["Website Sessions", "metric", "3,010", "3,420", "2,580", "9,010", "3,936", "12,946", "3,100", "9,846", "3,100", "12,946", "12,500"],
    ["Organic Search Share", "metric", "46.1%", "47.2%", "47.8%", "47.0%", "47.6%", "47.6%", "48.0%", "47.5%", "47.6%", "47.6%", "45.0%"],
    ["Digital Enquiries", "metric", "78", "86", "91", "255", "127", "382", "96", "286", "96", "382", "350"],
    ["Social Impressions", "metric", "96K", "108K", "121K", "325K", "128K", "453K", "106K", "347K", "106K", "453K", "420K"],
    ["Paid Media Spend", "metric", "AED 120K", "AED 145K", "AED 165K", "AED 430K", "AED 190K", "AED 620K", "AED 150K", "AED 470K", "AED 150K", "AED 620K", "AED 650K"],
    ["Digital Budget Used", "highlight", "61%", "65%", "68%", "68%", "71%", "71%", "70%", "70%", "71%", "71%", "75%"],
    ["Other Activities", "section", "", "", "", "", "", "", "", "", "", "", ""],
    ["Confirmed Event Meetings", "metric", "14", "17", "19", "50", "24", "74", "18", "56", "18", "74", "70"],
    ["Qualified Follow-ups", "metric", "8", "9", "10", "27", "11", "38", "9", "29", "9", "38", "40"],
    ["Media Mentions", "metric", "28", "34", "38", "100", "42", "142", "33", "109", "33", "142", "135"],
    ["Positive / Neutral Coverage", "metric", "88%", "89%", "91%", "89%", "90%", "90%", "90%", "90%", "90%", "90%", "92%"],
    ["Approved Brand Assets", "metric", "41", "48", "52", "141", "55", "196", "49", "147", "49", "196", "180"],
    ["Terminal & Service Visits", "metric", "9.8K", "10.4K", "10.9K", "31.1K", "11.7K", "42.8K", "10.7K", "32.1K", "10.7K", "42.8K", "40.0K"],
    ["Other Activities Budget Used", "highlight", "63%", "66%", "69%", "69%", "71%", "71%", "70%", "70%", "71%", "71%", "75%"],
    ["Commercial Performance", "section", "", "", "", "", "", "", "", "", "", "", ""],
    ["Qualified Opportunities", "metric", "10", "13", "14", "37", "17", "54", "13", "41", "13", "54", "50"],
    ["Influenced Pipeline", "highlight", "AED 6.8M", "AED 8.2M", "AED 9.1M", "AED 24.1M", "AED 10.3M", "AED 34.4M", "AED 8.6M", "AED 25.8M", "AED 8.6M", "AED 34.4M", "AED 32.0M"],
  ];
  if (mode === "definitions") return <div className="panel h-full overflow-auto p-5 text-[12px]"><div className="mb-4 flex justify-between"><b className="text-[16px]">KPI Definitions</b><button onClick={()=>setMode("report")} className="rounded bg-noatum-blue px-5 py-1.5 text-[12px] font-bold text-white">Performance Report</button></div>{rows.filter(row=>row[1]==="metric"||row[1]==="highlight").map(row=><div key={row[0]} className="grid grid-cols-[240px_1fr] border-b py-3"><b>{row[0]}</b><span className="text-slate-600">Reported result for the selected period, calculated from connected marketing, communications and CRM sources.</span></div>)}</div>;
  return <div className="flex h-full min-h-0 flex-col bg-white">
    <div className="flex h-14 shrink-0 items-center border-b border-[#9bb2ce] bg-[#f7fafc] px-4 text-[12px]"><span className="mr-3 h-8 w-1 rounded-full bg-noatum-teal"/><div><b className="block text-[14px] text-noatum-deep">Marketing Performance Report</b><span className="text-[12px] text-slate-500">Reporting Period (YTD) · May-26 to Aug-26</span></div><div className="ml-auto flex gap-1.5"><button onClick={()=>setMode("report")} className={`rounded px-5 py-1.5 font-bold ${mode==="report"?"bg-noatum-blue text-white":"border border-noatum-teal bg-white text-noatum-deep"}`}>Performance Report</button><button onClick={()=>setMode("raw")} className={`rounded px-5 py-1.5 font-bold ${mode==="raw"?"bg-noatum-blue text-white":"border border-noatum-teal bg-white text-noatum-deep"}`}>Raw Data</button><button onClick={()=>setMode("definitions")} className="rounded border border-noatum-teal bg-white px-5 py-1.5 font-bold text-noatum-deep">Definitions</button></div></div>
    <div className="min-h-0 flex-1 overflow-auto px-4 py-2">
      <table className="w-full min-w-[1500px] table-fixed border-separate border-spacing-0 text-[12px] leading-tight text-noatum-deep">
        <colgroup><col className="w-[18%]" />{Array.from({length:11},(_,index)=><col key={index} className="w-[7.45%]" />)}</colgroup>
        <thead className="sticky top-0 z-20 text-[12px]"><tr><th rowSpan={2} className="sticky left-0 z-30 border border-[#b9c9d8] bg-[#dce8f2] px-3 text-left text-noatum-deep">Marketing Performance KPI</th>{months.map(month=><th key={month} colSpan={2} className="border border-[#b9c9d8] bg-[#dce8f2] px-2 py-2 text-left text-noatum-deep">{month}</th>)}<th colSpan={2} className="border border-[#9bb2ce] bg-[#c8d9e8] px-2 py-2 text-left text-noatum-deep">YTD</th><th rowSpan={2} className="border border-[#9bb2ce] bg-[#c8d9e8] px-2 text-noatum-deep">Target</th></tr><tr>{[...months,"YTD"].flatMap(month=>[<th key={`${month}-m`} className="border border-[#c7d4df] bg-[#edf3f7] px-3 py-1.5 text-noatum-deep">MTD</th>,<th key={`${month}-y`} className="border border-[#c7d4df] bg-[#edf3f7] px-3 py-1.5 text-noatum-deep">YTD</th>])}</tr></thead>
        <tbody>{rows.map((row,index)=>{const section=row[1]==="section";const highlight=row[1]==="highlight";const brandedRow=section?"bg-noatum-navy font-bold text-white":highlight?"bg-noatum-blue font-bold text-white":index%2?"bg-[#f3f6f8]":"bg-white";const brandedSticky=section?"bg-noatum-navy":highlight?"bg-noatum-blue":"bg-inherit";return <tr key={`${row[0]}-${index}`} className={brandedRow}><td className={`sticky left-0 z-10 border-b border-r border-[#c7d4df] px-3 py-1.5 font-semibold ${brandedSticky}`}>{row[0]}</td>{row.slice(2).map((cell,cellIndex)=><td key={cellIndex} className="min-w-[82px] border-b border-r border-[#c7d4df] px-3 py-1.5 text-right">{mode==="raw"&&!section?String(cell).replace(/AED |K|M|%/g,""):cell}</td>)}</tr>})}</tbody>
      </table>
    </div>
    <div className="h-8 shrink-0 border-t border-[#d6e1e8] bg-[#f5f7f8] px-4 pt-1.5 text-[12px] italic text-slate-500">⟳ Refresh date: 20 Aug 2026 · 10:05 AM</div>
  </div>;
}

function ActivityBudgetView({ kind }: { kind: "digital" | "other" }) {
  const digital = kind === "digital";
  const labels = digital ? ["Paid Media", "Website & SEO", "Organic Social", "Marketing Technology"] : ["Events", "PR & Media", "Branding", "Markets & Terminals"];
  const spend = digital ? [620, 540, 360, 480] : [1144, 624, 792, 560];
  const rows = labels.map((label, index) => [label, `AED ${(spend[index] / .71).toFixed(0)}K`, `AED ${spend[index]}K`, "71%", index === 0 ? "On plan" : "Monitor"]);
  const total = spend.reduce((sum, value) => sum + value, 0);
  const allocation = total / .71;
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.3fr] gap-2">
    <Panel title={`${digital ? "Digital" : "Other Activities"} Budget Status`} className="col-span-5 row-span-2"><MetricTiles rows={[["Actual Spend",`AED ${(total / 1000).toFixed(2)}M`,"71% of allocated budget","actual"],["Committed",`AED ${Math.round(allocation * .10)}K`,"10% approved commitments","actual"],["Available",`AED ${Math.round(allocation * .19)}K`,"19% remaining allocation","actual"],["Budget Used","71%","Current reporting period","actual"]]} /></Panel>
    <Panel title="Spend by Activity · AED K" className="col-span-7 row-span-2"><EChart option={barOption(labels, spend, "K", 0)} /></Panel>
    <Panel title={`${digital ? "Digital" : "Other Activities"} Budget Detail`} className="col-span-12"><DataTable columns={[{label:"Activity"},{label:"Budget",sortable:true},{label:"Actual Spend",sortable:true},{label:"Budget Used",sortable:true},{label:"Status"}]} rows={rows} note="Activity allocation shown separately; consolidated budget remains available in Report." /></Panel>
  </div>;
}

function DigitalActivitiesView() {
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.25fr] gap-2">
    <Panel title="Digital Performance Trend" className="col-span-7 row-span-2"><EChart option={lineOption([{name:"Website sessions",data:[2580,3010,3420,3936],color:BLUE},{name:"Social engagement",data:[2140,2860,3540,5300],color:TEAL}])} /></Panel>
    <Panel title="Channel Contribution" className="col-span-5"><EChart option={barOption(["Organic Search","Direct","Paid Media","Organic Social"],[47.6,46.2,4.8,1.4],"%",0)} /></Panel>
    <Panel title="Digital Budget · AED K" className="col-span-5"><EChart option={barOption(["Paid Media","Website & SEO","Organic Social","Technology"],[620,540,360,480],"K",0)} /></Panel>
    <Panel title="Digital Activity Summary" className="activity-summary col-span-12"><DataTable columns={[{label:"Activity"},{label:"Primary Result",sortable:true},{label:"Outcome"},{label:"Spend",sortable:true},{label:"Management Reading"}]} rows={[["Website & SEO","12,946 sessions","286 enquiries","AED 540K","Organic search drives 47.6% of traffic"],["Organic Social","453K impressions","5.3K engagements","AED 360K","Video is the strongest content type"],["Paid Media","3.8M impressions","96 enquiries","AED 620K","Cost per enquiry averages AED 6.46K"],["Marketing Technology","Conversion tracking live","Improved attribution","AED 480K","Continue data-quality improvements"]]} note="Digital spend: AED 2.00M · 71% of allocated digital budget." /></Panel>
  </div>;
}

function OtherActivitiesView() {
  return <div className="grid h-full min-h-0 grid-cols-12 grid-rows-[1fr_1fr_1.25fr] gap-2">
    <Panel title="Activity Outcomes" className="col-span-7 row-span-2"><EChart option={barOption(["Events · meetings","PR · mentions","Branding · approved assets","Markets · enquiries"],[74,142,196,286],"",1)} /></Panel>
    <Panel title="Other Activities Budget · AED K" className="col-span-5"><EChart option={barOption(["Events","PR & Media","Branding","Markets & Terminals"],[1144,624,792,560],"K",0)} /></Panel>
    <Panel title="Commercial Influence" className="col-span-5"><MetricTiles rows={[["Pipeline","AED 18.0M","Activity-associated value","actual"],["Confirmed Meetings","74","Tracked through CRM","actual"],["Positive / Neutral PR","90%","Coverage sentiment","actual"],["Budget Used","71%","AED 3.12M spent","actual"]]} /></Panel>
    <Panel title="Other Activity Summary" className="activity-summary col-span-12"><DataTable columns={[{label:"Activity"},{label:"Primary Result",sortable:true},{label:"Commercial Outcome"},{label:"Spend",sortable:true},{label:"Management Reading"}]} rows={[["Events","74 confirmed meetings","AED 9.6M pipeline","AED 1.14M","Prioritise qualified follow-ups"],["PR & Media","142 mentions","90% positive / neutral","AED 624K","Maintain coverage quality"],["Branding","196 approved assets","82.4% approval rate","AED 792K","Turnaround averages 3.2 days"],["Markets & Terminals","42.8K relevant visits","286 enquiries","AED 560K","UAE is the fastest-growing market"]]} note="Other activities spend: AED 3.12M · 71% of allocated budget." /></Panel>
  </div>;
}

function ActiveView({ tab }: { tab: SectionId }) {
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
  const [active, setActive] = useState<PrimaryTabId>("Overview");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const activeKpis = primaryKpis[active];

  useEffect(() => {
    function restoreFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("view");
      const nextTab = tabs.find(tab => tab.toLowerCase() === requested?.toLowerCase()) ?? "Overview";
      const restored: Record<string, string> = {};
      Object.entries(primaryFilters[nextTab]).forEach(([label, options]) => {
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
  const activeFilters = primaryFilters[active];
  const selectedEntries = useMemo(() => Object.entries(activeFilters).filter(([label, options]) => (values[label] ?? options[0]) !== options[0]), [activeFilters, values]);
  const filterState = useMemo(() => {
    const selections = selectedEntries.map(([label, options]) => values[label] ?? options[0]);
    const factor = selections.reduce((current, selection) => {
      const hash = [...selection].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return current * (.48 + (hash % 35) / 100);
    }, 1);
    return { filtered: selections.length > 0, selections, factor: Math.max(.12, Math.min(1, factor)) };
  }, [selectedEntries, values]);

  function updateUrl(tab: PrimaryTabId, nextValues: Record<string, string>, mode: "push" | "replace") {
    const params = new URLSearchParams();
    params.set("view", tab);
    Object.entries(primaryFilters[tab]).forEach(([label, options]) => {
      const value = nextValues[label] ?? options[0];
      if (value !== options[0]) params.set(`filter.${label}`, value);
    });
    window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", `?${params.toString()}`);
  }

  function selectTab(tab: PrimaryTabId) {
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
      ...activeKpis.map(kpi => [kpi.label, scaleDisplayValue(kpi.value, filterState.factor), "Actual", filterState.filtered ? "Filtered proportional view" : kpi.context]),
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
    <header className="dashboard-header h-[135px] shrink-0 bg-noatum-navy text-white shadow-card">
      <div className="dashboard-header-top flex h-[62px] items-center gap-4 px-5">
        <div className="flex h-10 w-[320px] shrink-0 items-center border-r border-white/55 pr-5"><img src="/noatum-logo.svg" alt="Noatum Ports" className="w-[210px]" /></div>
        <div className="w-[350px] min-w-[300px]"><h1 className="whitespace-nowrap text-[17px] font-semibold leading-tight">Marketing &amp; Communications Dashboard</h1><p className="mt-1 text-[12px] text-white">Performance Report</p></div>
        <div className="ml-auto grid min-w-0 flex-1 grid-cols-[1.35fr_repeat(3,1fr)_150px] items-end gap-2">{Object.entries(activeFilters).slice(0,4).map(([label, options]) => <label key={`${active}-${label}`} className="min-w-0 text-white"><span className="mb-1 block truncate text-[10px] font-semibold">{label}</span><select aria-label={label} className="block h-[30px] w-full truncate border border-[#9BB2CE] bg-white px-2 text-[11px] font-semibold text-noatum-deep outline-none focus:border-noatum-lightBlue" value={values[label] ?? options[0]} onChange={e=>setFilter(label, e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>)}<div className="grid h-[30px] grid-cols-3 overflow-hidden border border-[#9BB2CE] bg-white text-[10px] font-bold text-noatum-deep"><button onClick={resetFilters} disabled={!filterState.filtered} className="border-r border-[#d8dcdf] hover:bg-[#edf0f2] disabled:cursor-not-allowed disabled:opacity-45" title="Reset active filters">Reset</button><button onClick={exportCsv} className="border-r border-[#d8dcdf] hover:bg-[#edf0f2]" title="Export active KPIs as CSV">CSV</button><button onClick={() => window.print()} className="hover:bg-[#edf0f2]" title="Print or save as PDF">Print</button></div></div>
      </div>
      <div className="flex h-[42px] items-center gap-4 px-5">
        <p className="mr-auto flex items-center text-[11px] font-semibold"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-noatum-teal"/>Reporting Period (YTD) · May-26 to Aug-26</p>
        <nav className="dashboard-nav grid h-[30px] w-[56%] grid-cols-4 gap-2">{tabs.map(tab => <button key={tab} onClick={()=>selectTab(tab)} className={`truncate rounded-[2px] border px-3 text-[11px] font-semibold transition ${active===tab?"border-white bg-white text-noatum-deep":"border-white/10 bg-[#153b6a] text-white hover:bg-[#21578a]"}`}>{tab}</button>)}</nav>
      </div>
    </header>
    <main className={`dashboard-main relative grid min-h-0 flex-1 ${active === "Report" ? "grid-rows-[minmax(0,1fr)] bg-white p-0" : "z-10 -mt-[31px] grid-rows-[92px_minmax(0,1fr)] gap-2 px-2 pb-2"}`}>
      <DashboardFilterContext.Provider value={filterState}>
        {active !== "Report" && <KpiRow items={activeKpis} />}
        <div className={`min-h-0 ${active === "Overview" ? "overflow-auto" : ""}`}>{active === "Overview" ? <OverviewView /> : active === "Digital Activities" ? <DigitalActivitiesView /> : active === "Other Activities" ? <OtherActivitiesView /> : <ReportingView />}</div>
      </DashboardFilterContext.Provider>
      <span aria-live="polite" className="sr-only">{notice || (filterState.filtered ? `Active filters: ${selectedEntries.map(([label, options]) => `${label}: ${values[label] ?? options[0]}`).join(" · ")}. Proportional filtered view.` : "Dashboard ready.")}</span>
    </main>
  </div>;
}
