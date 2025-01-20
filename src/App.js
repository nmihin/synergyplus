import React from 'react';
import './App.css';
import Header from './components/Header';
import Content from './components/Content';
import Footer from './components/Footer';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <div className="App">
        {/* <Header /> */}
        <Content />
        {/* <Footer /> */}
      </div>
    </I18nextProvider>
  );
}

export default App;
