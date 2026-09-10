import { contenusAdmin } from "@/lib/donnees-admin";
import GestionContenu from "@/components/admin/GestionContenu";

export const metadata = { title: "Contenu — CYLIA" };

export default async function PageContenu() {
  const contenus = await contenusAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Textes du site</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Vous pouvez aussi modifier ces textes directement sur le site&nbsp;: ouvrez
        une page et touchez « Modifier le site » en bas de l&apos;écran. Les photos
        se changent de la même façon.
      </p>

      <GestionContenu contenus={contenus} />
    </div>
  );
}
