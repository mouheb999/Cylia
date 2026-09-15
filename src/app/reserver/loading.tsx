import Header from "@/components/Header";
import Squelette from "@/components/ui/Squelette";

/**
 * L'en-tête est rendu ici aussi, et ce n'est pas un doublon utile à moitié :
 * il s'affiche donc dès le clic, avec son menu et ses compteurs, pendant que le
 * catalogue arrive. Sans lui, la page partirait d'un écran entièrement vide.
 */
export default function ChargementReservation() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-noir">
        <div className="flex flex-col items-center px-5 pb-8 pt-8">
          <Squelette className="h-3 w-40" />
          <Squelette className="mt-4 h-9 w-64 max-w-full" />
          <Squelette className="mt-3 h-8 w-44" />
        </div>

        <div className="px-5 pb-16">
          <div className="mb-7 flex gap-2">
            <Squelette className="h-8 flex-1" />
            <Squelette className="h-8 flex-1" />
            <Squelette className="h-8 flex-1" />
          </div>

          <Squelette className="h-8 w-56" />

          <div className="mt-5 flex gap-2">
            <Squelette className="h-10 flex-1 rounded-full" />
            <Squelette className="h-10 flex-1 rounded-full" />
            <Squelette className="h-10 flex-1 rounded-full" />
          </div>

          <div className="mt-5 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
              >
                <Squelette className="h-[4.5rem] w-[4.5rem]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Squelette className="h-5 w-40" />
                  <Squelette className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
