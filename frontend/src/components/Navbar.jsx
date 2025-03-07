export default function NavBar(props) {
  const login_status = props.onLoginupdate;

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          Trading Journal Web App
        </a>
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
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="#">
                Historical Trades
              </a>
            </li>
            <li>
              <a className="nav-link" href="#" onClick={props.onToggleForm}>
                Import Trades
              </a>
            </li>

            {login_status ? (
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={props.onLogout}>
                  Logout
                </a>
              </li>
            ) : (
              <li>
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
