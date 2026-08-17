import Image from 'next/image';

interface LogoBadgeProps {
  size?: number;
}

export function LogoBadge({ size = 84 }: LogoBadgeProps) {
  const logoSize = Math.round(size * 0.67);
  const isLarge = size >= 112;
  return (
    <div
      className="flex items-center justify-center bg-white"
      style={{
        width: size,
        height: size,
        borderRadius: isLarge ? 24 : 20,
        marginBottom: isLarge ? 28 : 24,
      }}
    >
      <Image src="/bcsd-logo.svg" alt="BCSD" width={logoSize} height={Math.round((logoSize * 37) / 46)} />
    </div>
  );
}
