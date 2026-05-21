"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Package, ShoppingBag, DollarSign, Clock, Truck, XCircle, Layers, Users, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

const COLORS = ["#1B3D2F", "#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2", "#B7E4C7", "#D8F3DC"];

const tooltipStyle: React.CSSProperties = {
  background: "white",
  border: "1.5px solid rgba(27, 61, 47, 0.15)",
  borderRadius: "8px",
  fontSize: "0.8rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

interface AdminStatData {
  summary: {
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    shippedOrders: number;
    cancelledOrders: number;
    totalStock: number;
    outOfStock: number;
    moderatedProducts: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  monthlyOrders: { month: string; orders: number }[];
  topCategories: { name: string; revenue: number; count: number }[];
  revenueTrend: { month: string; revenue: number; orders: number }[];
  topSellers: { email: string; revenue: number; orders: number }[];
}

function formatMonth(m: string) {
  const d = new Date(m + "-01");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function AdminStatisticsPage() {
  const [data, setData] = useState<AdminStatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/statistics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.page}><div className={styles.spinner} /></div>;
  }

  if (!data) {
    return <div className={styles.page}><p>Error loading statistics.</p></div>;
  }

  const { summary, monthlyRevenue, monthlyOrders, topCategories, revenueTrend, topSellers } = data;

  const summaryCards = [
    { label: "Sellers", value: summary.totalSellers, icon: <Users size={16} /> },
    { label: "Products", value: summary.totalProducts, icon: <Package size={16} /> },
    { label: "Total Orders", value: summary.totalOrders, icon: <ShoppingBag size={16} /> },
    { label: "Revenue", value: formatCurrency(summary.totalRevenue), icon: <DollarSign size={16} /> },
    { label: "Pending", value: summary.pendingOrders, icon: <Clock size={16} />, warn: summary.pendingOrders > 0 },
    { label: "Shipped", value: summary.shippedOrders, icon: <Truck size={16} /> },
    { label: "Cancelled", value: summary.cancelledOrders, icon: <XCircle size={16} />, danger: summary.cancelledOrders > 0 },
    { label: "Out of Stock", value: summary.outOfStock, icon: <AlertCircle size={16} />, warn: summary.outOfStock > 0 },
  ];

  const orderStatusData = [
    { name: "Pending", value: summary.pendingOrders, color: "#d97706" },
    { name: "Paid", value: summary.totalOrders - summary.pendingOrders - summary.shippedOrders - summary.cancelledOrders, color: "#16a34a" },
    { name: "Shipped", value: summary.shippedOrders, color: "#1B3D2F" },
    { name: "Cancelled", value: summary.cancelledOrders, color: "#dc2626" },
  ].filter((d) => d.value > 0);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Platform <span className={styles.italic}>Statistics</span>
        </h1>
        <p className={styles.welcome}>Global overview of the seller platform</p>
      </header>

      <div className={styles.grid}>
        {summaryCards.map((c) => (
          <div key={c.label} className={`${styles.card} ${c.warn ? styles.cardWarn : ""} ${c.danger ? styles.cardDanger : ""}`}>
            <div className={`${styles.iconWrapper} ${c.warn ? styles.iconWarn : ""} ${c.danger ? styles.iconDanger : ""}`}>
              {c.icon}
            </div>
            <div className={styles.cardBody}>
              <span className={styles.cardValue}>{c.value}</span>
              <span className={styles.cardLabel}>{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.charts}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                labelFormatter={formatMonth}
              />
              <Line type="monotone" dataKey="revenue" stroke="#1B3D2F" strokeWidth={2} dot={{ fill: "#1B3D2F" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Orders per Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [value, "Orders"]}
                labelFormatter={formatMonth}
              />
              <Bar dataKey="orders" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" fontSize={11} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#40916C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={orderStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
              >
                {orderStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Orders"]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {topSellers.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Top Sellers by Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSellers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="email" fontSize={10} width={180} tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "..." : v} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#52B788" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Sales Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={topCategories}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
              >
                {topCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Units sold"]} />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                formatter={(value) => (value.length > 14 ? value.slice(0, 14) + "..." : value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
