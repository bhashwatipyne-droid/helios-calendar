import LoginArt from '@/components/LoginArt';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="lp">
      <LoginArt />
      <div className="lp-side">
        <LoginForm />
      </div>
    </main>
  );
}
