import { Link } from "@tanstack/react-router";
import logoLight from "@/assets/fixeo-logo-light.png.asset.json";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <img src={logoLight.url} alt="FIXEO" className="h-10 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            El marketplace de especialistas del hogar, técnicos y oficios en Latinoamérica.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Explorar</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">Buscar especialista del hogar</Link></li>
            <li><Link to="/become-provider" className="hover:text-foreground">Ser prestador de servicios</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Técnicos y oficios</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Aires acondicionados</li>
            <li>Electricistas</li>
            <li>Fontanería</li>
            <li>Más oficios</li>
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
        © {new Date().getFullYear()} FIXEO — Encontrar un especialista del hogar de confianza, tan fácil como pedir un Uber.
      </div>
    </footer>
  );
}
