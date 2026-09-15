import Header from "@/components/Header";
import Squelette from "@/components/ui/Squelette";

/** La vitrine arrive en deux temps : la mise en page, puis les flacons. */
export default function ChargementBoutique() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="flex flex-col items-center bg-noir px-5 pb-8 pt-8">
          <Squelette className="h-3 w-32" />
          <Squelette className="mt-4 h-9 w-56 max-w-full" />
          <Squelette className="mt-3 h-4 w-64 max-w-full" />
        </div>

        <div className="px-4 py-6">
          <span
            aria-hidden="true"
            className="squelette block h-11 rounded-full !bg-black/[0.06]"
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-sand bg-white p-3">
                <span
                  aria-hidden="true"
                  className="squelette block aspect-square !bg-black/[0.06]"
                />
                <span
                  aria-hidden="true"
                  className="squelette mt-3 block h-4 w-4/5 !bg-black/[0.06]"
                />
                <span
                  aria-hidden="true"
                  className="squelette mt-2 block h-4 w-1/3 !bg-black/[0.06]"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
