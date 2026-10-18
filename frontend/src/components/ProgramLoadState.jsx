// 기존 컨테이너·패널·버튼 스타일로 초기 연결 상태만 안내합니다.
export function ProgramLoadState({ status, onReload }) {
  const failed = status === 'error';
  const delayed = status === 'delayed';
  const title = failed ? '분석 데이터를 불러오지 못했습니다'
    : delayed ? '데이터 연결이 지연되고 있습니다'
      : '분석 데이터를 불러오고 있습니다';
  const description = failed ? '일시적인 연결 문제일 수 있습니다. 다시 시도해 주세요.'
    : delayed ? '서버 연결을 다시 시도하고 있습니다. 잠시만 기다려 주세요.'
      : '서버를 준비하는 중입니다. 잠시만 기다려 주세요.';

  return (
    <main className="container page" aria-busy={!failed}>
      <section className="panel" role="status" aria-live="polite" aria-atomic="true">
        <h2>{title}</h2>
        <p>{description}</p>
        {failed && <button className="primary" onClick={onReload}>다시 불러오기</button>}
      </section>
    </main>
  );
}
