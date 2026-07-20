import { ar } from "@/lib/i18n";
import { Link } from "@/router";
import { IconInbox } from "@/components/Icons";

export function NotFound({ title }: { title?: string }) {
  return (
    <div className="container-site flex flex-col items-center gap-4 py-24 text-center">
      <span className="text-muted-foreground/60">
        <IconInbox className="h-12 w-12" />
      </span>
      <h1 className="text-section text-primary">{title ?? ar.error.notFoundTitle}</h1>
      <p className="text-muted-foreground">{ar.error.notFoundHint}</p>
      <Link
        to="/"
        className="mt-2 rounded-btn bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ar.actions.backHome}
      </Link>
    </div>
  );
}
