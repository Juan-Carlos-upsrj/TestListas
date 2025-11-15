import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportChartProps {
  monthlyAttendance: { [monthYear: string]: number };
  height?: string;
}

const ReportChart: React.FC<ReportChartProps> = ({ monthlyAttendance, height = '300px' }) => {

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
          backgroundColor: 'rgba(48, 63, 159, 0.8)', // iaev-blue-dark
          borderColor: 'rgba(26, 35, 126, 1)', // iaev-blue-darker
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [monthlyAttendance]);

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
                color: '#78909C', // iaev-text-secondary
                callback: function(value: string | number) {
                    return value + '%';
                }
            },
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
            }
        },
        x: {
             ticks: {
                color: '#78909C', // iaev-text-secondary
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