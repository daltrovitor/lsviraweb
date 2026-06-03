import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4 z-50">
        <Link 
          href="/landing"
          className="px-4 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl text-sm font-bold text-navy-900 hover:bg-white transition-all shadow-lg"
        >
          ← Voltar para Landing Page
        </Link>
      </div>
      <LoginForm />
    </div>
  );
}
