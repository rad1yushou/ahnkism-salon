import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import ReservationCTA from '@/components/ui/ReservationCTA';
import { SITE } from '@/constants/site';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Requirement = { label: string; value: string };

type Job = {
  slug: string;
  title: string;
  description: string;
  requirements: Requirement[];
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
  const job = await getJob(slug);
  if (!job) notFound();

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
            <div className="border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">お問い合わせ</p>
              <a
                href={`mailto:${SITE.email}`}
                className="text-stone-700 hover:text-[#C9A96E] transition-colors"
              >
                {SITE.email}
              </a>
            </div>
          </div>
          <ReservationCTA label="採用について問い合わせる" sub="メールにてご連絡ください" />
        </Container>
      </section>
    </>
  );
}
