export default function TradeForm() {
  return (
    <form className="trade-form">
      <div className="form-group">
        <label htmlFor="symbol">Symbol</label>
        <input type="text" name="symbol" id="symbol" />
      </div>

      <div className="form-group">
        <label htmlFor="side">Side</label>
        <input type="text" name="side" id="side" />
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantity</label>
        <input type="text" name="quantity" id="quantity" />
      </div>

      <div className="form-group">
        <label htmlFor="entryPrice">Entry Price</label>
        <input type="text" name="entryPrice" id="entryPrice" />
      </div>

      <div className="form-group">
        <label htmlFor="exitPrice">Exit Price</label>
        <input type="text" name="exitPrice" id="exitPrice" />
      </div>

      <button type="submit" className="submit-btn">
        Submit Trade
      </button>
    </form>
  );
}

{
  /* <th scope="col">TradeID</th>
<th scope="col">Symbol</th>
<th scope="col">Side</th>
<th scope="col">Quantity</th>
<th scope="col">Entry Price</th>
<th scope="col">Exit Price</th>
<th  scope="col">Outcome</th>
<th  scope="col">PNL</th> */
}
