import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">UrLeads</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your CRM through AI
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
