import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send, Users } from 'lucide-react';
import {
  AdminButton,
  AdminCard,
  AdminError,
  AdminField,
  AdminInput,
  AdminSpinner,
  AdminTextarea,
  PageTitle,
  TableShell,
  Td,
  Th,
} from '@/components/admin/AdminUi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError, adminApi } from '@/lib/api';
import { formatTimestamp, pluralise } from '@/lib/format';

export default function AdminPromotionsPage() {
  usePageTitle('Promotions');
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: adminApi.promotions,
  });

  const send = useMutation({
    mutationFn: () => adminApi.sendPromotion({ subject: subject.trim(), message: message.trim() }),
    onSuccess: (result) => {
      setSubject('');
      setMessage('');
      setErrors({});
      setSuccess(result.message);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: (sendError) => {
      setSuccess(null);
      if (sendError instanceof ApiError && sendError.isValidation) {
        setErrors(sendError.errors);
        return;
      }
      setErrors({
        _: sendError instanceof Error ? sendError.message : 'The promotion could not be sent.',
      });
    },
  });

  if (isLoading) return <AdminSpinner label="Loading promotions…" />;
  if (isError || !data) {
    return <AdminError message={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <>
      <PageTitle
        title="Promotions & Deals"
        meta={`${pluralise(data.activeSubscribers, 'active subscriber')} on the list`}
      />

      <AdminCard
        className="mb-6"
        title={
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Megaphone className="h-4 w-4 text-accent-500" aria-hidden /> Send Promotion
          </h2>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send.mutate();
          }}
          noValidate
        >
          <div className="mb-4 space-y-4">
            <AdminField
              label="Subject"
              hint={errors.subject ? <span className="text-red-600">{errors.subject}</span> : undefined}
            >
              <AdminInput
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g. 20% Off All Airport Transfers!"
                required
              />
            </AdminField>

            <AdminField
              label="Message"
              hint={errors.message ? <span className="text-red-600">{errors.message}</span> : undefined}
            >
              <AdminTextarea
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your promotional message here…"
                required
              />
            </AdminField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              This will be sent to <strong className="text-gray-900">{data.activeSubscribers}</strong>{' '}
              active subscribers.
            </p>
            <AdminButton type="submit" loading={send.isPending}>
              <Send className="h-4 w-4" aria-hidden />
              {send.isPending ? 'Sending…' : 'Send to all subscribers'}
            </AdminButton>
          </div>

          {success && (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </p>
          )}
          {errors._ && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors._}
            </p>
          )}
        </form>
      </AdminCard>

      {/* Sent promotions */}
      <h2 className="mb-3 text-base font-semibold text-gray-800">Sent promotions</h2>
      <div className="mb-8">
        <TableShell
          isEmpty={data.promotions.length === 0}
          empty="No promotions sent yet."
          head={
            <tr>
              <Th>Sent</Th>
              <Th>Subject</Th>
              <Th>Recipients</Th>
              <Th>Delivered</Th>
              <Th>Status</Th>
            </tr>
          }
        >
          {data.promotions.map((promotion) => (
            <tr key={promotion.id} className="hover:bg-gray-50">
              <Td className="whitespace-nowrap text-gray-600">
                {formatTimestamp(promotion.createdAt)}
              </Td>
              <Td className="font-medium text-gray-900">{promotion.subject}</Td>
              <Td className="text-gray-600">{promotion.recipientCount}</Td>
              <Td className="text-gray-600">{promotion.sentCount}</Td>
              <Td>
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
                  {promotion.status}
                </span>
              </Td>
            </tr>
          ))}
        </TableShell>
      </div>

      {/* Subscribers */}
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
        <Users className="h-4 w-4 text-gray-400" aria-hidden /> Subscribers
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          {data.subscribers.length} total
        </span>
      </h2>
      <TableShell
        isEmpty={data.subscribers.length === 0}
        empty="No subscribers yet."
        head={
          <tr>
            <Th className="w-12">#</Th>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Subscribed</Th>
            <Th>Status</Th>
          </tr>
        }
      >
        {data.subscribers.map((subscriber, index) => (
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
          </tr>
        ))}
      </TableShell>
    </>
  );
}
