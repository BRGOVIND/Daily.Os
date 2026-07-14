import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  /** Decorative when a nearby wordmark already names the app. */
  decorative?: boolean;
}

/** The Daily OS app icon, rendered from the shipped PNG asset. */
export function BrandMark({ size = 28, className, decorative }: BrandMarkProps) {
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Daily OS"}
      aria-hidden={decorative || undefined}
      className={cn("inline-block bg-contain bg-center bg-no-repeat", className)}
      style={{ width: size, height: size, backgroundImage: "url(/brand.png)" }}
    />
  );
}
