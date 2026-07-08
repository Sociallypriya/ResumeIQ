function getSignal(score) {
  if (score >= 75) return { tag: "pass", label: "Strong match" };
  if (score >= 50) return { tag: "warn", label: "Needs work" };
  return { tag: "fail", label: "Weak match" };
}

export default function ScoreGauge({ score }) {
  const { tag, label } = getSignal(score);

  return (
    <div className="score-block">
      <div>
        <div className="score-number">{score}</div>
        <div className="score-label">/ 100 combined score</div>
      </div>
      <span className={`score-tag ${tag}`}>{label}</span>
    </div>
  );
}
