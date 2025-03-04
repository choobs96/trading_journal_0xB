export default function NavBar({ onToggleForm }) {
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
              <a className="nav-link" href="#" onClick={onToggleForm}>
                Add Trades
              </a>
            </li>

            {/* <li class="nav-item">
                <a class="nav-link disabled" aria-disabled="true">Disabled</a>
                </li> */}
          </ul>
        </div>
      </div>
    </nav>
  );
}
