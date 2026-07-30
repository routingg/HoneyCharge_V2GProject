import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { TextField } from '@/components/common/TextField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Toggle } from '@/components/common/Toggle';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { DEMO_ACCOUNT } from '@/data/users';
import { PATHS } from '@/routes/paths';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const { showToast, notReady } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = '이메일을 입력해 주세요';
    else if (!isValidEmail(email)) next.email = '올바른 이메일 형식이 아니에요';
    if (!password) next.password = '비밀번호를 입력해 주세요';
    else if (password.length < 4) next.password = '비밀번호는 4자 이상이어야 해요';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    window.setTimeout(() => {
      login(email);
      setLoading(false);
      showToast('로그인되었습니다', 'success');
      navigate(PATHS.home, { replace: true });
    }, 500);
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setErrors({});
    setLoading(true);
    window.setTimeout(() => {
      login(DEMO_ACCOUNT.email);
      setLoading(false);
      showToast('데모 계정으로 로그인했어요', 'success');
      navigate(PATHS.home, { replace: true });
    }, 400);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col overflow-y-auto bg-bg px-6">
      <div className="flex flex-col items-center pt-[calc(env(safe-area-inset-top)+40px)]">
        <Logo size={64} withWordmark />
      </div>
      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="honeycharge@example.com"
        />
        <TextField
          label="비밀번호"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="비밀번호"
          rightSlot={
            <button
              type="button"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              onClick={() => setShowPassword((v) => !v)}
              className="flex h-6 w-6 items-center justify-center text-text-secondary"
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          }
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">자동 로그인</span>
          <Toggle checked={autoLogin} onChange={setAutoLogin} label="자동 로그인" />
        </div>
        <PrimaryButton type="submit" loading={loading} className="mt-2">
          로그인
        </PrimaryButton>
        <SecondaryButton type="button" onClick={handleDemoLogin} className="border-primary/60 bg-light-yellow text-dark-gold">
          데모 계정으로 시작
        </SecondaryButton>
        <button
          type="button"
          onClick={() => {
            notReady();
          }}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-button bg-[#FEE500] text-[15px] font-semibold text-[#391B1B]"
        >
          <MessageCircle size={18} aria-hidden="true" />
          카카오 로그인
        </button>
      </form>
      <div className="mt-6 flex items-center justify-center gap-1 pb-8 text-sm">
        <span className="text-text-secondary">아직 계정이 없으신가요?</span>
        <Link to={PATHS.signup} className="font-semibold text-info">
          회원가입
        </Link>
      </div>
    </div>
  );
}
