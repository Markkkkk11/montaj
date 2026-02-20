'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

const TOPICS = [
  { value: 'site_questions', label: 'Вопросы по работе сайта' },
  { value: 'cooperation', label: 'Вопросы по сотрудничеству' },
  { value: 'commercial', label: 'Коммерческие предложения' },
];

export default function ContactPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.email || !formData.topic || !formData.message) {
      toast({
        variant: 'destructive',
        title: 'Заполните обязательные поля',
        description: 'ФИО, телефон, почта, тема и сообщение обязательны',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/contact', formData);
      setSubmitted(true);
      toast({
        variant: 'success',
        title: '✅ Сообщение отправлено!',
        description: 'Мы свяжемся с вами в ближайшее время.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось отправить сообщение',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Сообщение отправлено!</h2>
            <p className="text-muted-foreground mb-6">
              Спасибо за ваше обращение. Мы рассмотрим его и свяжемся с вами в ближайшее время.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/')}>На главную</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', topic: '', message: '' });
                }}
              >
                Написать ещё
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Обратная связь</CardTitle>
            <CardDescription>
              Задайте вопрос или отправьте предложение. Ваше сообщение будет отправлено администратору.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ФИО *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (900) 123-45-67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Тема обращения *</Label>
                <div className="space-y-2">
                  {TOPICS.map((topic) => (
                    <label
                      key={topic.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.topic === topic.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="topic"
                        value={topic.value}
                        checked={formData.topic === topic.value}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">{topic.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Сообщение *</Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Опишите ваш вопрос или предложение..."
                  minLength={10}
                />
                <p className="text-xs text-muted-foreground">Минимум 10 символов</p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

