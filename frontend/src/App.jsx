// 프로그램 목록을 불러오고 기존 해시 경로에 맞는 페이지를 연결합니다.
import { PERIOD, BUILD_MARKER, WORDING_MARKER } from './utils/programData.js';
import { useRoute } from './hooks/useRoute.js';
import { usePrograms } from './hooks/usePrograms.js';
import { ProgramLoadState } from './components/ProgramLoadState.jsx';
import { Logo, Header } from './components/Common.jsx';
import { Home } from './pages/Home.jsx';
import { TrendPage } from './pages/TrendPage.jsx';
import { ProgramList } from './pages/ProgramList.jsx';
import { Detail } from './pages/ProgramDetail.jsx';
import './styles/App.css';

function App() {
  const [path, go] = useRoute();
  const { programs, status, reload } = usePrograms(path);
  const current = path.startsWith('/program/') ? programs.find((p) => p.program_id === path.split('/')[2]) : null;
  return (
    <div className="site" data-build={BUILD_MARKER} data-patch-check={WORDING_MARKER}>
      <Header path={path} go={go} />
      {status !== 'success' ? <ProgramLoadState status={status} onReload={reload} /> : path === '/trends' ? <TrendPage programs={programs} go={go} /> : path === '/programs' ? <ProgramList programs={programs} go={go} /> : current ? <Detail key={current.program_id} p={current} go={go} /> : path.startsWith('/program/') ? (
        <main className="container page"><p>프로그램을 찾을 수 없습니다.</p><button className="primary" onClick={() => go('/programs')}>프로그램 목록 보기</button></main>
      ) : <Home programs={programs} go={go} />}
      <footer className="footer container"><Logo /><span>{PERIOD} · MBN 프로그램 콘텐츠 전략 분석 · V8</span></footer>
    </div>
  );
}

export { App };
export default App;
