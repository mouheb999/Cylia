import Header from "@/components/Header";
import Squelette from "@/components/ui/Squelette";

/** Les formules arrivent en deux temps : la mise en page, puis les cabines. */
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

        <div className="grid grid-cols-2 gap-3 px-4 py-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-sand bg-white">
              <span
                aria-hidden="true"
                className="squelette block aspect-[4/3] !bg-black/[0.06]"
              />
              <span className="block px-3 pb-3 pt-2.5">
                <span
                  aria-hidden="true"
                  className="squelette block h-4 w-4/5 !bg-black/[0.06]"
                />
                <span
                  aria-hidden="true"
                  className="squelette mt-2 block h-3 w-full !bg-black/[0.06]"
                />
                <span
                  aria-hidden="true"
                  className="squelette mt-3 block h-5 w-1/3 !bg-black/[0.06]"
                />
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
