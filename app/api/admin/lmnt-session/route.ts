import { NextRequest, NextResponse } from 'next/server';
import { getEngineState, saveEngineState, updateLmntSession } from '@/lib/lmnt-state';

// GET: Retorna o estado atual do motor e chaves
export async function GET() {
  const state = getEngineState();
  return NextResponse.json({ success: true, state });
}

// POST: Recebe token de sessão enviado pela extensão do Chrome ou admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, cookie, action, key, name, id, priorities } = body;

    // Ação: atualizar sessão da extensão
    if (token || cookie) {
      const session = updateLmntSession(token || '', cookie || '');
      return NextResponse.json({
        success: true,
        message: 'Sessão do LMNT Playground sincronizada com sucesso!',
        session
      });
    }

    // Ação: adicionar nova chave LMNT
    if (action === 'add_key' && key) {
      const state = getEngineState();
      const newKey = {
        id: 'key-' + Date.now(),
        key: key.trim(),
        name: name?.trim() || 'Chave LMNT #' + (state.keys.length + 1),
        status: 'active' as const,
        charsGenerated: 0,
        errorCount: 0
      };
      state.keys.push(newKey);
      saveEngineState(state);
      return NextResponse.json({ success: true, message: 'Chave adicionada ao pool!', key: newKey });
    }

    // Ação: remover chave
    if (action === 'delete_key' && id) {
      const state = getEngineState();
      state.keys = state.keys.filter(k => k.id !== id);
      saveEngineState(state);
      return NextResponse.json({ success: true, message: 'Chave removida do pool!' });
    }

    // Ação: resetar status de chave (ex: reativar após cota)
    if (action === 'reset_key' && id) {
      const state = getEngineState();
      const target = state.keys.find(k => k.id === id);
      if (target) {
        target.status = 'active';
        target.errorCount = 0;
        saveEngineState(state);
      }
      return NextResponse.json({ success: true, message: 'Status da chave redefinido para ativo!' });
    }

    // Ação: atualizar prioridades do motor
    if (action === 'update_priorities' && priorities) {
      const state = getEngineState();
      state.priorities = priorities;
      saveEngineState(state);
      return NextResponse.json({ success: true, message: 'Prioridades do motor atualizadas!' });
    }

    return NextResponse.json({ success: false, error: 'Parâmetros inválidos' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in lmnt-session route:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
