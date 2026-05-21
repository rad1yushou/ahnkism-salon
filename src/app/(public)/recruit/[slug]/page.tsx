import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { SITE } from '@/constants/site';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Requirement = { label: string; value: string };

type Job = {
  slug: string;
  title: string;
  description: string;
  requirements: Requirement[];
};

type ContactSettings = {
  title: string;
  body: string;
  email: string;
  phone: string;
  line_url: string;
  instagram_url: string;
  button_label: string;
  primary_url: string;
};

async function getJob(slug: string): Promise<Job | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('recruit_jobs')
    .select('slug, title, description, requirements')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data ?? null;
}

async function getContact(): Promise<ContactSettings | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('recruit_contact_settings')
    .select('title, body, email, phone, line_url, instagram_url, button_label, primary_url')
    .eq('setting_key', 'default')
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return data as ContactSettings;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return {};
  return buildMetadata({
    title: `${job.title}｜AHNKISM大阪`,
    description: job.description,
    path: `/recruit/${slug}`,
  });
}

export default async function RecruitJobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [job, contact] = await Promise.all([getJob(slug), getContact()]);
  if (!job) notFound();

  // ボタンリンク優先順: primary_url → mailto:email → line_url → instagram_url → mailto:SITE.email
  const contactHref: string | null =
    (contact?.primary_url) ||
    (contact?.email ? `mailto:${contact.email}` : null) ||
    (contact?.line_url) ||
    (contact?.instagram_url) ||
    (SITE.email ? `mailto:${SITE.email}` : null);

  const contactLabel = contact?.button_label || '応募・お問い合わせはこちら';

  // メール欄の表示: CMS の email、なければ SITE.email にフォールバック
  const displayEmail = contact?.email || SITE.email;

  return (
    <>
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: '採用情報', path: '/recruit' },
            { name: job.title, path: `/recruit/${slug}` },
          ]}
        />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">Recruit</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-6">
            {job.title}
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-10 whitespace-pre-line">{job.description}</p>
          <div className="space-y-4 text-sm mb-12">
            {job.requirements.map((req, i) => (
              <div key={i} className="border border-stone-200 p-4">
                <p className="text-xs text-stone-400 mb-1">{req.label}</p>
                <p className="text-stone-700">{req.value}</p>
              </div>
            ))}
          </div>

          {/* 問い合わせ先ブロック */}
          <div className="border-t border-stone-100 pt-10">
            <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-2">Contact</p>
            <h2 className="text-xl font-light tracking-wider text-stone-800 mb-4">
              {contact ? contact.title : '応募・お問い合わせ'}
            </h2>
            {contact?.body && (
              <p className="text-sm text-stone-500 leading-relaxed mb-6 whitespace-pre-line">
                {contact.body}
              </p>
            )}
            <ul className="space-y-2 mb-6">
              {displayEmail && (
                <li className="text-xs text-stone-600">
                  メール:{' '}
                  <a
                    href={`mailto:${displayEmail}`}
                    className="hover:text-[#C9A96E] transition-colors"
                  >
                    {displayEmail}
                  </a>
                </li>
              )}
              {contact?.phone && (
                <li className="text-xs text-stone-600">
                  電話:{' '}
                  <a
                    href={`tel:${contact.phone}`}
                    className="hover:text-[#C9A96E] transition-colors"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.line_url && (
                <li className="text-xs text-stone-600">
                  LINE:{' '}
                  <a
                    href={contact.line_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A96E] transition-colors"
                  >
                    LINE公式アカウント
                  </a>
                </li>
              )}
              {contact?.instagram_url && (
                <li className="text-xs text-stone-600">
                  Instagram:{' '}
                  <a
                    href={contact.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A96E] transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              )}
            </ul>
            {contactHref && (
              <Button href={contactHref} variant="outline" external>
                {contactLabel}
              </Button>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
