// ============================================================================
// Placeholder Pages — replaced in later phases
// ============================================================================

import { Header } from '@/components/layout/Header';
import { Calendar, BookOpen, Bot, FileQuestion } from 'lucide-react';

export function CalendarPage() {
  return (
    <>
      <Header title="Calendario" />
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <Calendar className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400">Calendario — Fase 4</p>
      </div>
    </>
  );
}

export function ToolkitPage() {
  return (
    <>
      <Header title="Materiali" />
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <BookOpen className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400">Toolkit — Fase 5</p>
      </div>
    </>
  );
}

export function AIChatPage() {
  return (
    <>
      <Header title="Assistente AI" />
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <Bot className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400">AI Chat — Fase 6</p>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <FileQuestion className="w-16 h-16 text-gray-600 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 mb-6">Pagina non trovata</p>
      <a
        href="/"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm
                   hover:bg-indigo-700 active:scale-95 transition-all"
      >
        Torna alla home
      </a>
    </div>
  );
}
