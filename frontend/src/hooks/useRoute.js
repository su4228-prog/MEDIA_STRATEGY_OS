// 기존 해시 주소와 스크롤 동작을 유지하는 라우팅 훅입니다.
import { useEffect, useState } from 'react';

function getRoute() {
  const h = decodeURI(window.location.hash.slice(1));
  return h.startsWith('/') ? h : '/';
}

function useRoute() {
  const [path, setPath] = useState(getRoute);
  useEffect(() => {
    const fn = () => setPath(getRoute());
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return [
    path,
    (p) => {
      window.location.hash = p;
      setPath(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  ];
}

export { getRoute, useRoute };
