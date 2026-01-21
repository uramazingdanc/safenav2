import { useState } from 'react';
import { Users, Search, Filter, MoreVertical, Eye, KeyRound, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllProfiles } from '@/hooks/useProfiles';
import { MOCK_USERS, MockUser } from '@/data/mockAdminData';
import { formatDistanceToNow } from 'date-fns';

const AdminUsers = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: dbProfiles, isLoading } = useAllProfiles();

  // Use mock data if database is empty
  const profiles: MockUser[] = dbProfiles?.length 
    ? dbProfiles.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email || 'No email',
        barangay: p.barangay || '',
        phone_number: p.phone_number || '',
        status: 'verified' as const,
        created_at: p.created_at,
        role: (p as any).user_roles?.[0]?.role || 'user',
      }))
    : MOCK_USERS;

  const filteredUsers = profiles.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.barangay?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': 
        return <Badge className="bg-rose-500/20 text-rose-400 border-0">Admin</Badge>;
      case 'moderator': 
        return <Badge className="bg-amber-500/20 text-amber-400 border-0">Moderator</Badge>;
      default: 
        return <Badge className="bg-slate-500/20 text-slate-400 border-0">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-500/20 text-slate-400 border-0">
        Unverified
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in bg-[#0f172a] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t.manageUsers}</h1>
            <p className="text-sm text-slate-400">{profiles.length} registered users</p>
          </div>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          + Add User
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by name, email, or barangay..." 
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Barangay</TableHead>
                <TableHead className="text-slate-400 hidden lg:table-cell">Phone</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Role</TableHead>
                <TableHead className="text-slate-400 hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 hidden md:table-cell">
                      {user.barangay || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300 hidden lg:table-cell">
                      {user.phone_number || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-slate-400 text-sm hidden lg:table-cell">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                            <KeyRound className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-400 hover:text-rose-300 hover:bg-slate-700 cursor-pointer">
                            <Ban className="w-4 h-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-slate-400">
        <span>Total: {profiles.length}</span>
        <span>Verified: {profiles.filter(u => u.status === 'verified').length}</span>
        <span>Unverified: {profiles.filter(u => u.status === 'unverified').length}</span>
      </div>
    </div>
  );
};

export default AdminUsers;
