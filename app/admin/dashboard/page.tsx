'use client';

import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, ShieldCheck, Users, Store, Bike, IndianRupee,
  TrendingUp, CheckCircle2, XCircle, LogOut, Plus, Percent, Wallet,
  UserCheck, Clock, Package, RotateCcw, RefreshCw, AlertTriangle, X,
  Settings, Activity, BarChart3, FileText, Mail, Phone, MapPin, Lock,
  Calendar, Shield, MoreVertical, Download, Filter, Search
} from 'lucide-react';
import { mockUsers, mockRestaurants, mockDeliveryPartners, mockPayouts, mockOrders } from '@/lib/mock-data';
import type { User, DeliveryPartner, Payout, Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SupportDesk } from '@/components/support-desk';
import { MenuManager } from '@/components/menu-manager';
import { getRestaurants, setRestaurants as persistRestaurants, getDeliveryPartners, setDeliveryPartners as persistDeliveryPartners, getOrders, setOrders as persistOrders, getTransactions, subscribeStore, addTransaction } from '@/lib/platform-store';
import { adminCreateAccount, sendAdminResetEmail } from '@/lib/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [restaurants, setRestaurantsState] = useState(mockRestaurants);
  const [deliveryPartners, setDeliveryPartnersState] = useState<DeliveryPartner[]>(mockDeliveryPartners);
  const [commissionRate, setCommissionRate] = useState(15);
  const [payouts, setPayouts] = useState<Payout[]>(mockPayouts);
  const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userEditData, setUserEditData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive' | 'pending' | 'suspended',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [orders, setAdminOrders] = useState(mockOrders);
  const [transactions, setTransactions] = useState(getTransactions());
  
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine: '',
    location: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    businessLicense: '',
    fssaiLicense: '',
    address: '',
    operatingHours: '',
    commissionRate: 15,
    password: '',
  });

  const [newDeliveryPartner, setNewDeliveryPartner] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Bike',
    licenseNumber: '',
    password: '',
  });

  useEffect(() => { const refresh=()=>{ setRestaurantsState(getRestaurants()); setDeliveryPartnersState(getDeliveryPartners()); setAdminOrders(getOrders()); setTransactions(getTransactions()); }; refresh(); return subscribeStore(refresh); }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCommission = mockOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const pendingApprovals = restaurants.filter((r) => r.status === 'pending').length;

  const approveRestaurant = (id: string) => {
    const next = restaurants.map((r) => r.id === id ? { ...r, status: 'approved' as const } : r);
    setRestaurantsState(next); persistRestaurants(next);
    setUsers((prev) => prev.map((u) => (u.id === 'u5' ? { ...u, status: 'active' as 'active' } : u)));
    toast.success('Restaurant approved successfully');
  };

  const suspendRestaurant = (id: string) => {
    const next = restaurants.map((r) => r.id === id ? { ...r, status: 'suspended' as const } : r);
    setRestaurantsState(next); persistRestaurants(next);
    toast.success('Restaurant suspended');
  };

  const permanentlyDeleteRestaurant = (id: string) => {
    if (!window.confirm('Permanently delete this restaurant? This cannot be undone.')) return;
    const next = restaurants.filter(r => r.id !== id);
    setRestaurantsState(next); persistRestaurants(next);
    toast.success('Restaurant permanently deleted');
  };

  const addDeliveryPartner = () => {
    const newPartner: DeliveryPartner = {
      id: `d${deliveryPartners.length + 1}`,
      name: 'New Delivery Partner',
      phone: '+91 90000 00000',
      email: 'newpartner@delivery.com',
      status: 'available' as 'available',
      totalDeliveries: 0,
      rating: 5.0,
      earnings: 0,
      vehicleType: 'Bike',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setDeliveryPartnersState((prev) => [...prev, newPartner]);
    toast.success('Delivery partner account created');
  };

  const updateCommission = (rate: number) => {
    setCommissionRate(rate);
    toast.success(`Default commission set to ${rate}%`);
  };

  const processPayout = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'processed' as const, processedAt: new Date().toISOString() } : p
      )
    );
    toast.success('Payout processed successfully');
  };

  const markAsPaid = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'paid' as const, paidAt: new Date().toISOString() } : p
      )
    );
    toast.success('Payout marked as paid successfully');
  };

  const revertPayout = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'pending' as const, processedAt: undefined, paidAt: undefined, revertedAt: new Date().toISOString() } : p
      )
    );
    toast.success('Payout reverted to pending status');
  };

  const manualProcessPayout = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'processed' as const, processedAt: new Date().toISOString() } : p
      )
    );
    toast.success('Payout manually processed');
  };

  const addRestaurantManual = async () => {
    const ownerEmail = newRestaurant.ownerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newRestaurant.name || !newRestaurant.ownerPhone || !ownerEmail || newRestaurant.password.length < 8) {
      toast.error('Please fill required fields and use a password of at least 8 characters');
      return;
    }
    if (!emailRegex.test(ownerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    let authUserId = `r${restaurants.length + 1}`;
    try {
      const result = await adminCreateAccount({ email: ownerEmail, password: newRestaurant.password, name: newRestaurant.ownerName, phone: newRestaurant.ownerPhone, role: 'restaurant', status: 'pending' });
      authUserId = result.user_id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create Supabase account');
      return;
    }

    const restaurant: Restaurant = {
      id: authUserId,
      name: newRestaurant.name,
      cuisine: newRestaurant.cuisine || 'Various',
      rating: 0,
      deliveryTime: '30-40 min',
      priceForTwo: 500,
      image: 'https://images.pexels.com/photos/260322/pexels-photo-260322.jpeg?auto=compress&cs=tinysrgb&w=400',
      coverImage: 'https://images.pexels.com/photos/260322/pexels-photo-260322.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'pending' as 'pending',
      location: newRestaurant.location || 'Location',
      menu: [],
      commissionRate: newRestaurant.commissionRate,
      ownerName: newRestaurant.ownerName,
      ownerPhone: newRestaurant.ownerPhone,
      ownerEmail,
      businessLicense: newRestaurant.businessLicense,
      fssaiLicense: newRestaurant.fssaiLicense,
      address: newRestaurant.address,
      operatingHours: newRestaurant.operatingHours,
    };

    const nextRestaurants = [...restaurants, restaurant];
    setRestaurantsState(nextRestaurants); persistRestaurants(nextRestaurants);
    
    const newUser: User = {
      id: `u${users.length + 1}`,
      name: newRestaurant.ownerName,
      email: ownerEmail,
      phone: newRestaurant.ownerPhone,
      role: 'restaurant' as 'restaurant',
      status: 'pending' as 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    
    setUsers((prev) => [...prev, newUser]);
    
    setRestaurantDialogOpen(false);
    setNewRestaurant({
      name: '',
      cuisine: '',
      location: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      businessLicense: '',
      fssaiLicense: '',
      address: '',
      operatingHours: '',
      commissionRate: 15,
      password: '',
    });
    toast.success('Restaurant added successfully');
  };

  const addDeliveryPartnerManual = async () => {
    const partnerEmail = newDeliveryPartner.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newDeliveryPartner.name || !newDeliveryPartner.phone || !partnerEmail || newDeliveryPartner.password.length < 8) {
      toast.error('Please fill required fields and use a password of at least 8 characters');
      return;
    }
    if (!emailRegex.test(partnerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    let authUserId = `d${deliveryPartners.length + 1}`;
    try {
      const result = await adminCreateAccount({ email: partnerEmail, password: newDeliveryPartner.password, name: newDeliveryPartner.name, phone: newDeliveryPartner.phone, role: 'delivery', status: 'active' });
      authUserId = result.user_id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create Supabase account');
      return;
    }

    const partner: DeliveryPartner = {
      id: authUserId,
      name: newDeliveryPartner.name,
      phone: newDeliveryPartner.phone,
      email: partnerEmail,
      status: 'available' as 'available',
      totalDeliveries: 0,
      rating: 5.0,
      earnings: 0,
      vehicleType: newDeliveryPartner.vehicleType,
      joinedAt: new Date().toISOString().split('T')[0],
      licenseNumber: newDeliveryPartner.licenseNumber,
      walletBalance: 0,
    };

    const nextPartners = [...deliveryPartners, partner];
    setDeliveryPartnersState(nextPartners); persistDeliveryPartners(nextPartners);
    
    const newUser: User = {
      id: `u${users.length + 1}`,
      name: newDeliveryPartner.name,
      email: partnerEmail,
      phone: newDeliveryPartner.phone,
      role: 'delivery' as 'delivery',
      status: 'active' as 'active',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    
    setUsers((prev) => [...prev, newUser]);
    
    setDeliveryDialogOpen(false);
    setNewDeliveryPartner({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'Bike',
      licenseNumber: '',
      password: '',
    });
    toast.success('Delivery partner added successfully');
  };

  const openUserEdit = (user: User) => {
    setSelectedUser(user);
    setUserEditData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address || '',
      status: user.status,
    });
    setUserDialogOpen(true);
  };

  const updateUser = () => {
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              name: userEditData.name,
              email: userEditData.email,
              phone: userEditData.phone,
              address: userEditData.address,
              status: userEditData.status,
            }
          : u
      )
    );

    setUserDialogOpen(false);
    setSelectedUser(null);
    toast.success('User updated successfully');
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success('User deleted successfully');
  };

  const getUserOrders = (userId: string) => {
    return mockOrders.filter((o) => {
      const user = users.find((u) => u.id === userId);
      return user && (o.customerName === user.name || o.customerPhone === user.phone);
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Admin Portal</p>
              <p className="text-xs text-muted-foreground">FoodDash Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2"><SupportDesk role="admin" userId="admin" /><Button variant="ghost" size="sm" onClick={() => router.push('/admin/login')}>
            <LogOut className="h-4 w-4" /> Logout
          </Button></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10">
                <Percent className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalCommission.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Commission</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApprovals}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/10">
                <Store className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{restaurants.length}</p>
                <p className="text-xs text-muted-foreground">Restaurants</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/10">
                <Bike className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveryPartners.length}</p>
                <p className="text-xs text-muted-foreground">Fleet</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-7">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-1.5">
              <Store className="h-4 w-4" /> Restaurants
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1.5">
              <Bike className="h-4 w-4" /> Fleet
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><Package className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="commission" className="gap-1.5">
              <Percent className="h-4 w-4" /> Commission
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-1.5">
              <Wallet className="h-4 w-4" /> Payouts
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> All Users
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="mr-1 h-4 w-4" /> Export
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="h-10 rounded-md border px-3"
                  >
                    <option value="all">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="restaurant">Restaurants</option>
                    <option value="delivery">Delivery</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 rounded-md border px-3"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Name</th>
                        <th className="pb-3 pr-4 font-medium">Contact</th>
                        <th className="pb-3 pr-4 font-medium">Role</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 pr-4 font-medium">Orders</th>
                        <th className="pb-3 pr-4 font-medium">Joined</th>
                        <th className="pb-3 pr-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{user.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="capitalize">{user.role}</Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={user.status === 'active' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}
                              className="capitalize"
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{user.totalOrders || getUserOrders(user.id).length}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{user.joinedAt}</td>
                          <td className="py-3 pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openUserEdit(user)}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                  <FileText className="mr-2 h-4 w-4" /> View Orders
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => { try { await sendAdminResetEmail(user.email); toast.success(`Password reset email sent to ${user.email}`); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to send reset email'); } }}>
                                  <Lock className="mr-2 h-4 w-4" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                  <Activity className="mr-2 h-4 w-4" /> Activity Log
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-destructive">
                                  <X className="mr-2 h-4 w-4" /> Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No users found matching your filters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Edit Dialog */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit User Profile</DialogTitle>
                </DialogHeader>
                {selectedUser && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="userName">Name</Label>
                        <Input
                          id="userName"
                          value={userEditData.name}
                          onChange={(e) => setUserEditData({ ...userEditData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="userPhone">Phone</Label>
                        <Input
                          id="userPhone"
                          value={userEditData.phone}
                          onChange={(e) => setUserEditData({ ...userEditData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="userEmail">Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={userEditData.email}
                        onChange={(e) => setUserEditData({ ...userEditData, email: e.target.value })}
                      />
                    </div>
                    <div className="rounded-lg border bg-secondary/30 p-3">
                      <p className="text-sm font-medium">Password security</p>
                      <p className="mt-1 text-xs text-muted-foreground">Passwords are never stored or shown in the dashboard. Supabase Auth stores a secure hash.</p>
                      <Button type="button" variant="outline" className="mt-3" onClick={async () => { try { await sendAdminResetEmail(selectedUser.email); toast.success(`Password reset email sent to ${selectedUser.email}`); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to send reset email'); } }}>Send Password Reset Email</Button>
                    </div>
                    <div>
                      <Label htmlFor="userAddress">Address</Label>
                      <Textarea
                        id="userAddress"
                        value={userEditData.address}
                        onChange={(e) => setUserEditData({ ...userEditData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="userStatus">Status</Label>
                      <select
                        id="userStatus"
                        value={userEditData.status}
                        onChange={(e) => setUserEditData({ ...userEditData, status: e.target.value as any })}
                        className="w-full h-10 rounded-md border px-3"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    
                    {/* User Orders Info */}
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <p className="mb-2 font-medium">User Order History</p>
                      <p className="text-sm text-muted-foreground">
                        Total Orders: {getUserOrders(selectedUser.id).length}
                      </p>
                      {getUserOrders(selectedUser.id).length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {getUserOrders(selectedUser.id).slice(0, 5).map((order) => (
                            <div key={order.id} className="text-xs text-muted-foreground">
                              {order.orderId} - ₹{order.total} - {order.status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={updateUser} className="flex-1">
                        Update User
                      </Button>
                      <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" /> Restaurant Partners
                  </CardTitle>
                  <Dialog open={restaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-1 h-4 w-4" /> Add Restaurant
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Restaurant Partner</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Restaurant Name *</Label>
                            <Input
                              id="name"
                              value={newRestaurant.name}
                              onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cuisine">Cuisine Type</Label>
                            <Input
                              id="cuisine"
                              value={newRestaurant.cuisine}
                              onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ownerName">Owner Name *</Label>
                            <Input
                              id="ownerName"
                              value={newRestaurant.ownerName}
                              onChange={(e) => setNewRestaurant({ ...newRestaurant, ownerName: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="ownerPhone">Owner Phone *</Label>
                            <Input
                              id="ownerPhone"
                              value={newRestaurant.ownerPhone}
                              onChange={(e) => setNewRestaurant({ ...newRestaurant, ownerPhone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="ownerEmail">Owner Email *</Label>
                          <Input
                            id="ownerEmail"
                            type="email"
                            value={newRestaurant.ownerEmail}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, ownerEmail: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerPassword">Login Password *</Label>
                          <Input id="ownerPassword" type="password" minLength={8} value={newRestaurant.password} onChange={(e) => setNewRestaurant({ ...newRestaurant, password: e.target.value })} placeholder="Minimum 8 characters" />
                          <p className="mt-1 text-xs text-muted-foreground">This creates the Supabase Auth login for the registered email.</p>
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={newRestaurant.location}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, location: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Full Address</Label>
                          <Textarea
                            id="address"
                            value={newRestaurant.address}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="businessLicense">Business License</Label>
                            <Input
                              id="businessLicense"
                              value={newRestaurant.businessLicense}
                              onChange={(e) => setNewRestaurant({ ...newRestaurant, businessLicense: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="fssaiLicense">FSSAI License</Label>
                            <Input
                              id="fssaiLicense"
                              value={newRestaurant.fssaiLicense}
                              onChange={(e) => setNewRestaurant({ ...newRestaurant, fssaiLicense: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="operatingHours">Operating Hours</Label>
                          <Input
                            id="operatingHours"
                            placeholder="e.g., 10:00 AM - 10:00 PM"
                            value={newRestaurant.operatingHours}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, operatingHours: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                          <Input
                            id="commissionRate"
                            type="number"
                            value={newRestaurant.commissionRate}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, commissionRate: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={addRestaurantManual} className="flex-1">
                            <Plus className="mr-2 h-4 w-4" /> Add Restaurant
                          </Button>
                          <Button variant="outline" onClick={() => setRestaurantDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {restaurants.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <img src={r.image} alt={r.name} className="h-12 w-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.cuisine} · {r.location}</p>
                        <p className="text-xs text-muted-foreground">Commission: {r.commissionRate}%</p>
                        {r.ownerName && <p className="text-xs text-muted-foreground">Owner: {r.ownerName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'}
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                      {r.status === 'pending' && (
                        <Button size="sm" onClick={() => approveRestaurant(r.id)}>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                        </Button>
                      )}
                      {r.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => suspendRestaurant(r.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Suspend
                        </Button>
                      )}
                      {r.status === 'suspended' && (
                        <Button size="sm" onClick={() => approveRestaurant(r.id)}><CheckCircle2 className="mr-1 h-4 w-4" /> Approve again</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => permanentlyDeleteRestaurant(r.id)}><X className="mr-1 h-4 w-4" /> Permanent Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle>Restaurant Menu Management</CardTitle></CardHeader><CardContent className="space-y-4">{restaurants.map(r => <MenuManager key={r.id} restaurantId={r.id} admin />)}</CardContent></Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card><CardHeader><CardTitle>All Orders · Admin Reconciliation</CardTitle></CardHeader><CardContent><div className="space-y-2">{orders.map(o => <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><b>{o.orderId}</b><p className="text-xs text-muted-foreground">{o.restaurantName} · {o.customerName} · {o.deliveryPartnerName || 'Unassigned'}</p></div><div className="flex items-center gap-2"><Badge variant={o.status==='cancelled'?'destructive':'outline'}>{o.status}</Badge><span className="font-semibold">₹{o.total}</span>{o.status!=='cancelled' && <Button size="sm" variant="outline" onClick={()=>{ const next=orders.map(x=>x.id===o.id?{...x,status:'cancelled' as const}:x); setAdminOrders(next); persistOrders(next); addTransaction({id:`TX-ADMIN-REV-${o.orderId}-${Date.now()}`,userId:o.restaurantId,userType:'restaurant',type:'refund',amount:Math.max(0,o.subtotal-o.commissionAmount),balance:0,description:'Admin cancellation • amount reverted',orderId:o.orderId,createdAt:new Date().toISOString()}); toast.success(`${o.orderId} cancelled and amount reverted`); }}>Cancel & Revert</Button>}</div></div>)}</div><h3 className="mt-6 mb-3 font-semibold">Platform Transaction Ledger</h3><div className="space-y-2">{transactions.slice(0,30).map(t=><div key={t.id} className="flex justify-between rounded-lg border p-3 text-sm"><span>{t.description} · {t.orderId || '—'} · {t.userType}</span><Badge variant={t.type==='credit'?'default':t.type==='refund'?'secondary':'destructive'}>{t.type} · ₹{t.amount}</Badge></div>)}</div></CardContent></Card>
          </TabsContent>

          {/* Delivery Fleet Tab */}
          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bike className="h-5 w-5" /> Delivery Fleet
                  </CardTitle>
                  <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-1 h-4 w-4" /> Add Partner
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Delivery Partner</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="partnerName">Partner Name *</Label>
                          <Input
                            id="partnerName"
                            value={newDeliveryPartner.name}
                            onChange={(e) => setNewDeliveryPartner({ ...newDeliveryPartner, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="partnerPhone">Phone *</Label>
                            <Input
                              id="partnerPhone"
                              value={newDeliveryPartner.phone}
                              onChange={(e) => setNewDeliveryPartner({ ...newDeliveryPartner, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="partnerEmail">Email *</Label>
                            <Input
                              id="partnerEmail"
                              type="email"
                              value={newDeliveryPartner.email}
                              onChange={(e) => setNewDeliveryPartner({ ...newDeliveryPartner, email: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="partnerPassword">Login Password *</Label>
                          <Input id="partnerPassword" type="password" minLength={8} value={newDeliveryPartner.password} onChange={(e) => setNewDeliveryPartner({ ...newDeliveryPartner, password: e.target.value })} placeholder="Minimum 8 characters" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="vehicleType">Vehicle Type</Label>
                            <select
                              id="vehicleType"
                              value={newDeliveryPartner.vehicleType}
                              onChange={(e) => setNewDeliveryPartner({ ...newDeliveryPartner, vehicleType: e.target.value })}
                              className="w-full h-10 rounded-md border px-3"
                            >
                              <option value="Bike">Bike</option>
                              <option value="Scooter">Scooter</option>
                              <option value="Cycle">Cycle</option>
                              <option value="Car">Car</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="licenseNumber">License Number</Label>
                            <Input
                              id="licenseNumber"
                              value={newDeliveryPartner.licenseNumber}
                              onChange={(e) => setNewDeliveryPartner({ ...newDeliveryPartner, licenseNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={addDeliveryPartnerManual} className="flex-1">
                            <Plus className="mr-2 h-4 w-4" /> Add Partner
                          </Button>
                          <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveryPartners.map((p) => (
                  <div key={p.id} onClick={() => setSelectedPartner(p)} className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border p-3 hover:bg-secondary/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Bike className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.phone} · {p.vehicleType}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.totalDeliveries} deliveries · ★ {p.rating}
                        </p>
                        {p.walletBalance !== undefined && (
                          <p className="text-xs text-muted-foreground">Wallet: ₹{p.walletBalance.toLocaleString('en-IN')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={p.status === 'available' ? 'default' : p.status === 'on_delivery' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <Dialog open={!!selectedPartner} onOpenChange={(v) => !v && setSelectedPartner(null)}>
            <DialogContent><DialogHeader><DialogTitle>{selectedPartner?.name} · Partner Details</DialogTitle></DialogHeader>
              {selectedPartner && <div className="space-y-3"><div className="rounded-lg bg-secondary/50 p-4"><p className="text-sm text-muted-foreground">Current status</p><Badge>{selectedPartner.status.replace('_',' ')}</Badge><p className="mt-3 text-sm">Wallet: <b>₹{(selectedPartner.walletBalance||selectedPartner.earnings||0).toLocaleString('en-IN')}</b></p></div>
              {orders.filter(o=>o.deliveryPartnerId===selectedPartner.id).slice(-1).map(o=><div key={o.id} className="rounded-lg border p-4"><p className="font-semibold">Last order: {o.orderId}</p><p className="text-sm">Amount: <b>₹{o.total}</b> · Status: {o.status}</p>{o.status!=='cancelled'&&<Button className="mt-3" variant="outline" onClick={()=>{const next=orders.map(x=>x.id===o.id?{...x,status:'cancelled' as const}:x);setAdminOrders(next);persistOrders(next);addTransaction({id:`TX-ADMIN-REV-${o.orderId}-${Date.now()}`,userId:o.restaurantId,userType:'restaurant',type:'refund',amount:Math.max(0,o.subtotal-o.commissionAmount),balance:0,description:'Admin cancellation • amount reverted',orderId:o.orderId,createdAt:new Date().toISOString()});toast.success('Order cancelled and amount reverted');}}>Cancel order & revert amount</Button>}</div>)}</div>}
            </DialogContent>
          </Dialog>

          {/* Commission Tab */}
          <TabsContent value="commission" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" /> Commission Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="mb-2 text-sm font-medium">Default Platform Commission Rate</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="w-16 text-center text-2xl font-bold text-primary">{commissionRate}%</span>
                  </div>
                  <Button className="mt-3" size="sm" onClick={() => updateCommission(commissionRate)}>
                    Apply to All Restaurants
                  </Button>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium">Per-Raurant Commission Rates</p>
                  <div className="space-y-2">
                    {restaurants.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="font-medium">{r.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={r.commissionRate}
                            onChange={(e) => {
                              setRestaurantsState((prev) =>
                                prev.map((rr) =>
                                  rr.id === r.id ? { ...rr, commissionRate: Number(e.target.value) } : rr
                                )
                              );
                            }}
                            className="h-8 w-16 rounded-md border px-2 text-center text-sm"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> Platform Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Partner</th>
                        <th className="pb-3 pr-4 font-medium">Type</th>
                        <th className="pb-3 pr-4 font-medium">Orders</th>
                        <th className="pb-3 pr-4 font-medium">Amount</th>
                        <th className="pb-3 pr-4 font-medium">Commission</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 pr-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{p.partnerName}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="capitalize">{p.type}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{p.orders}</td>
                          <td className="py-3 pr-4 font-semibold">₹{p.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 pr-4 text-muted-foreground">₹{p.commission.toLocaleString('en-IN')}</td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={p.status === 'paid' ? 'default' : p.status === 'processed' ? 'secondary' : p.status === 'failed' ? 'destructive' : 'outline'}
                              className="capitalize"
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex gap-1">
                              {p.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => processPayout(p.id)}>
                                    <RefreshCw className="mr-1 h-3 w-3" /> Process
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => manualProcessPayout(p.id)}>
                                    <UserCheck className="mr-1 h-3 w-3" /> Manual
                                  </Button>
                                </>
                              )}
                              {p.status === 'processed' && (
                                <>
                                  <Button size="sm" onClick={() => markAsPaid(p.id)}>
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Paid
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => revertPayout(p.id)}>
                                    <RotateCcw className="mr-1 h-3 w-3" /> Revert
                                  </Button>
                                </>
                              )}
                              {p.status === 'paid' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => revertPayout(p.id)}>
                                    <RotateCcw className="mr-1 h-3 w-3" /> Revert
                                  </Button>
                                  <span className="flex items-center gap-1 text-xs text-success">
                                    <CheckCircle2 className="h-3 w-3" /> Completed
                                  </span>
                                </>
                              )}
                              {p.status === 'failed' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => manualProcessPayout(p.id)}>
                                    <RefreshCw className="mr-1 h-3 w-3" /> Retry
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => revertPayout(p.id)}>
                                    <RotateCcw className="mr-1 h-3 w-3" /> Revert
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" /> Platform Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Platform Configuration</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Platform Name</Label>
                      <Input defaultValue="FoodDash" />
                    </div>
                    <div>
                      <Label>Support Email</Label>
                      <Input defaultValue="support@fooddash.com" />
                    </div>
                    <div>
                      <Label>Support Phone</Label>
                      <Input defaultValue="+91 90000 00000" />
                    </div>
                    <div>
                      <Label>Default Currency</Label>
                      <Input defaultValue="INR (₹)" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Minimum Order Amount</Label>
                      <Input type="number" defaultValue="100" />
                    </div>
                    <div>
                      <Label>Delivery Fee Range</Label>
                      <Input defaultValue="₹30 - ₹50" />
                    </div>
                    <div>
                      <Label>Tax Rate (%)</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    <div>
                      <Label>Refund Processing Time (days)</Label>
                      <Input type="number" defaultValue="7" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fleet Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Default Delivery Radius (km)</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    <div>
                      <Label>Delivery Partner Commission (%)</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                      </div>
                      <select className="h-9 rounded-md border px-3">
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>2 hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Shield className="mr-2 h-4 w-4" /> Save Settings
                  </Button>
                  <Button variant="outline">
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
