export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-800">
      <h2 className="text-4xl font-black mb-2">404</h2>
      <p className="text-slate-500 mb-6 font-medium">Página não encontrada</p>
      <a
        href="/"
        className="px-6 py-3 bg-v-blue-500 text-white rounded-xl font-bold transition-all hover:bg-v-blue-600"
      >
        Voltar para o Início
      </a>
    </div>
  );
}
