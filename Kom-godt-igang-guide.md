# Kom godt i gang med Web Push

Jeg valgte at undersøge **Web push**, for at lære hvordan man sender notificationer.

## Formål

Jeg startede med at finde ud af *hvordan* man kan sende notificationer, selv når et program er lukket. 

Det var der jeg fandt **Web push**, som gør at serveren kan sende en besked via browserens **push service**. 

Men det er ikke nok, kun at bruge Web push, browseren kan og må ikke sende notificationer før klienten har givet tilladelse.<br>
Så det kom jeg også til at læse om, samt en liste af andre nødvendigheder for at få det til at fungere.

## Hvad kan Web Push så bruges til?

Web Push er nyttigt, når du gerne vil levere beskeder, selvom brugeren ikke har hjemmesiden åben. Det kan for eksempel være:

- En ny chatbesked.
- En opdatering på en ordre.
- En påmindelse om en aftale. 
- En alarm.
- Alt hvad en bruger kunne ønske at blive gjort opmærksom på, uden at skulle nedstirre deres apps hele dagen.

I mit projekt kan man tilmelde sig push-notifikationer og planlægge en besked med en titel og en ventetid. Det er en lille demo af, hvordan serveren kan give brugeren besked uden at vedkommende skal holde appen åben.

## Hvordan bliver en push sendt?

Når brugeren første gang besøger appen skal de give  tilladelse til at browseren må sende notifikationer. Så bruger browseren **Push API** til at oprette et **PushSubscription**. Det indeholder nøgler til kryptering, og frontenden sender dem til backenden, så serveren kan bruge det senere.

Når backenden skal sende en besked, bruger den abonnementet sammen med **VAPID**-nøglerne, som identificerer appens server. I mit projekt klarer pakken `web-push` afsendelsen. Push service finder frem til den rigtige browser og afleverer beskeden. Derefter vågner appens **Service Worker**, som håndterer `push`-eventet og viser en **Notification**. Hvis brugeren klikker på beskeden, sørger `notificationclick`-eventet for at åbne appen.

I denne demo gemmer backenden abonnementerne i et `Map` og sender testbeskeder til alle abonnementer, den har gemt. Den planlagte besked bruger serverens `setTimeout`.


## Lokal opsætning for at teste appen

For at prøve projektet skal Node.js og npm være installeret. Push kræver normalt HTTPS, men `localhost` virker som en sikker udviklingsadresse.

<blockquote>
   <i><b>Det er vigtigt at du har downloadet appen på din enhed!</b><br>
   Jeg prøvede at få det til at virke alt for længe, før det gik op for mig, at notificationen ikke dukkede op, fordi jeg ikke havde dowloadet appen...</i>
</blockquote><br>

### 1. Installer først dependencies i en terminal fra `push-pwa`:

```bash
npm install
```

### 2. Åben en ny terminal, og gør det samme for server mappen:

```bash
cd server
npm install
```

### 3. Fra `push-pwa/server` skal du generere et sæt VAPID-keys:

```bash
npx web-push generate-vapid-keys
```
*Du skal bruge VAPID-keys i de næste filer, så husk at kopiere dem.*

### 4. Opret derefter `server/.env`, og indsæt dine værdier:

```dotenv
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
VAPID_PUBLIC_KEY=<din-public-key>
VAPID_PRIVATE_KEY=<din-private-key>
VAPID_SUBJECT=mailto:din-email@example.com
```

### 5. Opret også `push-pwa/.env`:

```dotenv
VITE_API_URL=http://localhost:5000
VITE_VAPID_PUBLIC_KEY=<din-public-key>
```
Den private VAPID-nøgle skal blive på serveren; kun public key hører hjemme i frontendens `.env`. 

### 6. Start projektet!

1. Find den terminal du åbneder for `/push-pwa/server` directory, og kør følgende kode:

   ```bash
   node index.cjs
   ```

   Lad terminalen være åben, mens du bruger appen.

2. Gå ind i den anden terminal for `/push-pwa`, og start Vite:

   ```bash
   npm run dev
   ```

3. Åbn den localhost-adresse, Vite viser, typisk `http://localhost:5173`. Tryk på knappen `Enable Notifications`, og vælg **Tillad** i browserens dialogboks.


## Verifikation

Når appen har vist, at abonnementet er oprettet --*og du har downloadet appen til din enhed*--, kan du prøve at sende en testbesked. 

Prøv med det timede input feldt, eller kør følgende kommando i en tredje terminal:

```bash
curl.exe -X POST http://localhost:5000/api/test-notification -H "Content-Type: application/json" -d "{\"title\":\"Test\",\"body\":\"Web Push virker\",\"url\":\"/\"}"
```

## Refleksion

Næste gang jeg laver noget lignende, vil jeg nok bruge Næxt.js, eller et andet server-side framework.<br>
Og jeg ville nok ikke vælge at lave alt koden selv. Der er andre services som har gjort det på forhånd, og mange af dem har integreret funktioner som jeg ikke engang har rørt ved endnu.
