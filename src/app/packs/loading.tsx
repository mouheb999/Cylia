import Header from "@/components/Header";
import Squelette from "@/components/ui/Squelette";

/** Les formules arrivent en deux temps : la mise en page, puis les catégories. */
export default function ChargementPacks() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="flex flex-col items-center bg-noir px-5 pb-8 pt-8">
          <Squelette className="h-3 w-32" />
          <Squelette className="mt-4 h-9 w-48 max-w-full" />
          <Squelette className="mt-4 h-4 w-64 max-w-full" />
        </div>

        <div className="mx-auto max-w-[40rem] space-y-4 px-4 py-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="squelette block aspect-[4/3] rounded-3xl !bg-black/[0.06] sm:aspect-[16/9]"
            />
          ))}
        </div>
      </main>
    </>
  );
}
