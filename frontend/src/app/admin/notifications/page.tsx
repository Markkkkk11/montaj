'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { Send, Users, User, Briefcase, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserItem {
  id: string;
  fullName: string;
  phone: string;
  role: string;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [sending, setSending] = useState(false);

  // Поиск пользователей для личной отправки
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Загрузка пользователей при поиске
  useEffect(() => {
    if (targetType !== 'USER') return;
    // Не искать, если пользователь уже выбран
    if (selectedUserId) return;
    const timer = setTimeout(() => {
      if (userSearch.length >= 2) {
        searchUsers(userSearch);
      } else {
        setUsers([]);
        setShowUserDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, targetType, selectedUserId]);

  const searchUsers = async (query: string) => {
    try {
      setLoadingUsers(true);
      const data = await adminApi.getUsers({ limit: 100 });
      const allUsers: UserItem[] = data.users || [];
      const q = query.toLowerCase();
      const filtered = allUsers.filter(
        (u: UserItem) =>
          u.fullName.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
      setUsers(filtered.slice(0, 20));
      setShowUserDropdown(true);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = (user: UserItem) => {
    setSelectedUserId(user.id);
    setUserSearch(`${user.fullName} (${user.phone})`);
    setShowUserDropdown(false);
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Введите заголовок' });
      return;
    }
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Введите текст сообщения' });
      return;
    }
    if (targetType === 'USER' && !selectedUserId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя' });
      return;
    }

    const target = targetType === 'USER' ? selectedUserId : targetType;
    const targetLabels: Record<string, string> = {
      ALL: 'всем пользователям',
      CUSTOMERS: 'всем заказчикам',
      EXECUTORS: 'всем исполнителям',
      USER: 'выбранному пользователю',
    };

    if (!confirm(`Отправить уведомление ${targetLabels[targetType]}?`)) return;

    try {
      setSending(true);
      const result = await adminApi.sendNotification({ title, message, target });
      toast({
        variant: 'success',
        title: '✅ Уведомление отправлено',
        description: `Отправлено ${result.sent} пользователям`,
      });
      // Очистить форму
      setTitle('');
      setMessage('');
      setSelectedUserId('');
      setUserSearch('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось отправить уведомление',
      });
    } finally {
      setSending(false);
    }
  };

  const getTargetIcon = () => {
    switch (targetType) {
      case 'ALL':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'CUSTOMERS':
        return <User className="h-4 w-4 text-green-600" />;
      case 'EXECUTORS':
        return <Briefcase className="h-4 w-4 text-violet-600" />;
      case 'USER':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Уведомления</h1>
        <p className="text-muted-foreground mt-2">
          Отправка уведомлений пользователям платформы
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Новое уведомление
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Получатели */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Получатели
              </label>
              <Select value={targetType} onValueChange={(val) => {
                setTargetType(val);
                setSelectedUserId('');
                setUserSearch('');
              }}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getTargetIcon()}
                    <SelectValue placeholder="Выберите получателей" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">👥 Все пользователи</SelectItem>
                  <SelectItem value="CUSTOMERS">🏠 Все заказчики</SelectItem>
                  <SelectItem value="EXECUTORS">🔧 Все исполнители</SelectItem>
                  <SelectItem value="USER">👤 Конкретный пользователь</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Поиск пользователя */}
            {targetType === 'USER' && (
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Пользователь
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени или телефону..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUserId('');
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => users.length > 0 && setShowUserDropdown(true)}
                    className="pl-10"
                  />
                </div>

                {/* Выпадающий список пользователей */}
                {showUserDropdown && (userSearch.length >= 2) && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Поиск...
                      </div>
                    ) : users.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Не найдено
                      </div>
                    ) : (
                      users.map((user) => (
                        <button
                          key={user.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between transition-colors"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div>
                            <p className="text-sm font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === 'CUSTOMER'
                              ? 'bg-green-100 text-green-700'
                              : user.role === 'EXECUTOR'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'CUSTOMER' ? 'Заказчик' : user.role === 'EXECUTOR' ? 'Исполнитель' : user.role}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedUserId && (
                  <p className="text-xs text-green-600 mt-1">✅ Пользователь выбран</p>
                )}
              </div>
            )}

            {/* Заголовок */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Заголовок
              </label>
              <Input
                placeholder="Например: Важная информация"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
            </div>

            {/* Сообщение */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Текст сообщения
              </label>
              <Textarea
                placeholder="Введите текст уведомления..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">{message.length}/1000</p>
            </div>

            {/* Предпросмотр */}
            {(title || message) && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-medium text-blue-600 mb-2">Предпросмотр:</p>
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{title || '(Заголовок)'}</p>
                    <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{message || '(Текст сообщения)'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка отправки */}
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim() || (targetType === 'USER' && !selectedUserId)}
              className="w-full gap-2"
              size="lg"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Отправить уведомление
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

