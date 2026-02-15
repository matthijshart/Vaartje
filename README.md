# GrachtBlauw (static site)

Dit is een **kant-en-klare HTML-map** voor een yuppy-minimalistische botenverhuur-site (Amsterdam), met:
- Smooth scroll + **scroll progress bar**
- Reveal animaties (iPhone-friendly)
- “Grachten symbool” (ringen) dat mee-tekent tijdens scroll
- Simpele **boekingsflow**: maakt een nette *boekingsmail* of kopieert de aanvraag

## Snel aanpassen (belangrijk)
1) **E-mailadres voor aanvragen**
- Open `script.js`
- Vervang:
  ```js
  const BOOKING_EMAIL = 'boeken@jouwdomein.nl';
  ```

2) **Telefoon, e-mail, opstapplek**
- Open `index.html`
- Zoek en vervang: `+31 6 00 00 00 00` en `boeken@jouwdomein.nl`

3) **Tarieven**
- Open `index.html`
- Zoek naar `data-price` en zet je bedragen neer, of laat “—” staan.

4) **Naam/branding**
- Zoek/replace op `GrachtBlauw`.

## Lokaal bekijken
- Dubbelklik `index.html` (werkt).
- Of met een simpele webserver:
  ```bash
  python3 -m http.server 8080
  ```
  en open `http://localhost:8080`

## Structuur
- `index.html` — alles op één page (snelle scroll experience)
- `styles.css` — stijl + animaties
- `script.js` — progress bar, reveal, rings-animatie, booking mail/copy
- `assets/` — logo, favicon, illustraties, grain

## Volgende stap (optioneel)
Als je echte online boekingen wil (i.p.v. mailto), koppel het form aan:
- een backend endpoint / serverless function (Netlify/Vercel)
- of een booking tool / CRM

Succes — en stuur me je echte bedrijfsnaam + 2–3 bootdetails als je wilt dat ik de teksten precies op maat schrijf.
