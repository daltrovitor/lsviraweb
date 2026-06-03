'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-800">
      <h2 className="text-2xl font-black mb-4">Algo deu errado!</h2>
      <button
        className="px-4 py-2 bg-v-blue-500 text-white rounded-lg font-bold"
        onClick={() => reset()}
      >
        Tentar Novamente
      </button>
    </div>
  );
}
