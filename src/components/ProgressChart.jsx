import React, { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { getProgressLog, getAllSections } from '../utils/storage'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COLORS = {
  'Core Engineering': '#F9A825',
  'Project': '#FB8C00',
  'Job': '#43A047',
  'Market Analysis': '#1E88E5',
};

export default function ProgressChart() {
  const [log, setLog] = useState([]);
  const [activeSections, setActiveSections] = useState(getAllSections());

  useEffect(() => {
    setLog(getProgressLog());
  }, []);

  const sections = getAllSections();

  const dates = [...new Set(log.map(p => p.date))].sort();
  const last30 = dates.slice(-30);

  const datasets = sections
    .filter(s => activeSections.includes(s))
    .map(section => {
      const data = last30.map(date => {
        const entry = log.find(p => p.date === date && p.section === section);
        return entry ? entry.progress : null;
      });
      return {
        label: section,
        data,
        borderColor: COLORS[section],
        backgroundColor: COLORS[section] + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        spanGaps: true,
      };
    });

  const chartData = {
    labels: last30.map(d => {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 11, family: 'Inter' }
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: '#3E2723',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw)}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v) => v + '%',
          font: { size: 10, family: 'Inter' },
          color: '#8D6E63'
        },
        grid: { color: '#FFE08220' }
      },
      x: {
        ticks: {
          font: { size: 10, family: 'Inter' },
          color: '#8D6E63',
          maxTicksLimit: 15,
        },
        grid: { display: false }
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Progress Over Time</h1>
        <p>Track how your progress evolves across sections</p>
      </div>

      <div className="section-tabs" style={{ marginBottom: '16px' }}>
        {sections.map(s => (
          <button
            key={s}
            className={`section-tab ${activeSections.includes(s) ? 'active' : ''}`}
            onClick={() => {
              setActiveSections(prev =>
                prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
              );
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[s], marginRight: 6 }}></span>
            {s}
          </button>
        ))}
      </div>

      <div className="chart-container" style={{ height: '400px' }}>
        {last30.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="empty-state">
            <div className="icon">📊</div>
            <p>No progress data yet. Complete some tasks to see your chart.</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid-2" style={{ marginTop: '20px' }}>
        {sections.map(section => {
          const sectionLog = log.filter(p => p.section === section);
          const latest = sectionLog[sectionLog.length - 1];
          const avg = sectionLog.length > 0
            ? Math.round(sectionLog.reduce((s, p) => s + p.progress, 0) / sectionLog.length)
            : 0;

          return (
            <div key={section} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{section}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Latest: {latest ? Math.round(latest.progress) + '%' : 'N/A'}
                </span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Average: {avg}% • Data points: {sectionLog.length}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
