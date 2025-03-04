import Table2 from './Table';

export default function TradeTable({ data }) {
  // Calculate PNL

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">TradeID</th>
          <th scope="col">Symbol</th>
          <th scope="col">Side</th>
          <th scope="col">Quantity</th>
          <th scope="col">Entry Price</th>
          <th scope="col">Exit Price</th>
          <th scope="col">PNL</th>
        </tr>
      </thead>
      <tbody>
        {data.map(({ tradeinfo }) => (
          <Table2 key={tradeinfo.id} tradeinfo={tradeinfo} onClick={null} />
        ))}
      </tbody>
    </table>
  );
}
