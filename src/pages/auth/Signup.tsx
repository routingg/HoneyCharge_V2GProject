import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TextField } from '@/components/common/TextField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function isValidPhone(value: string) {
  return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(value);
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  phone?: string;
  terms?: string;
}

function AgreeRow({
  checked,
  onChange,
  label,
  required = true,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] w-full items-center gap-2.5 text-left"
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          checked ? 'border-primary bg-primary' : 'border-border'
        )}
      >
        {checked && <Check size={13} className="text-[#202124]" aria-hidden="true" />}
      </span>
      <span className="text-sm text-text">
        {label} {required && <span className="text-text-secondary">(필수)</span>}
      </span>
    </button>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAppStore((s) => s.signup);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const allAgreed = agreeService && agreePrivacy;
  const toggleAll = (v: boolean) => {
    setAgreeService(v);
    setAgreePrivacy(v);
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = '이름을 입력해 주세요';
    if (!email) next.email = '이메일을 입력해 주세요';
    else if (!isValidEmail(email)) next.email = '올바른 이메일 형식이 아니에요';
    if (!password) next.password = '비밀번호를 입력해 주세요';
    else if (password.length < 6) next.password = '비밀번호는 6자 이상이어야 해요';
    if (passwordConfirm !== password) next.passwordConfirm = '비밀번호가 일치하지 않아요';
    if (!phone) next.phone = '휴대전화 번호를 입력해 주세요';
    else if (!isValidPhone(phone)) next.phone = '올바른 휴대전화 번호 형식이 아니에요 (010-1234-5678)';
    if (!agreeService || !agreePrivacy) next.terms = '필수 약관에 모두 동의해 주세요';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    window.setTimeout(() => {
      signup(name, email, phone);
      setLoading(false);
      showToast('회원가입이 완료되었습니다', 'success');
      navigate(PATHS.home, { replace: true });
    }, 500);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col overflow-y-auto bg-bg px-6 pb-8">
      <div className="pt-[calc(env(safe-area-inset-top)+24px)]">
        <h1 className="text-xl font-extrabold text-text">회원가입</h1>
        <p className="mt-1 text-sm text-text-secondary">HoneyCharge와 함께 스마트한 충전을 시작해요</p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="홍길동" />
        <TextField
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="honeycharge@example.com"
        />
        <TextField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="6자 이상 입력해 주세요"
        />
        <TextField
          label="비밀번호 확인"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={errors.passwordConfirm}
          placeholder="비밀번호를 다시 입력해 주세요"
        />
        <TextField
          label="휴대전화 번호"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          placeholder="010-1234-5678"
        />

        <div className="mt-2 rounded-card border border-border bg-card p-4">
          <AgreeRow checked={allAgreed} onChange={toggleAll} label="전체 동의" required={false} />
          <div className="my-2 h-px bg-border" />
          <div className="flex flex-col gap-1">
            <AgreeRow checked={agreeService} onChange={setAgreeService} label="서비스 이용약관 동의" />
            <AgreeRow checked={agreePrivacy} onChange={setAgreePrivacy} label="개인정보 처리방침 동의" />
          </div>
          {errors.terms && <p className="mt-2 text-xs font-medium text-danger">{errors.terms}</p>}
        </div>

        <PrimaryButton type="submit" loading={loading} className="mt-2">
          회원가입
        </PrimaryButton>
      </form>
    </div>
  );
}
