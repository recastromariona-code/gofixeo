import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type TrustSpecialist = {
  id: string;
  name: string;
  role: string;
  image: string;
  searchQuery?: string;
};

const DEFAULT_SPECIALISTS: TrustSpecialist[] = [
  {
    id: "1",
    name: "Técnica HVAC",
    role: "Aire acondicionado",
    image: "/trust/specialist-1.png",
    searchQuery: "Aire acondicionado",
  },
  {
    id: "2",
    name: "Técnico climatización",
    role: "Climatización",
    image: "/trust/specialist-2.png",
    searchQuery: "Climatización",
  },
  {
    id: "3",
    name: "Técnico mantenimiento",
    role: "Mantenimiento",
    image: "/trust/specialist-3.png",
    searchQuery: "Mantenimiento",
  },
];

function SpecialistCard({ specialist }: { specialist: TrustSpecialist }) {
  return (
    <Link
      to="/search"
      search={{ q: specialist.searchQuery } as never}
      className="group relative flex shrink-0 flex-col items-center gap-2 px-2"
    >
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/40 to-primary-glow/40 opacity-0 blur-sm transition duration-300 group-hover:opacity-100" />
        <div className="relative overflow-hidden rounded-2xl border-2 border-border/80 bg-card shadow-soft transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-elevated">
          <img
            src={specialist.image}
            alt={specialist.name}
            className="h-12 w-12 object-cover object-top sm:h-14 sm:w-14"
            loading="lazy"
          />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-card bg-success text-[9px] font-bold text-success-foreground">
          ✓
        </span>
      </div>
      <div className="max-w-[5.5rem] text-center opacity-80 transition group-hover:opacity-100">
        <p className="truncate text-[11px] font-semibold text-foreground">{specialist.role}</p>
      </div>
    </Link>
  );
}

function MarqueeTrack({
  specialists,
  ariaHidden = false,
}: {
  specialists: TrustSpecialist[];
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="trust-marquee-track flex w-max items-start gap-4 pr-4"
      aria-hidden={ariaHidden}
    >
      {specialists.map((specialist) => (
        <SpecialistCard key={`${ariaHidden ? "dup-" : ""}${specialist.id}`} specialist={specialist} />
      ))}
    </div>
  );
}

export function TrustSpecialistsBar({
  specialists = DEFAULT_SPECIALISTS,
  className,
}: {
  specialists?: TrustSpecialist[];
  className?: string;
}) {
  const loop = [...specialists, ...specialists];

  return (
    <div className={cn("relative mt-10", className)}>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <p className="text-sm font-medium text-foreground">
            Especialistas verificados en la plataforma
          </p>
          <Link
            to="/search"
            className="shrink-0 text-xs font-semibold text-primary transition hover:text-primary-glow"
          >
            Ver todos →
          </Link>
        </div>

        <div className="trust-marquee group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card/90 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card/90 to-transparent" />

          <div className="trust-marquee-inner flex w-max gap-4">
            <MarqueeTrack specialists={loop} />
            <MarqueeTrack specialists={loop} ariaHidden />
          </div>
        </div>
      </div>
    </div>
  );
}
