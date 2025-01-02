import React from 'react';
import logo from '../assets/logo-transparent.png';
import '../assets/styles.css';

function Header() {
  return (
    <header className="App-header">
      <div className="logo-container">
        <img style={{ height: '60px' }} src={logo} alt="logo" />
      </div>
      {/* <nav className="App-menu">
        <ul>
          <li><a href="#home">Početna</a></li>
          <li><a href="#contact">Kontakt</a></li>
        </ul>
      </nav> */}
    </header>
  );
}

export default Header;
