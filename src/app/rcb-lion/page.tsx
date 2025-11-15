import RCBLion from '@/components/RCBLion/RCBLion';

export const metadata = {
  title: 'RCB Lion Preview',
};

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-2xl font-bold mb-4">RCB Lion Preview</h1>
        <p className="text-sm text-gray-600 mb-6">Client-side canvas animation with pulsing red background.</p>
        <div className="mx-auto" style={{ width: 420, height: 420 }}>
          <RCBLion width={420} height={420} />
        </div>
        <div className="mt-6">
          <img src="/assets/rcb-lion-logo.svg" alt="RCB logo static" style={{ width: 180, height: 'auto', margin: '0 auto' }} />
        </div>
      </div>
    </main>
  );
}
