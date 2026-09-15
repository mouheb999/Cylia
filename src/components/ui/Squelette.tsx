/**
 * Bloc gris qui occupe la place du contenu à venir.
 *
 * Une page qui arrive doit arriver *quelque part*. Sans squelette, un clic sur
 * un onglet laisse l'écran précédent tel quel jusqu'à la réponse du serveur, et
 * rien ne distingue « ça charge » de « ça n'a pas marché ». Avec, la mise en
 * page apparaît tout de suite et seul le texte se remplit ensuite.
 */
export default function Squelette({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`squelette block ${className}`} />;
}

/** Une carte du panneau, en attente. */
export function CarteSquelette() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Squelette className="h-5 w-24" />
          <Squelette className="h-3.5 w-36" />
          <Squelette className="h-3.5 w-28" />
        </div>
        <Squelette className="h-6 w-20 rounded-full" />
      </div>
      <Squelette className="mt-3 h-3 w-4/5" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Squelette className="h-9 rounded-full" />
        <Squelette className="h-9 rounded-full" />
      </div>
    </div>
  );
}
