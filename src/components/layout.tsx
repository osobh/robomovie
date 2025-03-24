import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Home, FileText, Layers, Film, Theater as Theatre, LogOut, Code, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useWorkflow } from '@/lib/workflow';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  active?: boolean;
}

function NavItem({ to, icon, label, disabled, active }: NavItemProps) {
  return (
    <Link
      to={disabled ? '#' : to}
      className={cn(
        "flex items-center space-x-2 p-2 rounded-md transition-all",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2A2A2A]",
        active && "bg-[#2A2A2A]"
      )}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const { toggleDevMode, state } = useWorkflow();
  const isStepComplete = useStore((state) => state.isStepComplete);
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show sidebar on home page
  const isHomePage = location.pathname === '/';
  
  if (isHomePage || !isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      {/* Sidebar */}
      <nav className="w-64 bg-[#1A1A1A] p-4 space-y-4 relative">
        <div className="flex items-center space-x-2 mb-8">
          <Film className="w-8 h-8 text-[#FFA500]" />
          <span className="text-xl font-bold">robo.movie</span>
        </div>
        
        <NavItem
          to="/dashboard"
          icon={<Home className="w-5 h-5" />}
          label="Dashboard"
          active={location.pathname === '/dashboard'}
        />
        
        <NavItem
          to="/script"
          icon={<FileText className="w-5 h-5" />}
          label="Generate Script"
          active={location.pathname === '/script'}
        />
        
        <NavItem
          to="/storyboard"
          icon={<Layers className="w-5 h-5" />}
          label="Storyboarding"
          disabled={!isStepComplete('script')}
          active={location.pathname === '/storyboard'}
        />
        
        <NavItem
          to="/movie"
          icon={<Film className="w-5 h-5" />}
          label="Movie Editing"
          disabled={!isStepComplete('scene')}
          active={location.pathname === '/movie'}
        />
        
        
        <NavItem
          to="/theatre"
          icon={<Theatre className="w-5 h-5" />}
          label="Theatre"
          disabled={!isStepComplete('assembly')}
          active={location.pathname === '/theatre'}
        />

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button
            className={cn(
              "w-full text-white",
              state.devMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-[#2A2A2A] hover:bg-[#3A3A3A]"
            )}
            onClick={toggleDevMode}
          >
            <Code className="w-4 h-4 mr-2" />
            {state.devMode ? 'Dev Mode: ON' : 'Dev Mode: OFF'}
          </Button>
          
          <Button
            className="w-full bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>

          <Button
            className="w-full bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
