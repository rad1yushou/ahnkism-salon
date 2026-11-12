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
              <p>ご予約やお問い合わせの際にお預かりしたお名前・メールアドレス・電話番号などの個人情報は、ご予約の確認・ご連絡・サービス向上のためにのみ使用し、法令に基づく場合などを除き、ご本人の同意なく第三者に提供しません。なお、Cookie 等によるアクセス情報の Google への送信については、下記「アクセス解析ツールの利用について」で説明しています。</p>
            </div>
            <div>
              <h2 className="text-base font-light text-stone-800 mb-3">個人情報の管理</h2>
              <p>お客様の個人情報は厳重に管理し、外部への漏洩・不正アクセスを防ぐための適切な措置を講じます。</p>
            </div>
            <div>
              <h2 className="text-base font-light text-stone-800 mb-3">アクセス解析ツールの利用について</h2>
              <div className="space-y-3">
                <p>当サイトでは、サイトの利用状況を把握し、公式サイトやご予約までの導線を改善するため、Google LLC が提供するアクセス解析サービス「Google アナリティクス」を利用しています。</p>
                <p>Google アナリティクスでは、Cookie 等の識別子を利用して、閲覧されたページ、閲覧日時、お使いの端末・ブラウザなどの利用環境、リンクやボタンのクリックなどの操作に関する情報が取得され、Google LLC に送信されます。あわせて、IP アドレス等が送信される場合があります。これらの情報は、当グループがサイトの利用状況を分析し、サイトや予約導線を改善する目的で利用します。</p>
                <p>当サイトは、Google アナリティクスに、お名前・メールアドレス・電話番号など、お客様を直接特定できる情報を送信しません。取得された情報の取扱いは、Google のプライバシーポリシーに従います。</p>
                <p>Cookie の利用は、お使いのブラウザの設定で無効にすることができます。また、Google アナリティクスによる情報の収集を停止したい場合は、Google が提供する「Google アナリティクス オプトアウト アドオン」をご利用いただけます。</p>
                <p>当サイトから HotPepper Beauty などの外部の予約サイトに移動した後の情報の取扱いについては、移動先のサービスの提供元が定める規約・プライバシーポリシーに従います。</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <a href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] hover:underline">
                      Google プライバシー ポリシー
                    </a>
                  </li>
                  <li>
                    <a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] hover:underline">
                      Google のパートナーのサイトやアプリを使用する際の Google によるデータの使用
                    </a>
                  </li>
                  <li>
                    <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] hover:underline">
                      Google アナリティクス オプトアウト アドオン
                    </a>
                  </li>
                </ul>
              </div>
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
