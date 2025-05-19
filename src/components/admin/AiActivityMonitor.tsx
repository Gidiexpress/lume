
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Zap, AlertOctagon, Clock, BarChartBig, AlertTriangle } from 'lucide-react';

const mockAiActivityData = {
  completionsToday: [
    { name: 'Gemini', count: 150 },
    { name: 'Groq (Simulated)', count: 65 }, // Assuming Groq was active
  ],
  avgResponseTime: 2.5, // seconds
  errorCountToday: 3,
  commonFailures: [
    { error: 'SchemaMismatch', count: 2 },
    { error: 'Timeout', count: 1 },
  ],
  dailyCompletionsTrend: [
    { day: 'Mon', completions: 200 }, { day: 'Tue', completions: 220 }, { day: 'Wed', completions: 180 },
    { day: 'Thu', completions: 250 }, { day: 'Fri', completions: 230 }, { day: 'Sat', completions: 190 },
    { day: 'Sun', completions: 215 },
  ]
};

export function AiActivityMonitor() {
  const [activityData, setActivityData] = useState(mockAiActivityData);

  useEffect(() => {
    // Simulate fetching data or updates
  }, []);

  const totalCompletions = activityData.completionsToday.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold flex items-center">
        <BrainCircuit className="mr-3 h-7 w-7 text-primary" />
        AI Activity Monitor
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Completions (Today)</CardTitle>
            <Zap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletions}</div>
            {activityData.completionsToday.map(api => (
              <p key={api.name} className="text-xs text-muted-foreground">{api.name}: {api.count}</p>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityData.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">Across all models (mock)</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Count (Today)</CardTitle>
            <AlertOctagon className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityData.errorCountToday}</div>
             <p className="text-xs text-muted-foreground">
              {activityData.commonFailures.map(f => `${f.error}: ${f.count}`).join(', ') || 'No major failures'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChartBig className="mr-2 h-5 w-5"/>
            Daily AI Completions Trend (Last 7 Days)
          </CardTitle>
          <CardDescription>Mock data showing total AI completions per day.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData.dailyCompletionsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}/>
              <Legend />
              <Line type="monotone" dataKey="completions" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
       <Card className="bg-yellow-50 border-yellow-200 shadow-md dark:bg-yellow-900/30 dark:border-yellow-700">
        <CardHeader className="flex flex-row items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-yellow-700 dark:text-yellow-300 text-base">Developer Note</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-600 dark:text-yellow-300/90 text-sm">
            AI activity data is mocked. Real monitoring would involve logging AI API calls (e.g., via Genkit inspection or custom logging) and storing/querying this data from a backend like Firebase Firestore or a dedicated logging service.
            Firebase Functions could be used to aggregate and process these logs.
        </CardContent>
      </Card>
    </div>
  );
}
