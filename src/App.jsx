import NavBar from './components/Navbar';
import TradeCards from './components/TradeCards';
import Table from './components/Table';
import TradeForm from './components/TradeForm';
import LoginPage from './components/LoginPage';
import FileUpload from './components/FileUpload';

import data from './data';
import React from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// Add FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import aggregatedData from './components/AggregatedStats';

function App() {
  const tradeelements = data.map((tradeinfo) => (
    <TradeCards key={tradeinfo.tradeid} tradeinfo={tradeinfo} />
  ));
  const [toggleAdd, setToggleAdd] = React.useState(false);
  const [toggleLogin, setToggleLogin] = React.useState(false);
  const [value1, setValue1] = React.useState('');

  function toggleTradeForm() {
    setToggleAdd((prevState) => !prevState);
  }
  function toggleLoginForm() {
    setToggleLogin((prevState) => !prevState);
  }

  function TradeCalendar({ trades }) {
    const events = trades.map((trade) => {
      const isWin = trade.totalPNL > 0;
      const eventTitle = `$${trade.totalPNL} | ${trade.totalTrades}Trades`; // Shortened title
      const eventDescription = `RR: ${trade.averageRR}\nWR: ${trade.winRate}%`; // Detailed description

      return {
        title: eventTitle, // Show only essential data in the title
        start: trade.date,
        backgroundColor: isWin ? '#d5f4ec' : '#f8c2bd',
        borderColor: isWin ? '#d5f4ec' : '#f8c2bd',
        textColor: 'black',
        extendedProps: {
          description: eventDescription, // Store detailed description
          ...trade,
        },
        allDay: true,
      };
    });

    // console.log("Output", events);

    const handleEventClick = ({ event }) => {
      alert(
        `PNL: ${event.extendedProps.totalPNL}\nTotal Trades: ${event.extendedProps.totalTrades}\nAverage RR: ${event.extendedProps.averageRR}\nWin Rate: ${event.extendedProps.winRate}`
      );
    };

    return (
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="800px"
        eventDidMount={(info) => {
          // Apply custom styles to the event element
          info.el.style.backgroundColor = info.event.backgroundColor;
          info.el.style.borderColor = info.event.borderColor;
          info.el.style.color = info.event.textColor;
          // Ensure the event fills the entire day cell
          info.el.style.margin = '0';
          info.el.style.padding = '0';
          info.el.style.height = '100%';
          const description = info.event.extendedProps.description;

          const descriptionElement = document.createElement('div');
          descriptionElement.textContent = description;
          descriptionElement.style.fontSize = '10px'; // Smaller font for the description
          descriptionElement.style.marginTop = '5px'; // Add some space between title and description
          info.el.appendChild(descriptionElement); // Append description to the event element
          const dayFrame = info.el.closest('.fc-daygrid-day-frame.fc-scrollgrid-sync-inner');
          if (dayFrame) {
            dayFrame.style.backgroundColor = info.event.backgroundColor; // Set the background color of the day frame
          }
        }}
      />
    );
  }

  return (
    <>
      <header>
        <NavBar onToggleForm={toggleTradeForm} onToggleLogin={toggleLoginForm} />
      </header>
      <main className="app-container">
        {toggleAdd && <FileUpload onUploadClose={() => toggleTradeForm()} />}
        {toggleLogin && <LoginPage onLoginClose={() => toggleLoginForm()} />}
        <Table tradedata={data} />
        <div>
          <TradeCalendar trades={aggregatedData} />
        </div>
      </main>
    </>
  );
}

export default App;
