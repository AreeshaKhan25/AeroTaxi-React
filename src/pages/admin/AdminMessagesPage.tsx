import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, MailOpen } from 'lucide-react';
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
import { cn } from '@/lib/cn';
import { formatTimestamp } from '@/lib/format';

export default function AdminMessagesPage() {
  usePageTitle('Contact messages');
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: messages, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'contact-messages'],
    queryFn: adminApi.contactMessages,
  });

  const markRead = useMutation({
    mutationFn: ({ id, read }: { id: number; read: boolean }) => adminApi.markMessageRead(id, read),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'contact-messages'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const filtered = useMemo(() => {
    const list = messages ?? [];
    const query = search.trim().toLowerCase();
    return list.filter((message) => {
      if (unreadOnly && message.read) return false;
      if (!query) return true;
      return [message.name, message.email, message.subject, message.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [messages, search, unreadOnly]);

  if (isLoading) return <AdminSpinner label="Loading messages…" />;
  if (isError || !messages) {
    return <AdminError message={error instanceof Error ? error.message : undefined} />;
  }

  const unreadCount = messages.filter((message) => !message.read).length;

  return (
    <>
      <PageTitle
        title="Contact Messages"
        meta={`${messages.length} total · ${unreadCount} unread`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <AdminInput
              type="search"
              placeholder="Search messages…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
              />
              Unread only
            </label>
          </div>
        }
      />

      <TableShell
        isEmpty={filtered.length === 0}
        empty={
          <span className="flex flex-col items-center gap-2">
            <Mail className="h-7 w-7 text-gray-300" aria-hidden />
            No contact messages {unreadOnly || search ? 'match your filters.' : 'yet.'}
          </span>
        }
        head={
          <tr>
            <Th>Date</Th>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Subject</Th>
            <Th>Message</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        }
      >
        {filtered.map((message) => {
          const open = expanded === message.id;
          return (
            <tr
              key={message.id}
              className={cn('hover:bg-gray-50', !message.read && 'bg-primary-50/50')}
            >
              <Td className="whitespace-nowrap text-gray-600">
                {formatTimestamp(message.createdAt)}
              </Td>
              <Td className="font-medium text-gray-900">{message.name}</Td>
              <Td>
                <a
                  href={`mailto:${message.email}`}
                  className="text-primary-700 hover:text-primary-800 hover:underline"
                >
                  {message.email}
                </a>
              </Td>
              <Td className="text-gray-700">{message.subject || '—'}</Td>
              <Td className="max-w-xs text-gray-600">
                {open ? (
                  <span className="whitespace-pre-wrap">{message.message}</span>
                ) : (
                  <span className="block truncate">{message.message}</span>
                )}
              </Td>
              <Td>
                {message.read ? (
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    Read
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    Unread
                  </span>
                )}
              </Td>
              <Td className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : message.id)}
                    className="text-xs font-medium text-primary-700 hover:underline"
                  >
                    {open ? 'Collapse' : 'View'}
                  </button>
                  <AdminButton
                    size="sm"
                    variant="ghost"
                    loading={markRead.isPending && markRead.variables?.id === message.id}
                    onClick={() => markRead.mutate({ id: message.id, read: !message.read })}
                  >
                    <MailOpen className="h-3 w-3" aria-hidden />
                    {message.read ? 'Mark unread' : 'Mark read'}
                  </AdminButton>
                </div>
              </Td>
            </tr>
          );
        })}
      </TableShell>
    </>
  );
}
