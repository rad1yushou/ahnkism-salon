import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { SITE } from '@/constants/site';

export const metadata: Metadata = buildMetadata({
  title: 'お問い合わせ｜AHNKISM',
  description: 'AHNKISMグループへのお問い合わせはこちら。ご予約・ご質問・採用に関するお問い合わせをお受けしています。',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'お問い合わせ', path: '/contact' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">Contact</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-6">
            お問い合わせ
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-10">
            ご予約はHotPepper Beautyよりお願いいたします。
            その他のご質問・ご要望は下記メールアドレスまでお気軽にお問い合わせください。
          </p>
          <div className="border border-stone-200 p-6 mb-8">
            <p className="text-xs tracking-widest text-stone-400 mb-2">メールアドレス</p>
            <a
              href={`mailto:${SITE.email}`}
              className="text-sm text-stone-700 hover:text-[#C9A96E] transition-colors"
            >
              {SITE.email}
            </a>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            ※ お問い合わせへの返答には2〜3営業日いただく場合があります。<br />
            ※ ご予約のキャンセル・変更はHotPepper Beautyよりお手続きをお願いいたします。
          </p>
        </Container>
      </section>
    </>
  );
}
