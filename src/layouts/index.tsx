import { Link, Outlet } from 'umi';
import './index.less';
import { ReactQueryClientProvider } from '@/components/ReactQueryClientProvider';

export default function Layout() {
  return (
    <ReactQueryClientProvider>
      <Outlet />
    </ReactQueryClientProvider>
  );
}
