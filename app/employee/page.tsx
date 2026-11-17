import LoginArt from '@/components/LoginArt';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Helios calendar — employees', robots: { index: false } };

export default function EmployeeLoginPage() {
  return (
    <main className="lp">
      <LoginArt />
      <div className="lp-side">
        <LoginForm kind="employee" />
      </div>
    </main>
  );
}
