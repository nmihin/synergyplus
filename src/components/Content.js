import React from 'react';
import '../assets/styles.css';
import Map from './Map'; 

function Content() {
  return (
    <main className="App-content">
      <p>
        Dobrodošli u <b>SynergyPlus</b>, napredni alat za logistiku transporta sirovina, dizajniran kako bi vam pomogao u pronalaženju optimalnih ruta i dobavljača. Ova aplikacija omogućuje pregled ključnih podataka o sirovinama putem interaktivne karte, pružajući korisnicima precizne i prilagođene informacije za učinkovito donošenje odluka.
      </p>
      <p>
      <b>SynergyPlus</b> obuhvaća širok raspon sirovina, uključujući: <b><span class="material-clay">keramička i vatrostalna glina</span>, <span class="material-stone">tehničko-građevni kamen</span>, <span class="material-sand">građevni pijesak i šljunak</span>, <span class="material-brick"> ciglarska glina </span>, <span class="material-mineral"> karbonatne mineralne sirovine za industrijsku preradbu</span>.</b>
      </p>
      <p>        Naš cilj je optimizirati vaše poslovanje kroz upotrebu najmodernijih tehnologija i inovativnih rješenja, olakšavajući upravljanje sirovinama i transportnim procesima.</p>
      <Map />
    </main>
  );
}

export default Content;
