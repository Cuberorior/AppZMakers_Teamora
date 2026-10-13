import { HRReportsView } from '../hr/HRReportsView';

export function AdminReportsView(props) {
  return <HRReportsView {...props} role="superadmin" />;
}
