import Image from 'next/image';

interface IconProps {
  name: 'cricket' | 'stats' | 'news' | 'team' | 'target' | 'trophy';
  className?: string;
  size?: number;
}

export default function Icon({ name, className = '', size = 24 }: IconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      className={`inline-block ${className}`}
    />
  );
}
