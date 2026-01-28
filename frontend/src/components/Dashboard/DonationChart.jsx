import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const DonationChart = ({ data, type = "line", title = "" }) => {
  const getChartData = () => {
    switch (type) {
      case "line":
        return {
          labels: data?.map((item) => item.day) || [],
          datasets: [
            {
              label: "Donations",
              data:
                data?.map(
                  (item) => item.totalAmount || item.total_amount || 0,
                ) || [], // Handle both
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              fill: true,
              tension: 0.4,
              borderWidth: 2,
            },
          ],
        };
      case "pie": {
        const colors = [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
          "#f97316",
          "#06b6d4",
          "#84cc16",
        ];
        return {
          labels: data?.map((item) => item.purpose) || [],
          datasets: [
            {
              data: data?.map((item) => item.amount) || [],
              backgroundColor: colors,
              borderColor: colors.map((color) => color + "80"),
              borderWidth: 1,
            },
          ],
        };
      }
      case "bar":
        return {
          labels: data?.map((item) => item.operatorName) || [],
          datasets: [
            {
              label: "Donations",
              data: data?.map((item) => item.amount) || [],
              backgroundColor: "#3b82f6",
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        };
      default:
        return { labels: [], datasets: [] };
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: type === "pie" ? "right" : "top",
        labels: {
          boxWidth: 12,
          padding: 20,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.raw;
            return `${label}: RS ${Number(value).toLocaleString("en-PK")}`;
          },
        },
      },
      title: title
        ? {
            display: true,
            text: title,
            font: {
              size: window.innerWidth < 768 ? 14 : 16,
              weight: "600",
            },
            padding: 10,
          }
        : undefined,
    },
    scales:
      type !== "pie"
        ? {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  size: window.innerWidth < 768 ? 10 : 12,
                },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(229, 231, 235, 0.5)",
              },
              ticks: {
                callback: (value) =>
                  `RS ${Number(value).toLocaleString("en-PK")}`,
                font: {
                  size: window.innerWidth < 768 ? 10 : 12,
                },
              },
            },
          }
        : undefined,
    interaction: {
      intersect: false,
      mode: "nearest",
    },
    elements: {
      point: {
        radius: window.innerWidth < 768 ? 3 : 4,
        hoverRadius: window.innerWidth < 768 ? 5 : 6,
      },
    },
  };

  const ChartComponent = type === "line" ? Line : type === "pie" ? Pie : Bar;

  return (
    <div className="card card-hover p-4 md:p-6 animate-fade-in">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            {title}
          </h3>
          {type === "pie" && (
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary-600 mr-1"></div>
              <span className="text-xs text-gray-600">
                Total: RS{" "}
                {data
                  ?.reduce((sum, item) => sum + (item.amount || 0), 0)
                  .toLocaleString("en-PK")}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="relative h-64 sm:h-72 md:h-80 lg:h-96">
        <ChartComponent data={getChartData()} options={options} />
      </div>

      {/* Mobile legend for pie chart */}
      {type === "pie" && window.innerWidth < 768 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">
            Breakdown:
          </div>
          <div className="flex flex-wrap gap-2">
            {data?.map((item, index) => (
              <div key={item.purpose} className="flex items-center">s
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{
                    backgroundColor:
                      getChartData().datasets[0].backgroundColor[index],
                  }}
                ></div>
                <span className="text-xs text-gray-600 truncate max-w-[80px]">
                  {item.purpose}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationChart;
