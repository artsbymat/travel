"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Users, MapPin, DollarSign } from "lucide-react";

const chartData = [
  { month: "Jan", trips: 400, revenue: 2400 },
  { month: "Feb", trips: 620, revenue: 2210 },
  { month: "Mar", trips: 890, revenue: 2290 },
  { month: "Apr", trips: 750, revenue: 2000 },
  { month: "May", trips: 1200, revenue: 2181 },
  { month: "Jun", trips: 1100, revenue: 2500 },
];

const revenueData = [
  { name: "Surabaya Route", value: 35000 },
  { name: "Jakarta Route", value: 28000 },
  { name: "Bandung Route", value: 22000 },
  { name: "Yogyakarta Route", value: 18000 },
];

export default function AdminDashboard() {
  const stats = [
    {
      label: "Total Trips",
      value: "2,547",
      icon: MapPin,
      color: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      label: "Active Drivers",
      value: "145",
      icon: Users,
      color: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      label: "Total Revenue",
      value: "$125,430",
      icon: DollarSign,
      color: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      label: "Growth",
      value: "+23.5%",
      icon: TrendingUp,
      color: "bg-amber-100",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to TravelHub administration panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {stat.value}
                  </h3>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trips">Trips Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Monthly Trips & Revenue
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--foreground)" />
                <YAxis stroke="var(--foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="trips" fill="var(--primary)" name="Trips" />
                <Bar
                  dataKey="revenue"
                  fill="var(--accent)"
                  name="Revenue ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Revenue by Route
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--foreground)" />
                <YAxis stroke="var(--foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[
            {
              event: "New trip created",
              route: "Surabaya → Jakarta",
              time: "2 hours ago",
            },
            {
              event: "Driver registered",
              driver: "Budi Santoso",
              time: "4 hours ago",
            },
            {
              event: "New vehicle added",
              vehicle: "2024 Mercedes Sprinter",
              time: "1 day ago",
            },
            { event: "Payment received", amount: "$1,250", time: "2 days ago" },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-border pb-4 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {activity.event}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.route ||
                    activity.driver ||
                    activity.vehicle ||
                    activity.amount}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
