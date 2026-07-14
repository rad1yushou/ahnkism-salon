import type { Metadata } from 'next';
import { requireViewPermission, getPagePermission } from '@/lib/admin/permissions';
import BlogsClient from './BlogsClient';

export const metadata: Metadata = { title: 'ブログ管理' };

export default async function AdminBlogsPage() {
  await requireViewPermission('blogs');
  const permission = await getPagePermission('blogs');
  return <BlogsClient canEdit={permission.can_edit} />;
}
