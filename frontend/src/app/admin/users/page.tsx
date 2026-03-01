'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { Search, Edit, Trash2, ChevronDown, ChevronUp, Phone, Mail, MapPin, Calendar, Briefcase, FileText, MessageSquare, User as UserIcon, Users, Hammer, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  role: string;
  phone: string;
  email?: string;
  fullName: string;
  city: string;
  status: string;
  rating: number;
  completedOrders: number;
  ordersCount?: number;
  createdAt: string;
  messengers?: { max?: string; telegram?: string };
  balance?: {
    amount: number;
    bonusAmount: number;
  };
  subscription?: {
    tariffType: string;
    expiresAt: string;
  };
}

interface FinancialEntry {
  id: string;
  amount: number | string;
  description: string;
  createdAt: string;
  purpose?: string;
  type?: string;
}

interface UserActivity {
  user: {
    id: string;
    role: string;
    phone: string;
    email?: string;
    fullName: string;
    city: string;
    messengers?: any;
    createdAt: string;
    status: string;
  };
  stats: {
    ordersThisMonth?: number;
    ordersTotal?: number;
    activeOrders?: number;
    completedOrders?: number;
    completedThisMonth?: number;
    completedTotal?: number;
    inProgressOrders?: number;
    responsesThisMonth?: number;
    responsesTotal?: number;
  };
  financial?: {
    payments: FinancialEntry[];
    transactions: FinancialEntry[];
    totalTopUps: number;
    totalSpent: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<{ [key: string]: UserActivity }>({});
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const data = await adminApi.getUsers(params);
      setUsers(data.users || data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }
    try {
      await adminApi.deleteUser(userId);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка удаления пользователя');
    }
  };

  const handleToggleExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    if (!activityData[userId]) {
      try {
        setLoadingActivity(userId);
        const data = await adminApi.getUserActivity(userId);
        setActivityData(prev => ({ ...prev, [userId]: data }));
      } catch (error) {
        console.error('Failed to load user activity:', error);
      } finally {
        setLoadingActivity(null);
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.phone.includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const getRoleBadge = (role: string) => {
    const colors: any = {
      ADMIN: 'bg-red-100 text-red-800',
      EXECUTOR: 'bg-blue-100 text-blue-800',
      CUSTOMER: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      BLOCKED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'EXECUTOR') return 'Исполнитель';
    if (role === 'CUSTOMER') return 'Заказчик';
    return 'Админ';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ACTIVE') return 'Активен';
    if (status === 'PENDING') return 'Модерация';
    return 'Заблокирован';
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: any = {
      TOP_UP: 'Пополнение',
      RESPONSE_FEE: 'Отклик на заказ',
      ORDER_FEE: 'Комиссия за заказ',
      SUBSCRIPTION: 'Подписка',
      BONUS: 'Бонус',
      REFUND: 'Возврат',
    };
    return labels[type] || type;
  };

  const executorCount = filteredUsers.filter(u => u.role === 'EXECUTOR').length;
  const customerCount = filteredUsers.filter(u => u.role === 'CUSTOMER').length;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Управление пользователями</h1>
        <p className="text-muted-foreground mt-2">
          Просмотр и редактирование пользователей платформы
        </p>
      </div>

      {/* Quick role filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={roleFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRoleFilter('all')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Все <span className="text-xs opacity-70">({users.length})</span>
        </Button>
        <Button
          variant={roleFilter === 'EXECUTOR' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRoleFilter('EXECUTOR')}
          className="gap-2"
        >
          <Hammer className="h-4 w-4" />
          Исполнители
        </Button>
        <Button
          variant={roleFilter === 'CUSTOMER' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRoleFilter('CUSTOMER')}
          className="gap-2"
        >
          <UserIcon className="h-4 w-4" />
          Заказчики
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени, телефону, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="ACTIVE">Активные</SelectItem>
                <SelectItem value="PENDING">На модерации</SelectItem>
                <SelectItem value="BLOCKED">Заблокированные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Пользователи ({filteredUsers.length})</span>
            <div className="flex gap-3 text-sm font-normal text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Исп: {executorCount}
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Зак: {customerCount}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Пользователи не найдены</div>
          ) : (
            <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Заказы</TableHead>
                  <TableHead>Рейтинг</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <>
                    <TableRow 
                      key={user.id} 
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${expandedUserId === user.id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => handleToggleExpand(user.id)}
                    >
                      <TableCell className="w-8 pr-0">
                        {expandedUserId === user.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </TableCell>
                      <TableCell>{user.city}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">
                          {user.ordersCount ?? '—'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {user.role === 'CUSTOMER' ? 'разм.' : user.role === 'EXECUTOR' ? 'вып.' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.role === 'EXECUTOR' && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span>{user.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Row */}
                    {expandedUserId === user.id && (
                      <TableRow key={`${user.id}-detail`} className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableCell colSpan={9} className="p-0">
                          <div className="px-6 py-4">
                            {loadingActivity === user.id ? (
                              <div className="flex items-center justify-center py-6">
                                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-3" />
                                <span className="text-sm text-muted-foreground">Загрузка...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Contacts */}
                                <div className="bg-white rounded-xl border p-4 space-y-3">
                                  <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                                    <Phone className="h-4 w-4 text-blue-500" />
                                    Контакты
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>{user.phone}</span>
                                    </div>
                                    {user.email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{user.email}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>{user.city}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    {user.balance && (
                                      <div className="pt-2 border-t mt-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground">Баланс:</span>
                                          <span className="font-medium">{parseFloat(user.balance.amount.toString()).toFixed(2)} ₽</span>
                                          {parseFloat(user.balance.bonusAmount.toString()) > 0 && (
                                            <span className="text-green-600 text-xs">+{parseFloat(user.balance.bonusAmount.toString()).toFixed(2)} бонус</span>
                                          )}
                                        </div>
                                        {user.subscription && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-muted-foreground">Тариф:</span>
                                            <span className="font-medium">{user.subscription.tariffType}</span>
                                            <span className="text-xs text-muted-foreground">до {new Date(user.subscription.expiresAt).toLocaleDateString('ru-RU')}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Activity Stats */}
                                <div className="bg-white rounded-xl border p-4 space-y-3">
                                  <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                                    <Briefcase className="h-4 w-4 text-violet-500" />
                                    Статистика активности
                                  </h4>
                                  {activityData[user.id] ? (
                                    user.role === 'CUSTOMER' ? (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-blue-700">
                                            {activityData[user.id].stats.ordersThisMonth ?? 0}
                                          </div>
                                          <div className="text-xs text-blue-600 mt-1">Заказов за месяц</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-gray-700">
                                            {activityData[user.id].stats.ordersTotal ?? 0}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">Заказов всего</div>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-yellow-700">
                                            {activityData[user.id].stats.activeOrders ?? 0}
                                          </div>
                                          <div className="text-xs text-yellow-600 mt-1">Активных</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-green-700">
                                            {activityData[user.id].stats.completedOrders ?? 0}
                                          </div>
                                          <div className="text-xs text-green-600 mt-1">Завершённых</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-blue-700">
                                            {activityData[user.id].stats.completedThisMonth ?? 0}
                                          </div>
                                          <div className="text-xs text-blue-600 mt-1">Выполнено за месяц</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-gray-700">
                                            {activityData[user.id].stats.completedTotal ?? 0}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">Выполнено всего</div>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-yellow-700">
                                            {activityData[user.id].stats.inProgressOrders ?? 0}
                                          </div>
                                          <div className="text-xs text-yellow-600 mt-1">В работе</div>
                                        </div>
                                        <div className="bg-violet-50 rounded-lg p-3 text-center">
                                          <div className="text-2xl font-bold text-violet-700">
                                            {activityData[user.id].stats.responsesThisMonth ?? 0}
                                          </div>
                                          <div className="text-xs text-violet-600 mt-1">Откликов за месяц</div>
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                      Не удалось загрузить статистику
                                    </div>
                                  )}
                                </div>

                                {/* Financial History */}
                                <div className="bg-white rounded-xl border p-4 space-y-3">
                                  <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    Финансы
                                  </h4>
                                  {activityData[user.id]?.financial ? (
                                    <>
                                      <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-green-50 rounded-lg p-2 text-center">
                                          <div className="text-lg font-bold text-green-700">
                                            {activityData[user.id].financial!.totalTopUps.toFixed(0)} ₽
                                          </div>
                                          <div className="text-[10px] text-green-600">Пополнено</div>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-2 text-center">
                                          <div className="text-lg font-bold text-red-700">
                                            {activityData[user.id].financial!.totalSpent.toFixed(0)} ₽
                                          </div>
                                          <div className="text-[10px] text-red-600">Потрачено</div>
                                        </div>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                                        {/* Combine and sort by date */}
                                        {[
                                          ...activityData[user.id].financial!.payments.map(p => ({
                                            ...p,
                                            isPayment: true,
                                            amt: parseFloat(p.amount.toString()),
                                            date: new Date(p.createdAt),
                                          })),
                                          ...activityData[user.id].financial!.transactions.map(t => ({
                                            ...t,
                                            isPayment: false,
                                            amt: parseFloat(t.amount.toString()),
                                            date: new Date(t.createdAt),
                                          })),
                                        ]
                                          .sort((a, b) => b.date.getTime() - a.date.getTime())
                                          .slice(0, 20)
                                          .map((entry, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                {entry.amt > 0 ? (
                                                  <ArrowUpRight className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                ) : (
                                                  <ArrowDownRight className="h-3 w-3 text-red-500 flex-shrink-0" />
                                                )}
                                                <span className="truncate">
                                                  {entry.isPayment ? 'Пополнение' : getTransactionTypeLabel((entry as any).type || '')}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                <span className={`font-medium ${entry.amt > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                  {entry.amt > 0 ? '+' : ''}{entry.amt.toFixed(0)} ₽
                                                </span>
                                                <span className="text-muted-foreground text-[10px]">
                                                  {entry.date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        {activityData[user.id].financial!.payments.length === 0 && activityData[user.id].financial!.transactions.length === 0 && (
                                          <div className="text-muted-foreground text-center py-3 text-xs">Нет операций</div>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                      Нет данных
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
