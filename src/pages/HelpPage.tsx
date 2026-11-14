import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, MapPin, Search, Send } from 'lucide-react';
import { PageHero } from '@/components/common/PageHero';
import { Accordion } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Alert, Card, Skeleton } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import { useFaqs } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError, api } from '@/lib/api';
import { ROUTES, SITE } from '@/lib/site';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY_FORM: ContactForm = { name: '', email: '', subject: '', message: '' };

export default function HelpPage() {
  usePageTitle('Help Centre');
  const navigate = useNavigate();
  const toast = useToast();
  const faqs = useFaqs();

  const [reference, setReference] = useState('');
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contact = useMutation({
    mutationFn: () =>
      api.sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || null,
        message: form.message.trim(),
      }),
    onSuccess: (result) => {
      setForm(EMPTY_FORM);
      setErrors({});
      toast.success('Message sent', result.message);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isValidation) {
        setErrors(error.errors);
        return;
      }
      toast.error(
        'Your message could not be sent',
        error instanceof Error ? error.message : undefined,
      );
    },
  });

  const lookup = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) return;
    navigate(`${ROUTES.lookup}?reference=${encodeURIComponent(trimmed.toUpperCase())}`);
  };

  const submitContact = (event: React.FormEvent) => {
    event.preventDefault();
    contact.mutate();
  };

  return (
    <>
      <PageHero title="Help Centre" subtitle="Manage a booking, reach the team or browse the FAQs." />

      {/* My booking */}
      <section id="my-booking" className="scroll-mt-24 py-12">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
          <Card className="shadow-card">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">My booking</h2>
            <p className="mb-6 text-gray-600">
              Amend or cancel your reservation online up to 24 hours before the scheduled pick-up or
              flight arrival time.
            </p>
            <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Booking reference (e.g. ATH-XXXXXXXX)"
                aria-label="Booking reference"
                required
                className="flex-1 uppercase tracking-wider"
                leadingIcon={<Search className="h-4 w-4" aria-hidden />}
              />
              <Button type="submit" className="sm:w-auto">
                Find booking
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Contact us */}
      <section id="contact-us" className="scroll-mt-24 py-12">
        <div className="container-page">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">Contact us</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-gray-600">
            We&rsquo;re here to help! Whether you have a question, need assistance with a
            reservation, or want to share feedback, don&rsquo;t hesitate to reach out.
          </p>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Mail className="h-4 w-4 text-primary-700" aria-hidden /> Email
                </h3>
                <a
                  href={`mailto:${SITE.supportEmail}`}
                  className="text-primary-700 hover:underline"
                >
                  {SITE.supportEmail}
                </a>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-primary-700" aria-hidden /> Address
                </h3>
                <p className="text-gray-600">
                  {SITE.address.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>

              <Alert tone="info" title="Typical response time">
                We reply to most messages within one working day, and acknowledge complaints within
                five working days.
              </Alert>
            </div>

            <Card className="shadow-card">
              <form onSubmit={submitContact} className="space-y-4" noValidate>
                <Field label="Name" required error={errors.name}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                    />
                  )}
                </Field>

                <Field label="Email" required error={errors.email}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      type="email"
                      aria-describedby={describedBy}
                      invalid={invalid}
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      required
                    />
                  )}
                </Field>

                <Field label="Subject (optional)" error={errors.subject}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={form.subject}
                      onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    />
                  )}
                </Field>

                <Field label="Message" required error={errors.message}>
                  {({ id, describedBy, invalid }) => (
                    <Textarea
                      id={id}
                      rows={5}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                      required
                    />
                  )}
                </Field>

                <Button type="submit" fullWidth loading={contact.isPending}>
                  {!contact.isPending && <Send className="h-4 w-4" aria-hidden />}
                  Send message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="scroll-mt-24 py-12 pb-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Frequently asked questions
          </h2>

          {faqs.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Accordion
              items={(faqs.data ?? []).map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
