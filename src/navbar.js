import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="https://l4wb-i.org" className="navbar-logo-link">
          <img src="/l4wbi_logo.png" alt="L4WB-I Logo" className="navbar-logo" />
        </a>
        <p>Click <a href="https://l4wb-i.org" className="navbar-link">here</a> to visit our main website.</p>
      </div>
    </nav>
  );
};

export default Navbar;