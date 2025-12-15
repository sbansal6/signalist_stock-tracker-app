import { getDannyInsights } from "@/lib/actions/danny-signals.actions";
import { getStockQuotes } from "@/lib/actions/stock-quotes.actions";
import DannySignalsFilter from "@/components/DannySignalsFilter";

const DannySignalsPage = async () => {
  const insights = await getDannyInsights();
  
  // Fetch initial quotes for all stocks
  const symbols = insights.map(insight => insight.stock_ticker);
  const initialQuotes = await getStockQuotes(symbols);

  return <DannySignalsFilter insights={insights} initialQuotes={initialQuotes} />;
};

export default DannySignalsPage;

