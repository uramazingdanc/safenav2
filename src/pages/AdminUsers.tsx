import { useState } from 'react';
import { Users, Search, Filter, MoreVertical, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllProfiles } from '@/hooks/useProfiles';
import { formatDistanceToNow } from 'date-fns';

const AdminUsers = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: profiles, isLoading } = useAllProfiles();

  const filteredUsers = profiles?.filter(profile => 
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.barangay?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'moderator': return 'bg-accent/10 text-accent';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.manageUsers}</h1>
            <p className="text-sm text-muted-foreground">{profiles?.length || 0} registered users</p>
          </div>
        </div>
        <Button>+ Add User</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
            </div>
          ) : (
            filteredUsers.map((user, index) => {
              const userRoles = (user as any).user_roles || [];
              const primaryRole = userRoles[0]?.role || 'user';
              
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 ${index !== filteredUsers.length - 1 ? 'border-b' : ''}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{user.full_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(primaryRole)}`}>
                        {primaryRole}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.barangay ? `Brgy. ${user.barangay}` : 'No barangay set'}
                    </p>
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
