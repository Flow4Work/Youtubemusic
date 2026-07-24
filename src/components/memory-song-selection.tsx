import { CheckIcon, RefreshIcon, SparklesIcon } from "@/components/icons";
import { MEMORY_TOPICS, getMemoryTopic, orderedStyles } from "@/lib/memory-song";
import type { GenerationTarget, MemorySongStyle } from "@/lib/types";
import styles from "@/components/memory-song.module.css";

interface Props {
  topicId: string;
  style: MemorySongStyle | "";
  canGenerate: boolean;
  loadingTarget: GenerationTarget | null;
  remainingSeconds: number | null;
  cooldownSeconds: number;
  onTopic: (id: string) => void;
  onStyle: (style: MemorySongStyle) => void;
  onGenerate: () => void;
}

function loadingLabel(remainingSeconds: number | null): string {
  if (remainingSeconds === null) return "생성 중";
  if (remainingSeconds <= 0) return "생성 마무리 중";
  return `생성 중 · 약 ${remainingSeconds}초 남음`;
}

export function MemorySongSelection(props: Props) {
  const selectedTopic = getMemoryTopic(props.topicId);
  const styleOptions = orderedStyles(selectedTopic);
  const buttonLabel = props.cooldownSeconds > 0
    ? `잠시 대기 · ${props.cooldownSeconds}초 후 가능`
    : props.loadingTarget
      ? loadingLabel(props.remainingSeconds)
      : selectedTopic && props.style
        ? "암기송 만들기"
        : "주제와 스타일 선택 후 만들기";

  return <aside className="selection-shell studio-selection memory-selection" aria-label="암기 주제와 음악 스타일 선택">
    <div className="selection-top">
      <div>
        <p className="panel-eyebrow">MEMORY SONG</p>
        <h2>암기송 만들기</h2>
        <p>주제를 고르면 잘 맞는 음악 스타일 3개를 먼저 추천합니다.</p>
      </div>
    </div>

    <div className="selection-content">
      <section className="selection-block">
        <div className="selection-label"><span>1</span><strong>암기 주제 선택</strong></div>
        <div className={styles.topicGrid} role="listbox" aria-label="암기 주제 목록">
          {MEMORY_TOPICS.map((topic) => <button
            key={topic.id}
            type="button"
            role="option"
            aria-selected={props.topicId === topic.id}
            onClick={() => props.onTopic(topic.id)}
            className={`${styles.topicButton} ${props.topicId === topic.id ? styles.selected : ""}`}
          >
            <span>{topic.title}</span>
            {props.topicId === topic.id && <CheckIcon className="size-4.5"/>}
          </button>)}
        </div>
      </section>

      <section className="selection-block">
        <div className="selection-label"><span>2</span><strong>음악 스타일 선택</strong></div>
        {!selectedTopic ? <div className="selection-empty memory-style-empty"><p>먼저 암기 주제를 선택해 주세요.</p></div> : <>
          <p className={styles.styleHelper}>추천 스타일을 우선 표시했습니다. 다른 스타일도 자유롭게 선택할 수 있습니다.</p>
          <div className={styles.styleGrid} role="listbox" aria-label="음악 스타일 목록">
            {styleOptions.map((style) => {
              const recommended = selectedTopic.recommendedStyles.includes(style);
              const selected = props.style === style;
              return <button
                key={style}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => props.onStyle(style)}
                className={`${styles.styleButton} ${selected ? styles.selected : ""}`}
              >
                <span>{style}</span>
                {recommended && <small>추천</small>}
                {selected && <CheckIcon className="size-4"/>}
              </button>;
            })}
          </div>
        </>}
      </section>

      <section className="selection-block memory-generate-block">
        <div className="selection-label"><span>3</span><strong>암기송 생성</strong></div>
        <button type="button" onClick={props.onGenerate} disabled={!props.canGenerate} className={`generate-button ${styles.generateButton}`}>
          {props.loadingTarget ? <RefreshIcon className="size-5 animate-spin"/> : <SparklesIcon className="size-5"/>}
          <span>{buttonLabel}</span>
        </button>
      </section>
    </div>
  </aside>;
}
