'use client';

export default function AuroraBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 animate-aurora"
          style={{
            background: `
              radial-gradient(1200px 800px at 10% 20%, rgba(29, 61, 141, 0.15), transparent 60%),
              radial-gradient(900px 700px at 80% 30%, rgba(124, 58, 237, 0.12), transparent 60%),
              radial-gradient(800px 600px at 50% 80%, rgba(80, 145, 205, 0.10), transparent 60%),
              linear-gradient(180deg, #0b0f1a 0%, #05070c 100%)
            `,
            filter: 'blur(2px)',
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(120% 80% at 50% 120%, transparent 45%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    </>
  );
}
