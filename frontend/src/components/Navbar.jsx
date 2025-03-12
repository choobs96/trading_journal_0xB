export default function NavBar(props) {
  const login_status = props.onLoginupdate;

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        {/* Left Side - Branding */}
        <a className="navbar-brand" href="#">
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
              <a className="nav-link" href="#">
                Historical Trades
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={props.onToggleForm}>
                Import Paper Trades
              </a>
            </li>
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
