import { KeywordStat } from '@/types/recommender';

export default function WordCloud({ keywords }: { keywords: KeywordStat[] }) {
  if (!keywords.length) return null;
  const max = Math.max(...keywords.map(k => k.freq));
  const min = Math.min(...keywords.map(k => k.freq));
  const size = (f: number) =>
    max === min ? 20 : 14 + ((f - min) / (max - min)) * 26; // 14~40px

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '10px 16px',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      {keywords.map((k, i) => (
        <span key={k.word} style={{
          fontSize: `${size(k.freq)}px`,
          fontWeight: 700,
          color: i % 3 === 0 ? 'var(--sl-primary)' : i % 3 === 1 ? 'var(--sl-green)' : 'var(--sl-ink)',
          lineHeight: 1,
        }}>
          {k.word}
        </span>
      ))}
    </div>
  );
}
