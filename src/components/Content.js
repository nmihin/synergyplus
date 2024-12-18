import React from 'react';
import '../assets/styles.css';
import Map from './Map'; 

function Content() {
  return (
    <main className="App-content">
      <h2>Dobrodošli u SynergyPlus</h2>
      <p>
        SynergyPlus je inovativni alat koji vam omogućuje pregled relevantnih podataka o okolišu putem interaktivne karte. 
        Ova aplikacija koristi umjetnu inteligenciju kako bi vam pružila precizne i korisne informacije prilagođene vašim potrebama. 
        Od infrastrukturnih podataka, poput cesta i željeznica, do informacija o onečišćenju i stanju okoliša, 
        SynergyPlus spaja tehnologiju i podatke za bolje razumijevanje vašeg okruženja.
      </p>
      <p>
        Kroz ovu aplikaciju možete uključiti ili isključiti slojeve karte koji vas zanimaju, a AI sustav analizira podatke 
        kako bi vam pružio uvid u ključne ekološke i infrastrukturne aspekte. Naš cilj je omogućiti vam donošenje 
        informiranih odluka o okolišu koristeći najmoderniju tehnologiju.
      </p>
      <Map />
    </main>
  );
}

export default Content;
