import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Clock, Users, TrendingUp } from "lucide-react";

interface SessionStats {
  totalSessions: number;
  avgDuration: number;
  activeUsers: number;
  todaySessions: number;
}

interface FeatureUsage {
  action_type: string;
  count: number;
}

interface ActivityLog {
  id: string;
  user_email: string;
  action_type: string;
  action_data: any;
  created_at: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(193 76% 58%)',
  'hsl(210 20% 45%)',
  'hsl(160 60% 50%)',
  'hsl(30 80% 55%)',
];

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    avgDuration: 0,
    activeUsers: 0,
    todaySessions: 0,
  });
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSessionStats(),
        loadFeatureUsage(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async () => {
    try {
      // Total sessions
      const { count: totalSessions } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true });

      // Average duration
      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("duration_minutes")
        .not("duration_minutes", "is", null);

      const avgDuration = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / sessions.length)
        : 0;

      // Active users (unique user_ids)
      const { data: activeUsersData } = await supabase
        .from("user_sessions")
        .select("user_id");

      const activeUsers = activeUsersData
        ? new Set(activeUsersData.map(s => s.user_id)).size
        : 0;

      // Today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todaySessions } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true })
        .gte("login_at", today.toISOString());

      setSessionStats({
        totalSessions: totalSessions || 0,
        avgDuration,
        activeUsers,
        todaySessions: todaySessions || 0,
      });
    } catch (error) {
      console.error("Error loading session stats:", error);
    }
  };

  const loadFeatureUsage = async () => {
    try {
      const { data } = await supabase
        .from("user_activity_logs")
        .select("action_type");

      if (data) {
        const usage = data.reduce((acc: { [key: string]: number }, log) => {
          acc[log.action_type] = (acc[log.action_type] || 0) + 1;
          return acc;
        }, {});

        const formattedUsage = Object.entries(usage)
          .map(([action_type, count]) => ({
            action_type: action_type.replace(/_/g, ' '),
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setFeatureUsage(formattedUsage);
      }
    } catch (error) {
      console.error("Error loading feature usage:", error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from("user_activity_logs")
        .select(`
          id,
          action_type,
          action_data,
          created_at,
          user_id
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        // Fetch user emails
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        const emailMap = profiles?.reduce((acc, p) => {
          acc[p.id] = p.email;
          return acc;
        }, {} as { [key: string]: string }) || {};

        const formattedActivity = data.map(log => ({
          id: log.id,
          user_email: emailMap[log.user_id] || "Unknown",
          action_type: log.action_type,
          action_data: log.action_data,
          created_at: log.created_at,
        }));

        setRecentActivity(formattedActivity);
      }
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.avgDuration} min</div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.todaySessions}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Used Features</CardTitle>
            <CardDescription>Top 10 features by usage count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="action_type" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Distribution</CardTitle>
            <CardDescription>Usage breakdown by feature type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureUsage.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ action_type, percent }) => 
                    `${action_type}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                >
                  {featureUsage.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest 20 user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.user_email}</TableCell>
                  <TableCell>{log.action_type.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.action_data && Object.keys(log.action_data).length > 0
                      ? JSON.stringify(log.action_data).slice(0, 50) + '...'
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
