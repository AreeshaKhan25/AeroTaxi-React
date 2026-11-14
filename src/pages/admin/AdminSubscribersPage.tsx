import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Users } from 'lucide-react';
import {
  AdminButton,
  AdminError,
  AdminInput,
  AdminSpinner,
  PageTitle,
  TableShell,
  Td,
  Th,
} from '@/components/admin/AdminUi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { adminApi } from '@/lib/api';
import { formatTimestamp } from '@/lib/format';

export default function AdminSubscribersPage() {
  usePageTitle('Subscribers');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: subscribers, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'subscribers'],
    queryFn: adminApi.subscribers,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.setSubscriberActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const filtered = useMemo(() => {
    const list = subscribers ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((subscriber) =>
      [subscriber.email, subscriber.name].filter(Boolean).join(' ').toLowerCase().includes(query),
    );
  }, [subscribers, search]);

  const exportCsv = () => {
    const rows = [
      ['Email', 'Name', 'Active', 'Subscribed'],
      ...filtered.map((subscriber) => [
        subscriber.email,
        subscriber.name ?? '',
        subscriber.active ? 'yes' : 'no',
        subscriber.createdAt,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aerotaxi-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <AdminSpinner label="Loading subscribers…" />;
  if (isError || !subscribers) {
    return <AdminError message={error instanceof Error ? error.message : undefined} />;
  }

  const activeCount = subscribers.filter((subscriber) => subscriber.active).length;

  return (
    <>
      <PageTitle
        title="Newsletter Subscribers"
        meta={`${subscribers.length} total · ${activeCount} active`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <AdminInput
              type="search"
              placeholder="Search by email or name…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-60"
            />
            <AdminButton variant="ghost" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
            </AdminButton>
          </div>
        }
      />

      <TableShell
        isEmpty={filtered.length === 0}
        empty={
          <span className="flex flex-col items-center gap-2">
            <Users className="h-7 w-7 text-gray-300" aria-hidden />
            No subscribers {search ? 'match your search.' : 'yet.'}
          </span>
        }
        head={
          <tr>
            <Th className="w-12">#</Th>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Subscribed</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        }
      >
        {filtered.map((subscriber, index) => (
          <tr key={subscriber.id} className="hover:bg-gray-50">
            <Td className="text-gray-400">{index + 1}</Td>
            <Td>
              <a
                href={`mailto:${subscriber.email}`}
                className="font-medium text-primary-700 hover:underline"
              >
                {subscriber.email}
              </a>
            </Td>
            <Td className="text-gray-900">{subscriber.name || '—'}</Td>
            <Td className="whitespace-nowrap text-gray-600">
              {formatTimestamp(subscriber.createdAt)}
            </Td>
            <Td>
              {subscriber.active ? (
                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Active
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                  Inactive
                </span>
              )}
            </Td>
            <Td>
              <AdminButton
                size="sm"
                variant="ghost"
                loading={toggleActive.isPending && toggleActive.variables?.id === subscriber.id}
                onClick={() =>
                  toggleActive.mutate({ id: subscriber.id, active: !subscriber.active })
                }
              >
                {subscriber.active ? 'Deactivate' : 'Reactivate'}
              </AdminButton>
            </Td>
          </tr>
        ))}
      </TableShell>
    </>
  );
}
