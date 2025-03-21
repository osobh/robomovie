import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Settings {
  id: string;
  user_id: string;
  preferred_llm: string;
  preferred_video_gen: string;
  openai_key: string | null;
  anthropic_key: string | null;
  deepseek_key: string | null;
  pika_key: string | null;
  runway_key: string | null;
  sora_key: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_channel: string | null;
}

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
];

const VIDEO_PROVIDERS = [
  { value: 'pika', label: 'Pika Labs' },
  { value: 'runway', label: 'Runway' },
  { value: 'sora', label: 'OpenAI Sora' },
];

export function Settings() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [preferredLLM, setPreferredLLM] = useState('openai');
  const [preferredVideoGen, setPreferredVideoGen] = useState('pika');
  
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    deepseek: '',
    pika: '',
    runway: '',
    sora: ''
  });

  const [socialNetworks, setSocialNetworks] = useState({
    twitter: '',
    instagram: '',
    youtube: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        // Load user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        if (userData) {
          setName(userData.full_name || '');
        }

        // Load settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        if (settingsData) {
          setPreferredLLM(settingsData.preferred_llm);
          setPreferredVideoGen(settingsData.preferred_video_gen);
          setApiKeys({
            openai: settingsData.openai_key || '',
            anthropic: settingsData.anthropic_key || '',
            deepseek: settingsData.deepseek_key || '',
            pika: settingsData.pika_key || '',
            runway: settingsData.runway_key || '',
            sora: settingsData.sora_key || ''
          });
          setSocialNetworks({
            twitter: settingsData.twitter_handle || '',
            instagram: settingsData.instagram_handle || '',
            youtube: settingsData.youtube_channel || ''
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: name,
          updated_at: new Date().toISOString()
        });

      if (userError) throw userError;

      // Update settings
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          preferred_llm: preferredLLM,
          preferred_video_gen: preferredVideoGen,
          openai_key: apiKeys.openai || null,
          anthropic_key: apiKeys.anthropic || null,
          deepseek_key: apiKeys.deepseek || null,
          pika_key: apiKeys.pika || null,
          runway_key: apiKeys.runway || null,
          sora_key: apiKeys.sora || null,
          twitter_handle: socialNetworks.twitter || null,
          instagram_handle: socialNetworks.instagram || null,
          youtube_channel: socialNetworks.youtube || null,
          updated_at: new Date().toISOString()
        });

      if (settingsError) throw settingsError;

      // Update user metadata in auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        data: { full_name: name }
      });

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ABC9C]" />
      </div>
    );
  }

  // Get the required API key fields based on selected providers
  const requiredApiKeys = [
    ...(preferredLLM === 'openai' ? ['openai'] : []),
    ...(preferredLLM === 'anthropic' ? ['anthropic'] : []),
    ...(preferredLLM === 'deepseek' ? ['deepseek'] : []),
    ...(preferredVideoGen === 'pika' ? ['pika'] : []),
    ...(preferredVideoGen === 'runway' ? ['runway'] : []),
    ...(preferredVideoGen === 'sora' ? ['sora'] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[#FFA500]">Settings</h1>
        <p className="text-lg text-gray-300 mt-2">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-md text-red-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Section */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              />
            </div>
          </div>
        </div>

        {/* Social Networks */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Social Networks</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="twitter">Twitter/X Handle</Label>
              <Input
                id="twitter"
                value={socialNetworks.twitter}
                onChange={(e) => setSocialNetworks(prev => ({ ...prev, twitter: e.target.value }))}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                id="instagram"
                value={socialNetworks.instagram}
                onChange={(e) => setSocialNetworks(prev => ({ ...prev, instagram: e.target.value }))}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube Channel</Label>
              <Input
                id="youtube"
                value={socialNetworks.youtube}
                onChange={(e) => setSocialNetworks(prev => ({ ...prev, youtube: e.target.value }))}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                placeholder="Channel URL"
              />
            </div>
          </div>
        </div>

        {/* AI Preferences */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">AI Preferences</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="llm">Preferred Language Model</Label>
              <Select value={preferredLLM} onValueChange={setPreferredLLM}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                  <SelectValue placeholder="Select LLM" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                  {LLM_PROVIDERS.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video">Preferred Video Generator</Label>
              <Select value={preferredVideoGen} onValueChange={setPreferredVideoGen}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                  <SelectValue placeholder="Select Video Generator" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                  {VIDEO_PROVIDERS.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">API Keys</h2>
          <div className="space-y-4">
            {requiredApiKeys.map(key => (
              <div key={key}>
                <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)} API Key</Label>
                <Input
                  id={key}
                  type="password"
                  value={apiKeys[key as keyof typeof apiKeys]}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white font-mono"
                  placeholder={`Enter your ${key} API key`}
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </div>
  );
}
