import { Users, Search, Filter, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminUsers = () => {
  const { t } = useLanguage();

  const users = [
    { id: 1, name: 'Juan Dela Cruz', email: 'juan@email.com', role: 'user', status: 'active', joined: 'Jan 2024' },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', role: 'user', status: 'active', joined: 'Feb 2024' },
    { id: 3, name: 'Pedro Garcia', email: 'pedro@email.com', role: 'responder', status: 'active', joined: 'Dec 2023' },
    { id: 4, name: 'Ana Reyes', email: 'ana@email.com', role: 'admin', status: 'active', joined: 'Nov 2023' },
    { id: 5, name: 'Jose Cruz', email: 'jose@email.com', role: 'user', status: 'inactive', joined: 'Mar 2024' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.manageUsers}</h1>
            <p className="text-sm text-muted-foreground">{users.length} registered users</p>
          </div>
        </div>
        <Button>+ Add User</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-4 ${index !== users.length - 1 ? 'border-b' : ''}`}
            >
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                    user.role === 'responder' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="hidden md:block text-sm text-muted-foreground">
                {user.joined}
              </div>
              <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
