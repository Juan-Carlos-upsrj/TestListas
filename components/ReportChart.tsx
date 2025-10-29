// FIX: Import useMemo hook from React.
import React, { useContext, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AppContext } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportData {
  attendance: {
    percentage: number;
  };
}

interface ReportChartProps {
  reportData: ReportData[];
}

const ReportChart: React.FC<ReportChartProps> = ({ reportData }) => {
  const { state } = useContext(AppContext);
  const isDarkMode = state.settings.theme === 'dark';

  const chartData = useMemo(() => {
    const excellent = reportData.filter(d => d.attendance.percentage >= 90).length;
    const good = reportData.filter(d => d.attendance.percentage >= 80 && d.attendance.percentage < 90).length;
    const regular = reportData.filter(d => d.attendance.percentage >= 70 && d.attendance.percentage < 80).length;
    const poor = reportData.filter(d => d.attendance.percentage < 70).length;
    
    return {
      labels: ['Excelente (>90%)', 'Bueno (80-89%)', 'Regular (70-79%)', 'Bajo (<70%)'],
      datasets: [
        {
          label: 'Nº de Alumnos',
          data: [excellent, good, regular, poor],
          backgroundColor: [
            'rgba(74, 222, 128, 0.6)', // green-400
            'rgba(59, 130, 246, 0.6)', // blue-500
            'rgba(251, 191, 36, 0.6)', // amber-400
            'rgba(239, 68, 68, 0.6)',  // red-500
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)', // green-500
            'rgba(37, 99, 235, 1)', // blue-600
            'rgba(245, 158, 11, 1)', // amber-500
            'rgba(220, 38, 38, 1)',  // red-600
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [reportData]);

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
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1,
                color: isDarkMode ? '#94a3b8' : '#475569',
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

  return <div style={{ height: '300px' }}><Bar options={options} data={chartData} /></div>;
};

// React.useMemo is used inside the component, so we wrap it for memoization
export default React.memo(ReportChart);
