
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, FileText, GraduationCap, AlertTriangle, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUserAnalyticsData, getReportInsightsData, type UserAnalyticsData, type ReportInsightsData, type AnalyticsActionState } from '@/app/admin-actions';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const initialUserAnalytics: UserAnalyticsData = {
  totalUsers: 0,
  newUsersThisWeek: 0,
  fieldsOfStudy: [],
  premiumVsFree: { premium: 0, free: 0 },
  topRecommendedPaths: [],
};

const initialReportInsights: ReportInsightsData = {
  totalReportsGenerated: 0,
  premiumReportsDownloaded: 0,
  averageSkillReadiness: 0,
  topDownloadedByField: [],
};

export function AnalyticsDashboard() {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData>(initialUserAnalytics);
  const [reportInsights, setReportInsights] = useState<ReportInsightsData>(initialReportInsights);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [userAnalyticsResult, reportInsightsResult] = await Promise.all([
          getUserAnalyticsData(),
          getReportInsightsData()
        ]);

        if (userAnalyticsResult.success && userAnalyticsResult.data) {
          setUserAnalytics(userAnalyticsResult.data as UserAnalyticsData);
        } else {
          const msg = userAnalyticsResult.message || 'Failed to load user analytics';
          console.error("User Analytics Error:", msg);
          // Don't toast for partial mock data messages
          if (!msg.includes("mock")) {
            toast({ title: 'Error Loading User Analytics', description: msg, variant: 'destructive' });
          }
          // Keep mock or previously fetched data on partial failure
        }

        if (reportInsightsResult.success && reportInsightsResult.data) {
          setReportInsights(reportInsightsResult.data as ReportInsightsData);
        } else {
          const msg = reportInsightsResult.message || 'Failed to load report insights';
          console.error("Report Insights Error:", msg);
          if (!msg.includes("mock")) {
            toast({ title: 'Error Loading Report Insights', description: msg, variant: 'destructive' });
          }
        }
      } catch (e: any) {
        console.error("Analytics Fetch Error:", e);
        const errorMessage = e.message || "An unexpected error occurred while fetching analytics data.";
        setError(errorMessage);
        toast({ title: 'Analytics Error', description: errorMessage, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2" /> Error Loading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <p className="mt-2 text-sm">Please try refreshing the page or check the server logs. Ensure your Supabase tables for analytics are correctly set up if this is not mock data.</p>
        </CardContent>
      </Card>
    );
  }

  const pieChartData = userAnalytics.fieldsOfStudy.length > 0 
    ? userAnalytics.fieldsOfStudy.map(field => ({ name: field.name, value: field.value }))
    : [{name: "No Data", value: 1}]; // Placeholder for empty pie chart
  
  const premiumRatio = userAnalytics.totalUsers > 0 ? (userAnalytics.premiumVsFree.premium / userAnalytics.totalUsers) * 100 : 0;

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
              <p className="text-xs text-muted-foreground">{userAnalytics.totalUsers > 0 ? "+5% from last month (mock)" : "Awaiting data..."}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users (This Week)</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userAnalytics.newUsersThisWeek.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{userAnalytics.newUsersThisWeek > 0 ? "Compared to last week (mock)" : "Awaiting data..."}</p>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium User Ratio</CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{premiumRatio.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {userAnalytics.premiumVsFree.premium} Premium / {userAnalytics.premiumVsFree.free} Free
                {userAnalytics.totalUsers === 0 && " (Awaiting data)"}
              </p>
            </CardContent>
          </Card>
           <Card className="shadow-lg md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Recommended Paths</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {userAnalytics.topRecommendedPaths.length > 0 ? (
                <ul className="space-y-1">
                  {userAnalytics.topRecommendedPaths.slice(0,3).map(path => (
                    <li key={path.name} className="flex justify-between">
                      <span>{path.name}</span>
                      <Badge variant="secondary">{path.count}</Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-muted-foreground">No path data yet.</p>}
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Most Common Fields of Study</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px]">
            {userAnalytics.fieldsOfStudy.length > 0 ? (
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
            ) : <p className="text-center text-muted-foreground py-10">No field of study data available.</p>}
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
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportInsights.totalReportsGenerated.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">{reportInsights.totalReportsGenerated > 0 ? "All types" : "Awaiting data..."}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Reports Generated</CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportInsights.premiumReportsDownloaded.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{reportInsights.premiumReportsDownloaded > 0 ? "Count of premium" : "Awaiting data..."}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Skill Readiness Score</CardTitle>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportInsights.averageSkillReadiness}%</div>
              <p className="text-xs text-muted-foreground">{reportInsights.averageSkillReadiness > 0 ? "Across premium reports" : "Awaiting data..."}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Top Reports Generated by Field of Study</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px]">
             {reportInsights.topDownloadedByField.length > 0 ? (
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
            ) : <p className="text-center text-muted-foreground py-10">No report by field data available.</p>}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-yellow-50 border-yellow-200 shadow-md mt-8 dark:bg-yellow-900/30 dark:border-yellow-700">
        <CardHeader className="flex flex-row items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-yellow-700 dark:text-yellow-300 text-base">Developer Note on Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-600 dark:text-yellow-300/90 text-sm space-y-2">
            <p>
              The analytics data is currently fetched from server actions that may return mock or partially real data.
              True real-time analytics require comprehensive backend integration:
            </p>
            <ul className="list-disc list-inside pl-4 text-xs">
              <li><strong>Data Logging:</strong> Implement logging for user sign-ups, report generations (free/premium), chosen fields of study, etc., into dedicated Supabase tables (e.g., `user_activity`, `report_logs`).</li>
              <li><strong>Supabase Queries:</strong> Update the server actions in `src/app/admin-actions.ts` (e.g., `getUserAnalyticsData`, `getReportInsightsData`) to execute actual SQL queries against your Supabase tables to aggregate and return real statistics.</li>
              <li><strong>RLS Policies:</strong> Ensure these new analytics tables have appropriate Row Level Security policies, restricting write access and allowing read access only for admin users via server actions.</li>
              <li><strong>User Privacy:</strong> Be mindful of user privacy when logging and displaying aggregated data.</li>
            </ul>
            <p className="mt-2">The current setup provides the UI structure and placeholder server actions to facilitate this integration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
