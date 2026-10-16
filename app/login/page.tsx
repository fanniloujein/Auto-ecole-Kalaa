import { LoginForm } from "@/components/login-form";
import { Signature } from "@/components/signature";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-4xl mb-4">
            🚗
          </div>
          <h1 className="text-2xl font-bold text-white">Auto-École</h1>
          <p className="text-blue-100 mt-1">Espace d&apos;administration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <LoginForm />
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          Accès réservé à l&apos;administrateur de l&apos;auto-école.
        </p>
        <Signature className="text-center text-blue-300/80 mt-2" />
      </div>
    </div>
  );
}
