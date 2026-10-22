import LienSuivi from "@/components/LienSuivi";
import { IconWhatsApp } from "@/components/Icons";

/** Le WhatsApp de la boutique, pour les questions avant achat. */
const NUMERO_CONSEIL = "21651395169";

/**
 * « Besoin de conseil ? » — sous les boutons d'une fiche.
 *
 * Une hésitation sur un shampooing se règle mieux par un message qu'en
 * quittant la page : la conversation s'ouvre avec le nom de l'article déjà
 * écrit, et Meta compte le geste comme une prise de contact.
 */
export default function LienConseil({ nom }: { nom: string }) {
  const message = `Bonjour CYLIA, j'aimerais un conseil au sujet de « ${nom} ».`;

  return (
    <LienSuivi
      evenement="Contact"
      parametres={{ method: "whatsapp", content_name: nom }}
      href={`https://wa.me/${NUMERO_CONSEIL}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex items-center justify-center gap-2 text-sm font-light text-gold-deep"
    >
      <IconWhatsApp className="h-4 w-4 shrink-0" />
      <span>
        Besoin de conseil ?{" "}
        <span className="underline decoration-gold/50 underline-offset-4">
          Écrivez-nous sur WhatsApp
        </span>
      </span>
    </LienSuivi>
  );
}
