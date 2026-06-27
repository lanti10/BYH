"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Users } from "lucide-react";
import Image from "next/image";

type Role = "TRAINER" | "CLIENT";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);

  async function selectRole(role: Role) {
    setSelected(role);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push(role === "TRAINER" ? "/trainer" : "/client");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D42B27] p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-2xl">
            <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-wide">BUILD YOUR HEALTH</h1>
            <p className="text-white/80 mt-1">
              Ciao {user?.firstName}! Come vuoi usare la piattaforma?
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <Card
            className={`cursor-pointer transition-all border-2 bg-white/10 backdrop-blur text-white hover:bg-white/20 ${selected === "TRAINER" ? "border-white" : "border-transparent"}`}
            onClick={() => !loading && selectRole("TRAINER")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Dumbbell className="h-5 w-5" />
                </div>
                Sono un Personal Trainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">
                Gestisci i tuoi clienti, crea schede di allenamento e guadagna con i prodotti BYH.
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-2 bg-white/10 backdrop-blur text-white hover:bg-white/20 ${selected === "CLIENT" ? "border-white" : "border-transparent"}`}
            onClick={() => !loading && selectRole("CLIENT")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                Sono un Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">
                Segui le tue schede, traccia i progressi e ricevi consigli personalizzati dal tuo trainer.
              </p>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <p className="text-center text-white/70 text-sm animate-pulse">
            Configurazione in corso...
          </p>
        )}
      </div>
    </div>
  );
}
