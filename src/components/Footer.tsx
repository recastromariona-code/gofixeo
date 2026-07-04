import { Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Wrench className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold">FIXEO</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            El marketplace de servicios técnicos y del hogar en Latinoamérica.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Explorar</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">Buscar servicio</Link></li>
            <li><Link to="/become-provider" className="hover:text-foreground">Ser prestador</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Categorías</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Aires acondicionados</li>
            <li>Electricistas</li>
            <li>Fontanería</li>
            <li>Más servicios</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Términos</li>
            <li>Privacidad</li>
            <li>Contacto</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FIXEO — Encontrar un técnico confiable, tan fácil como pedir un Uber.
      </div>
    </footer>
  );
}
