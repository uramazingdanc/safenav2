import { useState } from 'react';
import { Users, Search, Filter, MoreVertical, Eye, Trash2, CheckCircle, Radio, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeUsers } from '@/hooks/useRealtimeUsers';
import { useVerifyUser } from '@/hooks/useUnverifiedUsers';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const AdminUsers = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; userId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: profiles, isLoading } = useRealtimeUsers();
  const verifyUser = useVerifyUser();
  const queryClient = useQueryClient();

  // Filter users based on search and status
  const filteredUsers = profiles?.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.barangay?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'verified') return matchesSearch && user.is_verified;
    if (filterStatus === 'unverified') return matchesSearch && !user.is_verified;
    return matchesSearch;
  }) || [];

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

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-0">
        Unverified
      </Badge>
    );
  };

  const handleVerify = async (userId: string) => {
    try {
      await verifyUser.mutateAsync(userId);
      toast.success('User verified successfully');
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userToDelete.userId);
      
      if (profileError) throw profileError;

      // Delete from user_roles table
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.userId);

      // Delete hazard reports by this user
      await supabase
        .from('hazard_reports')
        .delete()
        .eq('reporter_id', userToDelete.userId);

      // Note: Deleting from auth.users requires admin privileges
      // This would need an edge function or admin action
      
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['realtime-users'] });
      
      toast.success(`User "${userToDelete.name}" has been removed`);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh] bg-command">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  const verifiedCount = profiles?.filter(u => u.is_verified).length || 0;
  const unverifiedCount = profiles?.filter(u => !u.is_verified).length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in bg-command min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-ocean/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-ocean" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t.manageUsers}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              {profiles?.length || 0} registered users • Real-time
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by name or barangay..." 
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Filter className="w-4 h-4 mr-2" />
              {filterStatus === 'all' ? 'All' : filterStatus === 'verified' ? 'Verified' : 'Unverified'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem 
              onClick={() => setFilterStatus('all')}
              className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              All Users
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setFilterStatus('verified')}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 cursor-pointer"
            >
              Verified Only
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setFilterStatus('unverified')}
              className="text-amber-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer"
            >
              Unverified Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                          <AvatarFallback className="bg-ocean/20 text-ocean text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.full_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 hidden md:table-cell">
                      {user.barangay || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300 hidden lg:table-cell">
                      {user.phone_number || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.is_verified)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getRoleBadge(user.role || 'user')}</TableCell>
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
                          {!user.is_verified && (
                            <DropdownMenuItem 
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 cursor-pointer"
                              onClick={() => handleVerify(user.user_id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-rose-400 hover:text-rose-300 hover:bg-slate-700 cursor-pointer"
                            onClick={() => setUserToDelete({ 
                              id: user.id, 
                              name: user.full_name, 
                              userId: user.user_id 
                            })}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
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
        <span>Total: {profiles?.length || 0}</span>
        <span className="text-emerald-400">Verified: {verifiedCount}</span>
        <span className="text-amber-400">Unverified: {unverifiedCount}</span>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete <strong className="text-white">"{userToDelete?.name}"</strong>? 
              This will permanently remove their profile, verification data, and all hazard reports they submitted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
