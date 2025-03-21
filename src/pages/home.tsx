import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Film, Music, Clock } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/lib/auth';
import { AuthDialog } from '@/components/auth-dialog';

export function Home() {
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Navigation */}
      <nav className="absolute top-0 right-0 p-6 flex gap-4">
        {!isAuthenticated && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent border-[#1ABC9C] text-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white">
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
            </DialogTrigger>
            <AuthDialog />
          </Dialog>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80")',
            backgroundBlendMode: 'overlay'
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold mb-6 text-white">
              Transform Your Scripts into Movies with AI
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Create stunning visual stories in minutes using advanced AI technology.
              From script to screen, we handle every step of the movie-making process.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
                >
                  Start Creating
                </Button>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[#FFA500]">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-[#2A2A2A] p-8 rounded-lg cursor-pointer hover:bg-[#3A3A3A] transition-colors">
                  <FileText className="w-12 h-12 text-[#1ABC9C] mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Script Processing</h3>
                  <p className="text-gray-400">Upload your script or let our AI generate one. We'll analyze and break it down into detailed scenes.</p>
                </div>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-[#2A2A2A] p-8 rounded-lg cursor-pointer hover:bg-[#3A3A3A] transition-colors">
                  <Film className="w-12 h-12 text-[#1ABC9C] mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Visual Creation</h3>
                  <p className="text-gray-400">Transform your scenes into stunning visual content using state-of-the-art AI technology.</p>
                </div>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-[#2A2A2A] p-8 rounded-lg cursor-pointer hover:bg-[#3A3A3A] transition-colors">
                  <Music className="w-12 h-12 text-[#1ABC9C] mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Audio Integration</h3>
                  <p className="text-gray-400">Add professional sound effects and music to bring your story to life.</p>
                </div>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Movie Length Packages */}
      <div className="py-20 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[#FFA500]">Available Movie Lengths</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-[#1A1A1A] p-8 rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors border-2 border-[#1ABC9C]/20">
                  <Clock className="w-12 h-12 text-[#1ABC9C] mb-4" />
                  <h3 className="text-2xl font-bold mb-2 text-white">Short Film</h3>
                  <div className="text-4xl font-bold text-[#1ABC9C] mb-4">5 Minutes</div>
                  <ul className="text-gray-400 space-y-2 mb-6">
                    <li>Perfect for social media</li>
                    <li>Quick story concepts</li>
                    <li>Ideal for advertisements</li>
                    <li>Fast turnaround time</li>
                  </ul>
                  <Button className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white">Get Started</Button>
                </div>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-[#1A1A1A] p-8 rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors border-2 border-[#FFA500]/20 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#FFA500] text-black px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
                  </div>
                  <Clock className="w-12 h-12 text-[#FFA500] mb-4" />
                  <h3 className="text-2xl font-bold mb-2 text-white">Medium Length</h3>
                  <div className="text-4xl font-bold text-[#FFA500] mb-4">15 Minutes</div>
                  <ul className="text-gray-400 space-y-2 mb-6">
                    <li>Detailed storytelling</li>
                    <li>Multiple scene support</li>
                    <li>Character development</li>
                    <li>Enhanced visual effects</li>
                  </ul>
                  <Button className="w-full bg-[#FFA500] hover:bg-[#FFA500]/90 text-white">Get Started</Button>
                </div>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-[#1A1A1A] p-8 rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors border-2 border-purple-500/20">
                  <Clock className="w-12 h-12 text-purple-500 mb-4" />
                  <h3 className="text-2xl font-bold mb-2 text-white">Feature Length</h3>
                  <div className="text-4xl font-bold text-purple-500 mb-4">30 Minutes</div>
                  <ul className="text-gray-400 space-y-2 mb-6">
                    <li>Complex narratives</li>
                    <li>Advanced scene transitions</li>
                    <li>Premium visual effects</li>
                    <li>Full creative control</li>
                  </ul>
                  <Button className="w-full bg-purple-500 hover:bg-purple-500/90 text-white">Get Started</Button>
                </div>
              </DialogTrigger>
              <AuthDialog />
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
