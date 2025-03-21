import { useState, useEffect } from 'react';
import { FileText, Film, Music, Clock, AlertCircle, Plus } from 'lucide-react';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateMovieDialog } from '@/components/create-movie-dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
  totalScripts: number;
  completedMovies: number;
  audioMinutes: number;
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const isServerRunning = useServerStatus();
  const [stats, setStats] = useState<Stats>({
    totalScripts: 0,
    completedMovies: 0,
    audioMinutes: 0,
    processingTime: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreateMovieOpen, setIsCreateMovieOpen] = useState(false);

  useEffect(() => {
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
          completedMovies: userStats.movieCount || 0
        }));
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      }
    };

    fetchDashboardData();
  }, [isServerRunning, user]);



  const handleMovieCreated = () => {
    // Close the dialog first to prevent any state issues
    setIsCreateMovieOpen(false);
  };

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
          icon={Music}
          label="Audio Minutes"
          value={`${stats.audioMinutes} min`}
          color="border-purple-500"
        />
        <StatCard
          icon={Clock}
          label="Processing Time"
          value={`${stats.processingTime} hrs`}
          color="border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Activity Timeline</h2>
            <p className="text-gray-400">No recent activity</p>
          </div>
          
          <div className="bg-[#1A1A1A] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Movie</h2>
            <p className="text-gray-400 mb-6">Start your creative journey by creating a new movie project.</p>
            
            <Dialog open={isCreateMovieOpen} onOpenChange={setIsCreateMovieOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Movie
                </Button>
              </DialogTrigger>
              <CreateMovieDialog onClose={handleMovieCreated} navigate={navigate} />
            </Dialog>
          </div>
          <div className="bg-[#1A1A1A] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Create Content</h2>
            <p className="text-gray-400 mb-6">Create engaging short-form social media videos ranging from 30 seconds to 1 minute.</p>
            
            <Button className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
