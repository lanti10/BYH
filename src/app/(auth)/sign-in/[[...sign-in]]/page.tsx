import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D42B27]">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-2xl">
            <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-wide">BUILD YOUR HEALTH</h1>
            <p className="text-white/70 text-sm mt-1">Accedi al tuo account</p>
          </div>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
