import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';

export const metadata = {
  title: 'RCB Lion Preview',
};

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-2xl font-bold mb-4">RCB Lion Preview</h1>
        <p className="text-sm text-gray-600 mb-6">Client-side canvas animation with pulsing red background.</p>
        <div className="mx-auto" style={{ width: 520, height: 520 }}>
          <RCBLionLogo className="mx-auto w-[520px] h-[520px]" />
        </div>
      </div>
    </main>
  );
}
