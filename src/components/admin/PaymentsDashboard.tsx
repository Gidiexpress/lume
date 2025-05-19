
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, CreditCard, TrendingUp, ListChecks, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockRevenueDataDaily = [
  { date: 'Mon', revenue: 2000 }, { date: 'Tue', revenue: 3500 }, { date: 'Wed', revenue: 1500 },
  { date: 'Thu', revenue: 5000 }, { date: 'Fri', revenue: 4500 }, { date: 'Sat', revenue: 6000 },
  { date: 'Sun', revenue: 3000 },
];
const mockRevenueDataWeekly = [
  { week: 'W1', revenue: 15000 }, { week: 'W2', revenue: 17500 }, { week: 'W3', revenue: 16000 },
  { week: 'W4', revenue: 20000 },
];


const mockTransactions = [
  { id: 'txn_123', date: '2024-05-19', amount: 1000, method: 'Card', status: 'Successful', user: 'userA@example.com' },
  { id: 'txn_124', date: '2024-05-19', amount: 1000, method: 'Transfer', status: 'Successful', user: 'userB@example.com' },
  { id: 'txn_125', date: '2024-05-18', amount: 1000, method: 'Card', status: 'Successful', user: 'userC@example.com' },
  { id: 'txn_126', date: '2024-05-18', amount: 1000, method: 'Card', status: 'Pending', user: 'userD@example.com' },
  { id: 'txn_127', date: '2024-05-17', amount: 1000, method: 'Transfer', status: 'Failed', user: 'userE@example.com' },
];

export function PaymentsDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState({ card: 0, transfer: 0 });
  const [revenueTrendData, setRevenueTrendData] = useState(mockRevenueDataDaily);
  const [timeRange, setTimeRange] = useState('daily');
  const [transactions, setTransactions] = useState(mockTransactions);

  useEffect(() => {
    // Simulate fetching and calculating data
    const successfulTransactions = mockTransactions.filter(t => t.status === 'Successful');
    const revenue = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
    setTotalRevenue(revenue);

    const methods = successfulTransactions.reduce((acc, t) => {
      if (t.method === 'Card') acc.card++;
      if (t.method === 'Transfer') acc.transfer++;
      return acc;
    }, { card: 0, transfer: 0 });
    setPaymentMethods(methods);

    setRevenueTrendData(timeRange === 'daily' ? mockRevenueDataDaily : mockRevenueDataWeekly);

  }, [timeRange]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold flex items-center">
        <DollarSign className="mr-3 h-7 w-7 text-primary" />
        Payments Overview (Monnify Simulated)
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From premium reports (mock)</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments by Method</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Card: {paymentMethods.card}</div>
            <div className="text-lg font-bold">Transfer: {paymentMethods.transfer}</div>
            <p className="text-xs text-muted-foreground">Successful transactions (mock)</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction Value</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦1,000</div>
            <p className="text-xs text-muted-foreground">Per premium report (fixed)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>Mock data showing daily/weekly revenue from premium reports.</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value)}>
            <SelectTrigger className="w-full md:w-[180px] mt-4 md:mt-0">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="h-[300px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeRange === 'daily' ? 'date' : 'week'} />
              <YAxis tickFormatter={(value) => `₦${value/1000}k`} />
              <Tooltip formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ListChecks className="mr-2 h-5 w-5" />
            Recent Transactions (Mock)
          </CardTitle>
          <CardDescription>Showing last 5 simulated transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>₦{txn.amount.toLocaleString()}</TableCell>
                  <TableCell>{txn.method}</TableCell>
                  <TableCell>{txn.user}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={txn.status === 'Successful' ? 'default' : txn.status === 'Pending' ? 'secondary' : 'destructive'}
                      className={txn.status === 'Successful' ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 
                                 txn.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                                 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                }
                    >
                      {txn.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200 shadow-md dark:bg-yellow-900/30 dark:border-yellow-700">
        <CardHeader className="flex flex-row items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-yellow-700 dark:text-yellow-300 text-base">Developer Note</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-600 dark:text-yellow-300/90 text-sm">
            Payment data is entirely mocked. Real Monnify integration requires backend setup for handling webhooks, secure transaction verification, and storing payment records in Firebase Firestore.
            Firebase Functions would be used to securely interact with Monnify APIs and log payment details.
        </CardContent>
      </Card>
    </div>
  );
}
