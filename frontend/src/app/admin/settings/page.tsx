'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Настройки платформы и администрирование
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Настройки платформы</CardTitle>
          <CardDescription>
            Раздел в разработке
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Здесь будут настройки тарифов, комиссий, уведомлений и другие параметры платформы.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

