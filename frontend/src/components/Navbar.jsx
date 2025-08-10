import { useNavigate, useLocation } from 'react-router-dom';

export default function NavBar(props) {
  const login_status = props.onLoginupdate;
  const navigate = useNavigate();
  const location = useLocation();

  const handleInsightsClick = (e) => {
    e.preventDefault();
    navigate('/insights');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        {/* Left Side - Branding */}
        <a className="navbar-brand" href="#" onClick={handleHomeClick}>
          Trading Journal Web App
        </a>

        {/* Navbar Toggle for Mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                href="#" 
                onClick={handleHomeClick}
              >
                Historical Trades
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${location.pathname === '/insights' ? 'active' : ''}`} 
                href="#" 
                onClick={handleInsightsClick}
              >
                📊 Insights & Analytics
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={props.onToggleForm}>
                Import Paper Trades
              </a>
            </li>
            {login_status && (
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={props.onToggleJournals}>
                  📚 Journals
                </a>
              </li>
            )}
          </ul>

          {/* Right Side - Login/Logout Button */}
          <ul className="navbar-nav ms-auto">
            {login_status ? (
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={props.onLogout}>
                  Logout
                </a>
              </li>
            ) : (
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={props.onToggleLogin}>
                  Login
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
