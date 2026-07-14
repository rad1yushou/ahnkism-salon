import type { Metadata } from 'next';
import { requireViewPermission } from '@/lib/admin/permissions';
import BlogsClient from './BlogsClient';

export const metadata: Metadata = { title: 'ブログ管理' };

export default async function AdminBlogsPage() {
  await requireViewPermission('blogs');
  return <BlogsClient canEdit={true} />;
}
