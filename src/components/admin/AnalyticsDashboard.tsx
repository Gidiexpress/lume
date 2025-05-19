
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Mail, Briefcase, BarChart3, TrendingUp, Activity, FileText, GraduationCap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockUserAnalyticsData = {
  totalUsers: 1250,
  newUsersThisWeek: 75,
  fieldsOfStudy: [
    { name: 'Computer Science', value: 400 },
    { name: 'Engineering', value: 300 },
    { name: 'Business Admin', value: 250 },
    { name: 'Arts & Humanities', value: 150 },
    { name: 'Medicine', value: 100 },
    { name: 'Others', value: 50 },
  ],
  premiumVsFree: { premium: 300, free: 950 },
  topRecommendedPaths: [
    { name: 'Software Engineer', count: 250 },
    { name: 'Data Analyst', count: 180 },
    { name: 'Digital Marketer', count: 150 },
    { name: 'UX Designer', count: 120 },
    { name: 'Product Manager', count: 90 },
  ],
};

const mockReportInsightsData = {
  totalReportsGenerated: 2300,
  premiumReportsDownloaded: 280, // Assuming a download feature or proxy for generation
  averageSkillReadiness: 68, // Percentage
  topDownloadedByField: [
    { field: 'Computer Science', downloads: 120 },
    { field: 'Engineering', downloads: 90 },
    { field: 'Business Admin', downloads: 50 },
    { field: 'Marketing', downloads: 30 },
  ],
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AnalyticsDashboard() {
  const [userAnalytics, setUserAnalytics] = useState(mockUserAnalyticsData);
  const [reportInsights, setReportInsights] = useState(mockReportInsightsData);

  useEffect(() => {
    // Simulate fetching data or minor updates if needed
    // For now, we use the static mock data initialized above
  }, []);

  const pieChartData = userAnalytics.fieldsOfStudy.map(field => ({ name: field.name, value: field.value }));
  const premiumRatio = (userAnalytics.premiumVsFree.premium / userAnalytics.totalUsers) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Users className="mr-3 h-7 w-7 text-primary" />
          User Analytics
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userAnalytics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+5% from last month (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users (This Week)</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userAnalytics.newUsersThisWeek.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Compared to last week (mock)</p>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium User Ratio</CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{premiumRatio.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{userAnalytics.premiumVsFree.premium} Premium / {userAnalytics.premiumVsFree.free} Free</p>
            </CardContent>
          </Card>
           <Card className="shadow-lg md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Recommended Paths</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1">
                {userAnalytics.topRecommendedPaths.slice(0,3).map(path => (
                  <li key={path.name} className="flex justify-between">
                    <span>{path.name}</span>
                    <Badge variant="secondary">{path.count}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Most Common Fields of Study</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FileText className="mr-3 h-7 w-7 text-primary" />
          Report Insights
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports Generated</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportInsights.totalReportsGenerated.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">All types (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Reports "Downloaded"</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportInsights.premiumReportsDownloaded.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Or generated (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Skill Readiness Score</CardTitle>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportInsights.averageSkillReadiness}%</div>
              <p className="text-xs text-muted-foreground">Across premium reports (mock)</p>
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Top Reports Generated by Field of Study</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportInsights.topDownloadedByField}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="field" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="downloads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-yellow-50 border-yellow-200 shadow-md mt-8">
        <CardHeader className="flex flex-row items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            <CardTitle className="text-yellow-700 text-base">Developer Note</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-600 text-sm">
            The analytics data displayed is randomly generated or mock data for demonstration.
            Real analytics require robust backend integration with Firebase Firestore/Functions for data collection and aggregation.
            User authentication and authorization are critical for securing this dashboard in a production environment.
        </CardContent>
      </Card>
    </div>
  );
}
