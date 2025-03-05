const trades = [
  {
    tradeid: '9cc7d344-f6e9-4d77-9fe1-048c738692ea',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-02-21 19:58:29',
    avg_entry_price: 1.07985,
    total_entry_stock_amount: 1100000.0,
    stop_loss: 1.07943,
    price_target: 1.08069,
    time_of_last_exit: '2024-02-21 21:02:25',
    avg_exit_price: 1.08069,
    total_exit_stock_amount: 1100000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 1187835.0,
    total_sell: 1188759.0,
    pnl: 924.0,
    outcome: 'Profit',
  },
  {
    tradeid: '7e3d09e8-8afe-49ef-ba0e-5dc8f8f3db36',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-02-27 16:25:37',
    avg_entry_price: 1.08598,
    total_entry_stock_amount: 800000.0,
    stop_loss: 1.08529,
    price_target: 1.08734,
    time_of_last_exit: '2024-02-27 17:32:21',
    avg_exit_price: 1.08529,
    total_exit_stock_amount: 800000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 868784.0,
    total_sell: 868232.0000000001,
    pnl: -551.9999999999,
    outcome: 'Loss',
  },
  {
    tradeid: 'c946a401-eaa2-454d-a64b-cfe0f0635651',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-02-27 19:31:48',
    avg_entry_price: 1.08548,
    total_entry_stock_amount: 650000.0,
    stop_loss: 1.08479,
    price_target: 1.08686,
    time_of_last_exit: '2024-02-27 21:38:31',
    avg_exit_price: 1.08478,
    total_exit_stock_amount: 650000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 705562.0,
    total_sell: 705107.0,
    pnl: -455.0,
    outcome: 'Loss',
  },
  {
    tradeid: 'fac34ce5-4908-4d8b-b595-e98993268825',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-02-28 21:47:04',
    avg_entry_price: 1.0823,
    total_entry_stock_amount: 600000.0,
    stop_loss: 1.08139,
    price_target: 1.08414,
    time_of_last_exit: '2024-02-28 22:37:04',
    avg_exit_price: 1.08249,
    total_exit_stock_amount: 600000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 649380.0,
    total_sell: 649494.0,
    pnl: 114.0,
    outcome: 'Profit',
  },
  {
    tradeid: '45054503-37c7-4476-a5b5-0ebf7c0a8754',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-01 17:56:02',
    avg_entry_price: 1.08163,
    total_entry_stock_amount: 800000.0,
    stop_loss: 1.08096,
    price_target: 1.08309,
    time_of_last_exit: '2024-03-01 18:12:11',
    avg_exit_price: 1.08096,
    total_exit_stock_amount: 800000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 865304.0000000001,
    total_sell: 864767.9999999999,
    pnl: -536.0000000002,
    outcome: 'Loss',
  },
  {
    tradeid: '2b728410-213b-4864-8763-4fb95564b4e9',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-04 21:58:26',
    avg_entry_price: 1.08488,
    total_entry_stock_amount: 800000.0,
    stop_loss: 1.08429,
    price_target: 1.08606,
    time_of_last_exit: '2024-03-04 22:52:50',
    avg_exit_price: 1.08606,
    total_exit_stock_amount: 800000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 867904.0,
    total_sell: 868848.0,
    pnl: 944.0,
    outcome: 'Profit',
  },
  {
    tradeid: '9aa0d624-3590-42a4-84d7-d96116e73dc0',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Sell',
    time_of_first_entry: '2024-03-05 16:49:48',
    avg_entry_price: 1.08443,
    total_entry_stock_amount: 900000.0,
    stop_loss: 1.08504,
    price_target: 1.08324,
    time_of_last_exit: '2024-03-05 17:05:36',
    avg_exit_price: 1.08504,
    total_exit_stock_amount: 900000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 975987.0,
    total_sell: 976536.0,
    pnl: -549.0,
    outcome: 'Loss',
  },
  {
    tradeid: '45700d54-f1fc-4bb2-9388-7de2708585a9',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-05 17:10:37',
    avg_entry_price: 1.08523,
    total_entry_stock_amount: 1000000.0,
    stop_loss: 1.08473,
    price_target: 1.08623,
    time_of_last_exit: '2024-03-05 20:09:29',
    avg_exit_price: 1.08472,
    total_exit_stock_amount: 1000000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 1085230.0,
    total_sell: 1084720.0,
    pnl: -510.0,
    outcome: 'Loss',
  },
  {
    tradeid: '02f3a2ca-ab97-417f-9dbb-55ab890e9f90',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Sell',
    time_of_first_entry: '2024-03-05 21:46:54',
    avg_entry_price: 1.08455,
    total_entry_stock_amount: 900000.0,
    stop_loss: 1.08515,
    price_target: 1.08335,
    time_of_last_exit: '2024-03-05 22:14:12',
    avg_exit_price: 1.08516,
    total_exit_stock_amount: 900000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 976094.9999999999,
    total_sell: 976643.9999999999,
    pnl: -549.0,
    outcome: 'Loss',
  },
  {
    tradeid: '65c985ae-8111-4063-81fc-3b1b40762fc4',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-07 16:36:54',
    avg_entry_price: 1.08935,
    total_entry_stock_amount: 800000.0,
    stop_loss: 1.08877,
    price_target: 1.09051,
    time_of_last_exit: '2024-03-07 21:15:32',
    avg_exit_price: 1.08875,
    total_exit_stock_amount: 800000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 871480.0,
    total_sell: 871000.0000000001,
    pnl: -479.9999999999,
    outcome: 'Loss',
  },
  {
    tradeid: '9c59b46f-3b35-4f14-af17-0b3efe2572f9',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-08 16:30:39',
    avg_entry_price: 1.0934763636,
    total_entry_stock_amount: 1100000.0,
    stop_loss: 1.09306,
    price_target: 1.09432,
    time_of_last_exit: '2024-03-08 17:15:38',
    avg_exit_price: 1.09306,
    total_exit_stock_amount: 1100000.0,
    amount_of_different_entries: 2,
    amount_of_different_exits: 1,
    total_buy: 1202824.0,
    total_sell: 1202366.0,
    pnl: -458.0,
    outcome: 'Loss',
  },
  {
    tradeid: 'c53f1f43-a9cb-4ece-9cfa-4b8d97ff36a1',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-08 17:54:26',
    avg_entry_price: 1.09345,
    total_entry_stock_amount: 600000.0,
    stop_loss: 1.09262,
    price_target: 1.09505,
    time_of_last_exit: '2024-03-08 18:35:35',
    avg_exit_price: 1.09262,
    total_exit_stock_amount: 600000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 656070.0,
    total_sell: 655572.0,
    pnl: -498.0,
    outcome: 'Loss',
  },
  {
    tradeid: 'e32e8007-7ad0-4b4b-9a42-a3207a44b40a',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-13 21:32:31',
    avg_entry_price: 1.09401,
    total_entry_stock_amount: 1300000.0,
    stop_loss: 1.09366,
    price_target: 1.09475,
    time_of_last_exit: '2024-03-13 21:44:08',
    avg_exit_price: 1.09362,
    total_exit_stock_amount: 1300000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 1422213.0,
    total_sell: 1421706.0,
    pnl: -507.0,
    outcome: 'Loss',
  },
  {
    tradeid: '35893497-c9ad-41bd-9190-c6065702cb4a',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Sell',
    time_of_first_entry: '2024-03-13 21:44:30',
    avg_entry_price: 1.09359,
    total_entry_stock_amount: 1000000.0,
    stop_loss: 1.0942,
    price_target: '',
    time_of_last_exit: '2024-03-13 21:49:04',
    avg_exit_price: 1.09421,
    total_exit_stock_amount: 1000000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 1093590.0,
    total_sell: 1094210.0,
    pnl: -620.0,
    outcome: 'Loss',
  },
  {
    tradeid: '00e8fb34-f8e0-4a9a-970e-078ebb289ab6',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-13 21:49:51',
    avg_entry_price: 1.09407,
    total_entry_stock_amount: 1800000.0,
    stop_loss: 1.0936,
    price_target: 1.09501,
    time_of_last_exit: '2024-03-13 22:02:27',
    avg_exit_price: 1.0936,
    total_exit_stock_amount: 1800000.0,
    amount_of_different_entries: 2,
    amount_of_different_exits: 1,
    total_buy: 1969326.0000000002,
    total_sell: 1968479.9999999998,
    pnl: -846.0000000005,
    outcome: 'Loss',
  },
  {
    tradeid: '603a1963-6af5-4f57-9263-2008245f7794',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Buy',
    time_of_first_entry: '2024-03-14 17:12:58',
    avg_entry_price: 1.09413,
    total_entry_stock_amount: 1000000.0,
    stop_loss: 1.0936,
    price_target: 1.09517,
    time_of_last_exit: '2024-03-14 20:22:32',
    avg_exit_price: 1.0936,
    total_exit_stock_amount: 1000000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 1094130.0,
    total_sell: 1093600.0,
    pnl: -530.0,
    outcome: 'Loss',
  },
  {
    tradeid: '7fb39bdf-eb7f-4017-a3eb-a742d819ac82',
    symbol: 'FOREXCOM:EURUSD',
    side: 'Sell',
    time_of_first_entry: '2024-04-25 20:31:24',
    avg_entry_price: 1.07132,
    total_entry_stock_amount: 1300000.0,
    stop_loss: 1.0721,
    price_target: 1.06979,
    time_of_last_exit: '2024-04-25 20:32:51',
    avg_exit_price: 1.06978,
    total_exit_stock_amount: 1300000.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 1392716.0,
    total_sell: 1390714.0,
    pnl: 2002.0,
    outcome: 'Profit',
  },
  {
    tradeid: '2c0ff88b-0941-43cf-bd28-9c6e3cc21e09',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Sell',
    time_of_first_entry: '2024-02-27 22:46:50',
    avg_entry_price: 56858.5,
    total_entry_stock_amount: 2.0,
    stop_loss: 57336.3,
    price_target: 55906.8,
    time_of_last_exit: '2024-02-27 23:22:34',
    avg_exit_price: 57335.0,
    total_exit_stock_amount: 2.0,
    amount_of_different_entries: 2,
    amount_of_different_exits: 1,
    total_buy: 113717.0,
    total_sell: 114670.0,
    pnl: -953.0,
    outcome: 'Loss',
  },
  {
    tradeid: '82ee1bd2-32d1-4f58-b3e7-ceec2a5caac3',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Sell',
    time_of_first_entry: '2024-02-29 22:46:22',
    avg_entry_price: 62958.8,
    total_entry_stock_amount: 1.0,
    stop_loss: 63458.4,
    price_target: 61954.6,
    time_of_last_exit: '2024-03-01 00:40:17',
    avg_exit_price: 61930.9,
    total_exit_stock_amount: 1.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 62958.8,
    total_sell: 61930.9,
    pnl: 1027.9,
    outcome: 'Profit',
  },
  {
    tradeid: 'f56637fb-7d8d-4b7d-a458-242fe3911d89',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Sell',
    time_of_first_entry: '2024-03-02 03:11:33',
    avg_entry_price: 62210.0,
    total_entry_stock_amount: 1.35,
    stop_loss: 62559.4,
    price_target: 61479.8,
    time_of_last_exit: '2024-03-02 04:28:54',
    avg_exit_price: 62555.1,
    total_exit_stock_amount: 1.35,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 83983.5,
    total_sell: 84449.385,
    pnl: -465.885,
    outcome: 'Loss',
  },
  {
    tradeid: 'e6df152a-7103-4875-86b2-63cde55d6880',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Sell',
    time_of_first_entry: '2024-03-04 22:01:48',
    avg_entry_price: 65078.2,
    total_entry_stock_amount: 1.349,
    stop_loss: 65437.6,
    price_target: 64362.2,
    time_of_last_exit: '2024-03-04 22:29:04',
    avg_exit_price: 65437.3,
    total_exit_stock_amount: 1.349,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 87790.4918,
    total_sell: 88274.9177,
    pnl: -484.4259,
    outcome: 'Loss',
  },
  {
    tradeid: 'b0d6f182-e3b2-4ea3-a2d3-e72010e9acff',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Buy',
    time_of_first_entry: '2024-03-05 00:45:49',
    avg_entry_price: 66524.7,
    total_entry_stock_amount: 1.367,
    stop_loss: 66160.4,
    price_target: 67262.8,
    time_of_last_exit: '2024-03-05 01:26:44',
    avg_exit_price: 67281.3,
    total_exit_stock_amount: 1.367,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 90939.2649,
    total_sell: 91973.5371,
    pnl: 1034.2722,
    outcome: 'Profit',
  },
  {
    tradeid: '16729b3d-472c-4452-bedc-8b1568f3041c',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Sell',
    time_of_first_entry: '2024-03-06 00:05:52',
    avg_entry_price: 66475.1,
    total_entry_stock_amount: 0.5,
    stop_loss: 67718.7,
    price_target: 63944.7,
    time_of_last_exit: '2024-03-06 01:09:55',
    avg_exit_price: 63942.8,
    total_exit_stock_amount: 0.5,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 33237.55,
    total_sell: 31971.4,
    pnl: 1266.15,
    outcome: 'Profit',
  },
  {
    tradeid: '9f63b6da-fec7-4adb-9011-d54bcecc968e',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Buy',
    time_of_first_entry: '2024-03-06 22:03:31',
    avg_entry_price: 66752.5,
    total_entry_stock_amount: 0.591,
    stop_loss: 65876.1,
    price_target: 68485.9,
    time_of_last_exit: '2024-03-06 23:04:09',
    avg_exit_price: 65643.8,
    total_exit_stock_amount: 0.591,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 39450.7275,
    total_sell: 38795.4858,
    pnl: -655.2417,
    outcome: 'Loss',
  },
  {
    tradeid: 'f5c81371-128f-4ea4-b149-b3ba23d15a0e',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Sell',
    time_of_first_entry: '2024-03-06 23:07:43',
    avg_entry_price: 65531.6090909091,
    total_entry_stock_amount: 0.55,
    stop_loss: 66428.0,
    price_target: '',
    time_of_last_exit: '2024-03-06 23:15:43',
    avg_exit_price: 66218.2,
    total_exit_stock_amount: 0.55,
    amount_of_different_entries: 2,
    amount_of_different_exits: 1,
    total_buy: 36042.385,
    total_sell: 36420.01,
    pnl: -377.625,
    outcome: 'Loss',
  },
  {
    tradeid: '8aff5566-51ee-4e85-b503-aa06ad2b9ec8',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Buy',
    time_of_first_entry: '2024-03-06 23:15:43',
    avg_entry_price: 66230.4380952381,
    total_entry_stock_amount: 1.05,
    stop_loss: 65319.4,
    price_target: 67991.6,
    time_of_last_exit: '2024-03-07 22:40:49',
    avg_exit_price: 67993.1,
    total_exit_stock_amount: 1.05,
    amount_of_different_entries: 2,
    amount_of_different_exits: 1,
    total_buy: 69541.96,
    total_sell: 71392.755,
    pnl: 1850.795,
    outcome: 'Profit',
  },
  {
    tradeid: 'a7a43d20-7119-4cd4-9791-c216510e4d8a',
    symbol: 'BINANCE:BTCUSDT.P',
    side: 'Buy',
    time_of_first_entry: '2024-03-11 22:57:25',
    avg_entry_price: 72241.7,
    total_entry_stock_amount: 1.42,
    stop_loss: 71833.9,
    price_target: 73062.2,
    time_of_last_exit: '2024-03-12 03:58:44',
    avg_exit_price: 71840.8,
    total_exit_stock_amount: 1.42,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 102583.214,
    total_sell: 102013.936,
    pnl: -569.278,
    outcome: 'Loss',
  },
  {
    tradeid: '547233b6-5884-4742-b012-561d05b22010',
    symbol: 'BINANCE:BTCUSDT',
    side: 'Buy',
    time_of_first_entry: '2024-03-05 23:48:22',
    avg_entry_price: 67330.0,
    total_entry_stock_amount: 1.0,
    stop_loss: 66798.23,
    price_target: 68325.1,
    time_of_last_exit: '2024-03-06 00:00:00',
    avg_exit_price: 66769.59,
    total_exit_stock_amount: 1.0,
    amount_of_different_entries: 1,
    amount_of_different_exits: 1,
    total_buy: 67330.0,
    total_sell: 66769.59,
    pnl: -560.41,
    outcome: 'Loss',
  },
];
