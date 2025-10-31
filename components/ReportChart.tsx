import React, { useContext, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AppContext } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportChartProps {
  monthlyAttendance: { [monthYear: string]: number };
  height?: string;
}

const ReportChart: React.FC<ReportChartProps> = ({ monthlyAttendance, height = '300px' }) => {
  const { state } = useContext(AppContext);
  const isDarkMode = state.settings.theme === 'dark';

  const chartData = useMemo(() => {
    const sortedMonths = Object.keys(monthlyAttendance).sort((a, b) => {
        const aDate = new Date(`01 ${a}`);
        const bDate = new Date(`01 ${b}`);
        return aDate.getTime() - bDate.getTime();
    });

    const labels = sortedMonths.map(monthYear => {
        const month = monthYear.split(' ')[0];
        return month.charAt(0).toUpperCase() + month.slice(1);
    });
    const data = sortedMonths.map(monthYear => monthlyAttendance[monthYear]);
    
    return {
      labels: labels,
      datasets: [
        {
          label: 'Asistencia Promedio (%)',
          data: data,
          backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.8)', // Indigo-500
          borderColor: isDarkMode ? 'rgba(129, 140, 248, 1)' : 'rgba(79, 70, 229, 1)', // Indigo-400 / Indigo-600
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [monthlyAttendance, isDarkMode]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
            callbacks: {
                label: function(context: any) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y.toFixed(1) + '%';
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: {
                stepSize: 20,
                color: isDarkMode ? '#94a3b8' : '#475569',
                callback: function(value: string | number) {
                    return value + '%';
                }
            },
            grid: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
        },
        x: {
             ticks: {
                color: isDarkMode ? '#94a3b8' : '#475569',
            },
             grid: {
                display: false,
            }
        }
    }
  };

  return <div style={{ height }}><Bar options={options} data={chartData} /></div>;
};

export default React.memo(ReportChart);