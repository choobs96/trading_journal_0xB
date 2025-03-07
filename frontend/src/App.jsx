import React, { useState, useEffect } from 'react';
import NavBar from './components/Navbar';
import TradeCards from './components/TradeCards';
import Table from './components/Table';
import TradeForm from './components/TradeForm';
import LoginPage from './components/LoginPage';
import FileUpload from './components/FileUpload';

import data from './data';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// Add FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import aggregatedData from './components/AggregatedStats';
import axios from 'axios';

function App() {
  const [toggleAdd, setToggleAdd] = useState(false);
  const [toggleLogin, setToggleLogin] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);

  // Check authentication on app load
  useEffect(() => {
    if (token) {
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
    }
  }, [token]);

  // Handle login
  const handleLogin = async () => {
    setAuthenticated(true); // User is now authenticated
    setToggleLogin(false); // Close the login modal after successful login
  };

  // Handle logout
  const handleLogout = () => {
    console.log('logging out here');
    localStorage.removeItem('auth_token');
    setToken(null);
    setAuthenticated(false);
  };

  // Toggle the trade form
  function toggleTradeForm() {
    setToggleAdd((prevState) => !prevState);
  }

  // Toggle the login form
  function toggleLoginForm() {
    setToggleLogin((prevState) => !prevState);
  }

  // Calendar rendering logic (same as before)
  const TradeCalendar = ({ trades }) => {
    const events = trades.map((trade) => {
      const isWin = trade.totalPNL > 0;
      const eventTitle = `$${trade.totalPNL} | ${trade.totalTrades} Trades`;
      const eventDescription = `RR: ${trade.averageRR}\nWR: ${trade.winRate}%`;

      return {
        title: eventTitle,
        start: trade.date,
        backgroundColor: isWin ? '#d5f4ec' : '#f8c2bd',
        borderColor: isWin ? '#d5f4ec' : '#f8c2bd',
        textColor: 'black',
        extendedProps: {
          description: eventDescription,
          ...trade,
        },
        allDay: true,
      };
    });

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
          info.el.style.backgroundColor = info.event.backgroundColor;
          info.el.style.borderColor = info.event.borderColor;
          info.el.style.color = info.event.textColor;
          info.el.style.margin = '0';
          info.el.style.padding = '0';
          info.el.style.height = '100%';
          const description = info.event.extendedProps.description;

          const descriptionElement = document.createElement('div');
          descriptionElement.textContent = description;
          descriptionElement.style.fontSize = '10px';
          descriptionElement.style.marginTop = '5px';
          info.el.appendChild(descriptionElement);
          const dayFrame = info.el.closest('.fc-daygrid-day-frame.fc-scrollgrid-sync-inner');
          if (dayFrame) {
            dayFrame.style.backgroundColor = info.event.backgroundColor;
          }
        }}
      />
    );
  };

  return (
    <>
      <header>
        <NavBar
          onToggleForm={toggleTradeForm}
          onToggleLogin={toggleLoginForm}
          onLoginupdate={authenticated}
          onLogout={() => handleLogout()}
        />
      </header>
      <main className="app-container">
        {toggleAdd && <FileUpload onUploadClose={() => toggleTradeForm()} />}
        {toggleLogin && <LoginPage onLoginClose={() => toggleLoginForm()} onLogin={handleLogin} />}

        {!authenticated && <p>Please log in to access the content.</p>}

        {authenticated && (
          <>
            {/* <p>Login Successful!</p> */}
            {/* <button onClick={handleLogout}>Logout</button> */}
            <Table tradedata={data} />
            <TradeCalendar trades={aggregatedData} />
          </>
        )}
      </main>
    </>
  );
}

export default App;
