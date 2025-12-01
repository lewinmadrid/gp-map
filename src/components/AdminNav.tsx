import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

export default function AdminNav() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roles);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isAdmin) return null;

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <Button asChild variant="secondary" size="sm">
        <Link to="/admin">
          <Settings className="h-4 w-4 mr-2" />
          Admin Panel
        </Link>
      </Button>
      <Button onClick={handleLogout} variant="outline" size="sm">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
