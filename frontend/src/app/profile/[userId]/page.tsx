'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SPECIALIZATION_LABELS, getTimeSinceRegistration } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';
import { Star, ArrowLeft, Globe, Building, MapPin } from 'lucide-react';

interface PublicProfile {
  id: string;
  fullName: string;
  photo?: string;
  city: string;
  organization?: string;
  about?: string;
  website?: string;
  rating: number;
  completedOrders: number;
  role: string;
  createdAt: string;
  executorProfile?: {
    region: string;
    specializations: string[];
    shortDescription?: string;
    fullDescription?: string;
    workPhotos: string[];
    isSelfEmployed?: boolean;
  };
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/users/${userId}/public`);
      setProfile(data.profile);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки профиля');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Профиль не найден'}</p>
            <Button onClick={() => router.back()}>Назад</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.jpg" alt="SVM" className="h-14 w-14 rounded-full object-cover" />
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Avatar + Name */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {profile.photo ? (
                  <img
                    src={profile.photo.startsWith('/') ? `${API_URL}${profile.photo}` : profile.photo}
                    alt="Аватар"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-500">{profile.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{profile.fullName}</h3>
                <p className="text-muted-foreground">{profile.role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {profile.completedOrders} заказов
                  </span>
                  <span className="text-sm text-muted-foreground">
                    На сайте: {getTimeSinceRegistration(profile.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{profile.city}</span>
            </div>
            {profile.organization && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{profile.organization}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}
            {profile.about && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">О себе</p>
                <p>{profile.about}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Executor Profile Details */}
        {profile.executorProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Профиль исполнителя</CardTitle>
              <CardDescription>Опыт и специализации</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.executorProfile.region && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Регион работы</p>
                  <p className="font-medium">{profile.executorProfile.region}</p>
                </div>
              )}

              {profile.executorProfile.specializations.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Специализации</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.executorProfile.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {SPECIALIZATION_LABELS[spec] || spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.executorProfile.shortDescription && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Краткое описание</p>
                  <p>{profile.executorProfile.shortDescription}</p>
                </div>
              )}

              {profile.executorProfile.fullDescription && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Подробное описание</p>
                  <p className="whitespace-pre-line">{profile.executorProfile.fullDescription}</p>
                </div>
              )}

              {profile.executorProfile.isSelfEmployed && (
                <div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    ✅ Самозанятый
                  </span>
                </div>
              )}

              {/* Work Photos */}
              {profile.executorProfile.workPhotos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Фото работ</p>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.executorProfile.workPhotos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo.startsWith('/') ? `${API_URL}${photo}` : photo}
                        alt={`Работа ${i + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reviews Link */}
        <Link href={`/profile/${userId}/reviews`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-semibold">Отзывы</p>
                    <p className="text-sm text-muted-foreground">
                      Рейтинг: {profile.rating.toFixed(1)} / 5.0 • {profile.completedOrders} заказов
                    </p>
                  </div>
                </div>
                <span className="text-primary text-sm">Смотреть →</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}

