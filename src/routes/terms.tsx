import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Términos de Servicio — FIXEO" },
      {
        name: "description",
        content:
          "Términos y condiciones de uso de la plataforma FIXEO para contratación de servicios del hogar.",
      },
      { property: "og:title", content: "Términos de Servicio — FIXEO" },
      {
        property: "og:description",
        content:
          "Términos y condiciones de uso de la plataforma FIXEO para contratación de servicios del hogar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Términos de Servicio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introducción</h2>
            <p className="mt-2">
              Bienvenido a FIXEO. Estos Términos de Servicio regulan el acceso y uso de nuestra plataforma,
              que conecta a usuarios que buscan servicios del hogar con prestadores de servicios
              especializados. Al utilizar FIXEO, aceptas estos términos en su totalidad.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Definiciones</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Plataforma:</strong> El sitio web y servicios operados por FIXEO.</li>
              <li><strong>Usuario:</strong> Cualquier persona que accede o utiliza la Plataforma.</li>
              <li><strong>Cliente:</strong> Usuario que solicita servicios a través de FIXEO.</li>
              <li><strong>Prestador:</strong> Usuario que ofrece servicios profesionales a través de FIXEO.</li>
              <li><strong>Servicio:</strong> Cualquier trabajo o actividad solicitada o prestada a través de la Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Registro y Cuentas</h2>
            <p className="mt-2">
              Para utilizar ciertas funciones de FIXEO, debes registrarte y crear una cuenta.
              Eres responsable de mantener la confidencialidad de tus credenciales y de todas las
              actividades que ocurran bajo tu cuenta. Debes proporcionar información veraz, completa
              y actualizada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Uso de la Plataforma</h2>
            <p className="mt-2">
              FIXEO actúa como un marketplace que facilita el contacto entre Clientes y Prestadores.
              No somos parte de los contratos de servicio que se generen entre usuarios, ni garantizamos
              la calidad, puntualidad o resultado de los servicios prestados.
            </p>
            <p className="mt-2">
              Queda prohibido:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Utilizar la Plataforma para fines ilegales o no autorizados.</li>
              <li>Publicar contenido falso, engañoso o difamatorio.</li>
              <li>Interferir con el funcionamiento de la Plataforma o con la experiencia de otros usuarios.</li>
              <li>Contactar a otros usuarios fuera de la Plataforma para evitar las tarifas o procesos de FIXEO.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Responsabilidades del Prestador</h2>
            <p className="mt-2">
              Los Prestadores son responsables de:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Cumplir con las leyes y regulaciones aplicables a su actividad.</li>
              <li>Tener las licencias, permisos y seguros necesarios para prestar sus servicios.</li>
              <li>Responder por la calidad, seguridad y garantía de sus trabajos.</li>
              <li>Tratar a los Clientes con profesionalismo y respeto.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Responsabilidades del Cliente</h2>
            <p className="mt-2">
              Los Clientes se comprometen a:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Describir con precisión el servicio que necesitan.</li>
              <li>Pagar los montos acordados con el Prestador de forma puntual.</li>
              <li>Proporcionar un entorno seguro para que el Prestador pueda realizar su trabajo.</li>
              <li>No solicitar servicios ilegales o peligrosos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Pagos y Tarifas</h2>
            <p className="mt-2">
              FIXEO puede cobrar tarifas por el uso de ciertas funciones de la Plataforma.
              Las tarifas aplicables se mostrarán claramente antes de cualquier transacción.
              Los pagos entre Clientes y Prestadores se acuerdan directamente entre las partes,
              salvo que se indique lo contrario en una funcionalidad específica de la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Cancelaciones</h2>
            <p className="mt-2">
              Tanto Clientes como Prestadores pueden cancelar solicitudes de servicio antes de que
              estos comiencen. Las políticas específicas de cancelación y posibles penalizaciones
              se detallarán en la confirmación de cada servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Reseñas y Calificaciones</h2>
            <p className="mt-2">
              Los usuarios pueden dejar reseñas y calificaciones sobre los servicios recibidos o prestados.
              Las reseñas deben ser honestas, respetuosas y basadas en experiencias reales.
              Nos reservamos el derecho de eliminar reseñas que violen estas políticas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Propiedad Intelectual</h2>
            <p className="mt-2">
              Todo el contenido de la Plataforma, incluyendo textos, gráficos, logos, imágenes y software,
              es propiedad de FIXEO o de sus licenciantes y está protegido por las leyes de propiedad
              intelectual aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Limitación de Responsabilidad</h2>
            <p className="mt-2">
              FIXEO no será responsable por daños directos, indirectos, incidentales, especiales o
              consecuentes que resulten del uso o la imposibilidad de usar la Plataforma, incluyendo
              pero no limitado a, disputas entre Clientes y Prestadores, daños a la propiedad o
              lesiones personales durante la prestación de servicios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Modificaciones</h2>
            <p className="mt-2">
              Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento.
              Los cambios entrarán en vigor cuando se publiquen en la Plataforma. El uso continuado
              de FIXEO después de cualquier modificación constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Terminación</h2>
            <p className="mt-2">
              Podemos suspender o terminar tu cuenta y el acceso a la Plataforma si violas estos
              Términos de Servicio o si consideramos que tu conducta perjudica a otros usuarios
              o a FIXEO. También puedes eliminar tu cuenta en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Ley Aplicable</h2>
            <p className="mt-2">
              Estos Términos se regirán e interpretarán de acuerdo con las leyes del país donde FIXEO
              opera su sede principal, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
              Cualquier disputa se someterá a los tribunales competentes de dicha jurisdicción.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">15. Contacto</h2>
            <p className="mt-2">
              Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos a través de
              los canales disponibles en la Plataforma o por correo electrónico a soporte@gofixeo.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
