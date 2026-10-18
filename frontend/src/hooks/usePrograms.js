// 첫 데이터 연결만 재시도하고, 성공한 프로그램 목록은 해시 경로 이동에도 재사용합니다.
import { useEffect, useRef, useState } from 'react';
import { loadPrograms } from '../utils/loadPrograms.js';

export function usePrograms(path) {
  const [programs, setPrograms] = useState([]);
  const [status, setStatus] = useState('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return undefined;
    const controller = new AbortController();
    const { signal } = controller;
    // 로딩 중 경로가 바뀌면 이전 요청을 정리하고 새 연결 안내를 시작합니다.
    setStatus('loading');
    const delayed = setTimeout(() => setStatus('delayed'), 6_000);

    loadPrograms({ signal, onRetry: () => setStatus('delayed') })
      .then((data) => {
        if (signal.aborted) return;
        loaded.current = true;
        setPrograms(data);
        setStatus('success');
      })
      .catch(() => {
        if (!signal.aborted) setStatus('error');
      })
      .finally(() => clearTimeout(delayed));

    return () => {
      clearTimeout(delayed);
      controller.abort();
    };
  }, [path, reloadKey]);

  const reload = () => {
    setStatus('loading');
    setReloadKey((value) => value + 1);
  };

  return { programs, status, reload };
}
