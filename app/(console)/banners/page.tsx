'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/fields';

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  audience: string;
  isActive: boolean;
  priority: number;
  deepLink: string | null;
};

const schema = z.object({
  title: z.string().min(2).max(80),
  subtitle: z.string().max(200).optional(),
  audience: z.enum(['ALL', 'USER', 'HOST']),
  deepLink: z.string().max(120).optional(),
  priority: z.coerce.number().int().min(0),
});

type Values = z.infer<typeof schema>;

export default function BannersPage() {
  const client = useQueryClient();
  const banners = useQuery({
    queryKey: ['banners'],
    queryFn: () => apiGet<Banner[]>('/admin/banners'),
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', subtitle: '', audience: 'ALL', deepLink: '', priority: 0 },
  });
  const create = useMutation({
    mutationFn: (values: Values) => apiSend('/admin/banners', 'POST', values),
    onSuccess: () => {
      toast.success('Banner created');
      form.reset();
      void client.invalidateQueries({ queryKey: ['banners'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const toggle = useMutation({
    mutationFn: (banner: Banner) => apiSend(`/admin/banners/${banner.id}`, 'PATCH', { isActive: !banner.isActive }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['banners'] }),
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Banners" description="Home-screen banners served by the existing admin banner API." />
      <form className="grid max-w-lg gap-2" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
        <Label htmlFor="banner-title">Title</Label>
        <Input id="banner-title" {...form.register('title')} />
        <Label htmlFor="banner-sub">Subtitle</Label>
        <Input id="banner-sub" {...form.register('subtitle')} />
        <Label htmlFor="banner-audience">Audience</Label>
        <Select id="banner-audience" {...form.register('audience')}>
          <option value="ALL">All</option>
          <option value="USER">Users</option>
          <option value="HOST">Hosts</option>
        </Select>
        <Label htmlFor="banner-link">Deep link</Label>
        <Input id="banner-link" {...form.register('deepLink')} />
        <Button type="submit" disabled={create.isPending}>Create banner</Button>
      </form>
      {banners.isLoading ? <PageSkeleton /> : null}
      {banners.error ? <ErrorState error={banners.error} onRetry={() => banners.refetch()} /> : null}
      <ul className="space-y-2">
        {(banners.data ?? []).map((banner) => (
          <li key={banner.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-800">
            <span>{banner.title} · {banner.audience}</span>
            <span className="flex items-center gap-2">
              <StatusBadge value={banner.isActive ? 'ACTIVE' : 'DISABLED'} />
              <Button size="sm" variant="secondary" onClick={() => toggle.mutate(banner)} disabled={toggle.isPending}>
                {banner.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
