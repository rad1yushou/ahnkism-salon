import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { SITE } from '@/constants/site';

export const metadata: Metadata = buildMetadata({
  title: 'プライバシーポリシー｜AHNKISM',
  description: 'AHNKISMグループのプライバシーポリシー。お客様の個人情報の取り扱いについて。',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'プライバシーポリシー', path: '/privacy' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 mb-10">
            プライバシーポリシー
          </h1>
          <div className="space-y-8 text-sm text-stone-600 leading-relaxed">
            <div>
              <h2 className="text-base font-light text-stone-800 mb-3">個人情報の収集について</h2>
              <p>当グループは、お客様がご予約やお問い合わせの際に、お名前・メールアドレス・電話番号などの個人情報をお預かりする場合があります。</p>
            </div>
            <div>
              <h2 className="text-base font-light text-stone-800 mb-3">個人情報の利用目的</h2>
              <p>収集した個人情報は、ご予約の確認・ご連絡・サービス向上のためにのみ使用し、第三者への提供は行いません。</p>
            </div>
            <div>
              <h2 className="text-base font-light text-stone-800 mb-3">個人情報の管理</h2>
              <p>お客様の個人情報は厳重に管理し、外部への漏洩・不正アクセスを防ぐための適切な措置を講じます。</p>
            </div>
            <div>
              <h2 className="text-base font-light text-stone-800 mb-3">お問い合わせ</h2>
              <p>
                プライバシーポリシーに関するお問い合わせは{' '}
                <a href={`mailto:${SITE.email}`} className="text-[#C9A96E] hover:underline">
                  {SITE.email}
                </a>{' '}
                までご連絡ください。
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
