import { useState, useEffect } from 'react';
import { FileText, Film, Layout, Clock, AlertCircle } from 'lucide-react';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useAuth } from '@/lib/auth';
import { UploadCard } from '@/components/upload-card';
import { GenerateScriptCard } from '@/components/generate-script-card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
  totalScripts: number;
  completedMovies: number;
  storyboardCount: number;
  processingTime: number;
}



function StatCard({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
  color: string;
}) {
  return (
    <div className={`bg-[#1A1A1A] rounded-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color.replace('border', 'bg')}/10`}>
          <Icon className={`w-6 h-6 ${color.replace('border', 'text')}`} />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const isServerRunning = useServerStatus();
  const [stats, setStats] = useState<Stats>({
    totalScripts: 0,
    completedMovies: 0,
    storyboardCount: 0,
    processingTime: 0
  });
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!isServerRunning || !user) return;

    try {
      // Get user stats from API
      const statsResponse = await fetch(`${API_URL}/api/user-stats/${user.id}`);
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch user stats');
      }
      const userStats = await statsResponse.json();

      setStats(prev => ({
        ...prev,
        totalScripts: userStats.scriptCount || 0,
        completedMovies: userStats.movieCount || 0,
        storyboardCount: userStats.storyboardCount || 0
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isServerRunning, user]);



  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[#FFA500]">Dashboard</h1>
        <p className="text-lg text-gray-300 mt-2">Overview of your movie creation progress</p>
      </div>

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to view dashboard data.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-md text-red-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FileText}
          label="Total Scripts"
          value={stats.totalScripts}
          color="border-[#1ABC9C]"
        />
        <StatCard
          icon={Film}
          label="Completed Movies"
          value={stats.completedMovies}
          color="border-[#FFA500]"
        />
        <StatCard
          icon={Layout}
          label="Total Storyboards"
          value={stats.storyboardCount}
          color="border-purple-500"
        />
        <StatCard
          icon={Clock}
          label="Processing Time"
          value={`${stats.processingTime} hrs`}
          color="border-blue-500"
        />
      </div>

      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Activity Timeline</h2>
        <p className="text-gray-400">No recent activity</p>
      </div>

      {/* Script Management Cards */}
      <div className="space-y-6">
        <UploadCard 
          onUploadComplete={(files) => {
            console.log('Files uploaded successfully:', files);
            fetchDashboardData();
          }}
        />
        <GenerateScriptCard />
      </div>
    </div>
  );
}
