import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
        <div className="flex ">
          <RegisterForm />
        </div>
      </div>
      <div className="absolute top-1/2 right-1/2  w-[500px] h-[500px] bg-indigo-700 rounded-full blur-[150px] opacity-70" />
      <div className="absolute top-1/5 right-1/5  w-[500px] h-[500px] bg-purple-500 rounded-full blur-[150px] opacity-70" />
      <div className="absolute top-1/5 right-1/3  w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[150px] opacity-70" />
    </div>
  );
}
