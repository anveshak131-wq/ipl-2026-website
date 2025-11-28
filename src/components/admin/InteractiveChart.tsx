'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type?: 'bar' | 'line' | 'area';
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export default function InteractiveChart({
  data,
  type = 'bar',
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  formatValue = (v) => v.toString(),
}: InteractiveChartProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 0);
  }, [data]);

  const totalValue = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const getBarHeight = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * (height - 60);
  };

  const getBarColor = (index: number, color?: string) => {
    if (color) return color;
    const colors = [
      '#2F6FED',
      '#7B61FF',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#EC4899',
      '#06B6D4',
      '#8B5CF6',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6">
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#E6EDF3]">{title}</h3>
          {totalValue > 0 && (
            <p className="text-sm text-[#AEBAC7] mt-1">
              Total: <span className="font-semibold text-[#E6EDF3]">{formatValue(totalValue)}</span>
            </p>
          )}
        </div>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        {/* Grid Lines */}
        {showGrid && (
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <div
                key={ratio}
                className="border-t border-[#2A3440]"
                style={{ marginTop: ratio === 0 ? 0 : undefined }}
              />
            ))}
          </div>
        )}

        {/* Chart Content */}
        <div className="relative h-full flex items-end justify-between gap-2 px-4">
          {data.map((point, index) => {
            const barHeight = getBarHeight(point.value);
            const color = getBarColor(index, point.color);

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                style={{ height: '100%' }}
              >
                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80 relative"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: color,
                    minHeight: point.value > 0 ? '4px' : '0',
                  }}
                  title={`${point.label}: ${formatValue(point.value)}`}
                >
                  {/* Value Label on Hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-2 py-1 bg-[#141A22] border border-[#2A3440] rounded text-xs text-[#E6EDF3] whitespace-nowrap">
                      {formatValue(point.value)}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="mt-2 text-xs text-[#AEBAC7] text-center truncate w-full" title={point.label}>
                  {point.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[#6B7280] pr-2">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <span key={ratio}>{formatValue(maxValue * ratio)}</span>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && data.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4">
          {data.map((point, index) => {
            const color = getBarColor(index, point.color);
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-[#AEBAC7]">
                  {point.label}: <span className="text-[#E6EDF3] font-semibold">{formatValue(point.value)}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {data.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[#2A3440] grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Total</div>
            <div className="text-lg font-bold text-[#E6EDF3] mt-1">{formatValue(totalValue)}</div>
          </div>
          <div>
            <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Average</div>
            <div className="text-lg font-bold text-[#E6EDF3] mt-1">
              {formatValue(totalValue / data.length)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Max</div>
            <div className="text-lg font-bold text-[#E6EDF3] mt-1">{formatValue(maxValue)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

