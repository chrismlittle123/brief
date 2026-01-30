import Image from "next/image";

interface BriefLogoProps {
  className?: string;
}

export function BriefLogo({ className = "h-16 w-auto" }: BriefLogoProps) {
  return (
    <Image
      src="/brief-logo.png"
      alt="Brief"
      width={912}
      height={468}
      className={className}
      priority
    />
  );
}
