'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/*
 * 화면 모드 — 06번 문서 §5 의 "역할 토글".
 *
 * 관리자 모드는 개발·운영이 화면 사이를 자유롭게 오가기 위한 것이고,
 * 유저 모드는 강사가 실제로 보는 그대로다.
 *
 * 토글은 화면에만 영향을 준다. 권한이 아니다 —
 * 관리자 API 는 서버에서 따로 막는다. 09번 문서가 IP 화이트리스트 + 2FA 를
 * 요구하고 있고, 그건 이 토글로 대체되지 않는다.
 */

export type ViewMode = 'user' | 'admin';

const KEY = 'hg_view_mode';

interface ModeContext {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  /** 첫 렌더에서는 localStorage 를 못 읽는다. 그 사이 깜빡임을 막는다. */
  ready: boolean;
}

const Ctx = createContext<ModeContext>({ mode: 'user', setMode: () => {}, ready: false });

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>('user');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved === 'admin' || saved === 'user') setModeState(saved);
    } catch {
      // 프라이빗 모드 등에서 접근이 막힐 수 있다. 기본값으로 간다.
    }
    setReady(true);
  }, []);

  function setMode(m: ViewMode) {
    setModeState(m);
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      // 저장 못 해도 이번 세션에서는 동작한다.
    }
  }

  return <Ctx.Provider value={{ mode, setMode, ready }}>{children}</Ctx.Provider>;
}

export function useMode(): ModeContext {
  return useContext(Ctx);
}
