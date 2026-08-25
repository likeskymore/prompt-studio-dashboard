import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { Activity } from "lucide-react";

interface PerformanceLineChartProps {
    title: string;
    value: number;
    unit: string;
}

export function PerformanceLineChart({
    title,
    value,
    unit,
}: PerformanceLineChartProps) {
    const option: EChartsOption = {
        backgroundColor: "transparent",

        tooltip: {
            trigger: "axis",
        },

        grid: {
            left: 12,
            right: 20,
            top: 20,
            bottom: 24,
            containLabel: true,
        },

        xAxis: {
            type: "category",
            data: ["Current"],
            axisLabel: {
                color: "#64748b",
                fontSize: 10,
            },
        },

        yAxis: {
            type: "value",
            axisLabel: {
                color: "#64748b",
                fontSize: 10,
            },
        },

        series: [
            {
                name: title,
                type: "line",
                data: [value],
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                lineStyle: {
                    width: 2,
                },
            },
        ],
    };

    return (
        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Current {unit}
                    </p>
                </div>

                <Activity className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="h-80 w-full">
                <ReactECharts
                    option={option}
                    style={{
                        height: "100%",
                        width: "100%",
                    }}
                />
            </div>
        </div>
    );
}