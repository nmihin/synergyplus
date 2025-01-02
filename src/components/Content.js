import React from 'react';
import '../assets/styles.css';
import Map from './Map'; 

function Content() {
  return (
    <main className="App-content">
      <p>
        Dobrodošli u <b>CROcharge</b>, napredni alat za praćenje i optimizaciju punionica za električna vozila, dizajniran kako bi vam pomogao u pronalaženju optimalnih punionica i praćenju udjela obnovljivih izvora energije. Ova aplikacija omogućuje pregled ključnih podataka o punionicama putem interaktivne karte, pružajući korisnicima precizne i prilagođene informacije za učinkovito donošenje odluka u vezi s ekološki prihvatljivim punjenjem.
      </p>
      <p>
      CROcharge obuhvaća širok raspon punionica, uključujući lokacije za električna vozila na temelju dostupnosti obnovljivih izvora energije. Punionice su označene bojama prema postotku energije koju koriste iz obnovljivih izvora: <b><span class="material-red">punionice s manje od 25% energije iz obnovljivih izvora</span>, <span class="material-orange">punionice s manje od 50% energije iz obnovljivih izvora</span>, <span class="material-yellow">punionice s manje od 75% energije iz obnovljivih izvora</span>, <span class="material-green"> punionice 100% energije iz obnovljivih izvora </span>.</b>
      </p>
      <Map />
    </main>
  );
}

export default Content;
