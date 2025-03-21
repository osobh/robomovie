import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Link, useNavigate } from 'react-router-dom';

export function Navbar() {
  const { isAuthenticated, user } = useStore((state) => state.auth);
  const signOut = useStore((state) => state.signOut);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              RoboMovie
            </span>
          </Link>
          {isAuthenticated && (
            <nav className="gap-6 text-sm font-medium">
              <Link
                to="/dashboard"
                className="transition-colors hover:text-foreground/80"
              >
                Dashboard
              </Link>
              <Link
                to="/settings"
                className="transition-colors hover:text-foreground/80"
              >
                Settings
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-auto flex-1 md:w-auto md:flex-none">
            {isAuthenticated ? (
              <div className="flex items-center">
                <span className="mr-4">
                  {user?.email}
                </span>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
