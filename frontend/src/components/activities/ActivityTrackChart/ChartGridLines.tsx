type ChartGridLinesProps = {
  gridLines: number[];
  valueToChartY: (value: number) => number;
};

export const ChartGridLines = ({ gridLines, valueToChartY }: ChartGridLinesProps) =>
  gridLines.map((value) => {
    const y = valueToChartY(value);
    return (
      <line
        key={`grid-${value}`}
        x1={0}
        y1={y}
        x2={100}
        y2={y}
        stroke="#7f92ab"
        strokeOpacity={0.38}
        strokeWidth={0.7}
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
    );
  });