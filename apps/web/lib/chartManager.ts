import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickData,
  CandlestickSeries, //  Import the series type
} from "lightweight-charts";

// Interfaces for data structures remain the same (good practice)
interface InitialCandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

interface UpdatedCandleData {
  open: string;
  high: string;
  low: string;
  close: string;
  end: string;
}

export class ChartManager {
  private chart: IChartApi | null;
  private candlestickSeries: ISeriesApi<"Candlestick"> | null;

  constructor(
    ref: HTMLDivElement,
    initialData: InitialCandleData[],
    layout: { background: string; color: string }
  ) {
    const chart = createChart(ref, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: layout.background },
        textColor: layout.color,
      },
    });

    this.chart = chart;

    this.candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    const formattedData: CandlestickData[] = initialData.map((data) => ({
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      time: (data.timestamp / 1000) as UTCTimestamp,
    }));

    this.candlestickSeries.setData(formattedData);
  }

  // The rest of the class remains the same...
  public updateData(updatedData: UpdatedCandleData): void {
    if (!this.candlestickSeries) {
      return;
    }
    const newCandle: CandlestickData = {
      open: parseFloat(updatedData.open),
      high: parseFloat(updatedData.high),
      low: parseFloat(updatedData.low),
      close: parseFloat(updatedData.close),
      time: (new Date(updatedData.end).getTime() / 1000) as UTCTimestamp,
    };
    this.candlestickSeries.update(newCandle);
  }

  public destroy(): void {
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
  }
}
