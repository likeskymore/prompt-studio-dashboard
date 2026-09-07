import { formatNumber } from "@/lib/utils";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { Activity } from "lucide-react";

interface DataPoint {
    time: string;
    value: number;
}

interface PerformanceLineChartProps {
    title: string;
    data: DataPoint[];
    unit: string;
}

export function PerformanceLineChart({
    title,
    data,
    unit,
}: PerformanceLineChartProps) {
    const option: EChartsOption = {
        backgroundColor: "transparent",

        tooltip: {
            trigger: "axis",
            valueFormatter: (value) => formatNumber(Number(value)),
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
            data: data.map((point) =>
                new Date(point.time).toLocaleTimeString()
            ),
        },

        yAxis: {
            type: "value",
        },

        series: [
            {
                name: title,
                type: "line",
                data: data.map((point) => point.value),
                smooth: true,
                symbol: "circle",
                symbolSize: 6,
            },
        ],
    };

    const currentValue = data.at(-1)?.value;

    return (
        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Current {unit}:{" "}
                        {currentValue !== undefined
                            ? currentValue.toFixed(2)
                            : "—"}
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