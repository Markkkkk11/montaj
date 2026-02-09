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
import { Search, Edit, Trash2, Plus } from 'lucide-react';
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
  createdAt: string;
  balance?: {
    amount: number;
    bonusAmount: number;
  };
  subscription?: {
    tariffType: string;
    expiresAt: string;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
        <p className="text-muted-foreground mt-2">
          Просмотр и редактирование пользователей платформы
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
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

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="EXECUTOR">Исполнители</SelectItem>
                <SelectItem value="CUSTOMER">Заказчики</SelectItem>
                <SelectItem value="ADMIN">Администраторы</SelectItem>
              </SelectContent>
            </Select>

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
          <CardTitle>Пользователи ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Рейтинг</TableHead>
                  <TableHead>Баланс</TableHead>
                  <TableHead>Тариф</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.phone}</div>
                        {user.email && (
                          <div className="text-muted-foreground">{user.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role === 'EXECUTOR' ? 'Исполнитель' : user.role === 'CUSTOMER' ? 'Заказчик' : 'Админ'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                        {user.status === 'ACTIVE' ? 'Активен' : user.status === 'PENDING' ? 'Модерация' : 'Заблокирован'}
                      </span>
                    </TableCell>
                    <TableCell>{user.city}</TableCell>
                    <TableCell>
                      {user.role === 'EXECUTOR' && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{user.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.balance && (
                        <div className="text-sm">
                          <div>{parseFloat(user.balance.amount.toString()).toFixed(2)} ₽</div>
                          {parseFloat(user.balance.bonusAmount.toString()) > 0 && (
                            <div className="text-muted-foreground text-xs">
                              +{parseFloat(user.balance.bonusAmount.toString()).toFixed(2)} бонус
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.subscription && (
                        <div className="text-sm">
                          <div>{user.subscription.tariffType}</div>
                          <div className="text-muted-foreground text-xs">
                            до {new Date(user.subscription.expiresAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
