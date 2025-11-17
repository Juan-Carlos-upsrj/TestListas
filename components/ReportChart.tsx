import React, { useMemo, useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportChartProps {
  monthlyAttendance: { [monthYear: string]: number };
  height?: string;
}

const ReportChart: React.FC<ReportChartProps> = ({ monthlyAttendance, height = '300px' }) => {
  const [chartThemeColors, setChartThemeColors] = useState({
    primary: 'rgba(37, 99, 235, 0.8)', // blue-600
    primaryBorder: 'rgba(37, 99, 235, 1)',
    textSecondary: '#64748b' // slate-500
  });

  useEffect(() => {
    // This effect ensures the chart colors update when the theme changes.
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--color-primary').trim() || '#2563eb';
    const textSecondaryColor = rootStyles.getPropertyValue('--color-text-secondary').trim() || '#64748b';

    const hexToRgba = (hex: string, alpha: number) => {
      let c: any;
      if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
      }
      return hex; // Fallback if not hex
    };

    setChartThemeColors({
      primary: hexToRgba(primaryColor, 0.8),
      primaryBorder: hexToRgba(primaryColor, 1),
      textSecondary: textSecondaryColor,
    });
  }, []); // Re-run this logic only when the component mounts, assuming theme is set on App load.

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
          backgroundColor: chartThemeColors.primary,
          borderColor: chartThemeColors.primaryBorder,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [monthlyAttendance, chartThemeColors]);

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
                color: chartThemeColors.textSecondary,
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
                color: chartThemeColors.textSecondary,
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