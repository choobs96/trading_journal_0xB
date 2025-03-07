import React, { useState, useEffect } from 'react';
import NavBar from './components/Navbar';
import TradeCards from './components/TradeCards';
import Table from './components/Table';
import TradeForm from './components/TradeForm';
import LoginPage from './components/LoginPage';
import FileUpload from './components/FileUpload';
import axios from 'axios';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// Add FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import aggregatedData from './components/AggregatedStats';

function App() {
  const [toggleAdd, setToggleAdd] = useState(false);
  const [toggleLogin, setToggleLogin] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null); // Use the token from localStorage
  const [data, setData] = useState(null); // State to store data from backend

  // Check authentication on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      setAuthenticated(true); // Set authenticated if token exists
    } else {
      setAuthenticated(false); // If no token, set to false
    }
  }, [token]); // Watch for token changes

  // Fetch data from backend when authenticated
  useEffect(() => {
    if (authenticated && token) {
      axios
        .get('http://localhost:5001/api/data', {
          headers: {
            Authorization: `Bearer ${token}`, // Send the token in the Authorization header
          },
        })
        .then((response) => {
          console.log('Fetched data:', response);
          setData(response.data); // Set the fetched data
        })
        .catch((error) => {
          console.error('Error fetching data:', error.response || error.message);
        });
    }
  }, [authenticated, token]); // Fetch data whenever authenticated or token changes

  // Handle login
  const handleLogin = async (response) => {
    setAuthenticated(true); // Set user as authenticated
    setToggleLogin(false); // Close the login modal after successful login
    const token = response.data.token; // Get the token from the login response
    localStorage.setItem('auth_token', token); // Store token in localStorage
    setToken(token); // Set the token state
  };

  // Handle logout
  const handleLogout = () => {
    console.log('logging out here');
    localStorage.removeItem('auth_token'); // Remove token from localStorage
    setToken(null); // Reset token state
    setAuthenticated(false); // Set authenticated to false
  };

  // Toggle the trade form
  function toggleTradeForm() {
    setToggleAdd((prevState) => !prevState);
  }

  // Toggle the login form
  function toggleLoginForm() {
    setToggleLogin((prevState) => !prevState);
  }

  // Calendar rendering logic
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
  };

  return (
    <>
      <header>
        <NavBar
          onToggleForm={toggleTradeForm}
          onToggleLogin={toggleLoginForm}
          onLoginupdate={authenticated}
          onLogout={handleLogout}
        />
      </header>
      <main className="app-container">
        {toggleAdd && <FileUpload onUploadClose={() => toggleTradeForm()} />}
        {toggleLogin && <LoginPage onLoginClose={() => toggleLoginForm()} onLogin={handleLogin} />}

        {!authenticated && <p>Please log in to access the content.</p>}

        {authenticated && (
          <>
            {data ? (
              <>
                <Table tradedata={data} />
                <TradeCalendar trades={aggregatedData} />
              </>
            ) : (
              <p>Loading data...</p>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default App;
