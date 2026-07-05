import logoDark from "@/assets/fixeo-logo-dark.png.asset.json";
import logoLight from "@/assets/fixeo-logo-light.png.asset.json";
import { cn } from "@/lib/utils";

type FixeoLogoProps = {
  className?: string;
  alt?: string;
};

export function FixeoLogo({ className, alt = "FIXEO" }: FixeoLogoProps) {
  return (
    <>
      <img src={logoLight.url} alt={alt} className={cn("h-9 w-auto dark:hidden", className)} />
      <img src={logoDark.url} alt={alt} className={cn("hidden h-9 w-auto dark:block", className)} />
    </>
  );
}
