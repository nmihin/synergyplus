import React from 'react';
import logo from '../assets/logo.svg';
import '../assets/styles.css';

function Header() {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <nav className="App-menu">
        <ul>
          <li><a href="#home">Početna</a></li>
          <li><a href="#contact">Kontakt</a></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
