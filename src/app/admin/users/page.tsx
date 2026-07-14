import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdminProfile } from '@/lib/admin/permissions';
import UsersClient from './UsersClient';

export const metadata: Metadata = { title: 'ユーザー管理' };

export default async function AdminUsersPage() {
  const profile = await getCurrentAdminProfile();
  if (!profile.is_admin) redirect('/admin/dashboard');

  return <UsersClient />;
}
