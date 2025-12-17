import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { authApi, mapAuthResponseToUser } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.register(formData);
      const { user, token } = mapAuthResponseToUser(response, formData.email);
      setAuth(user, token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      toast.error(axiosError.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/dashboard-hero-bg_variant_2.jpg"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <Card className="glass-panel p-8 w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Get Started</h1>
          <p className="text-muted-foreground">Create your CRM Escort account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
