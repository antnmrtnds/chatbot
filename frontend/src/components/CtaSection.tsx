import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function CtaSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-white" id="contact">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
            Não perca as novidades
          </h2>
          <p className="mx-auto max-w-[600px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Subscreva a nossa newsletter para receber as últimas novidades e ofertas.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-2">
          <form className="flex space-x-2">
            <Input
              type="email"
              placeholder="Introduza o seu email"
              className="max-w-lg flex-1 bg-white text-gray-900"
            />
            <Button type="submit" className="bg-white text-primary hover:bg-gray-200">
              Subscrever
            </Button>
          </form>
          <p className="text-xs text-gray-300">
            Respeitamos a sua privacidade.{" "}
            <Link href="/privacy" className="underline underline-offset-2" prefetch={false}>
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
} 