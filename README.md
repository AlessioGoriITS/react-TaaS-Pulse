# TaaS Pulse

TaaS Pulse è una piattaforma full-stack per monitorare lo stato di salute dei
progetti gestiti con un modello **Team as a Service**. Aiuta responsabili di
delivery e membri del team a controllare scadenze, budget in ore, capacità,
sprint, attività e rischi da un unico workspace.

Il repository contiene:

- un backend REST in Python, Django e Django REST Framework;
- un frontend React/TypeScript;
- autenticazione token-based con cookie HttpOnly e supporto all'header
  `Authorization`;
- ruoli amministratore/utente e visibilità limitata ai progetti assegnati;
- CRUD, filtri, ricerca e ordinamento;
- dati demo, test automatici, pannello admin e documentazione OpenAPI.

## Requisiti

- Python 3.12 o successivo (3.12/3.13 consigliato);
- Node.js 20 o successivo;
- npm 10 o successivo.

SQLite è incluso in Python: non serve installare un database separato.

## Installazione da zero

Clonare il repository e aprirlo:

```bash
git clone https://github.com/AlessioGoriITS/react-TaaS-Pulse.git
cd react-TaaS-Pulse
```

### Setup automatico su Windows

Con Python e Node.js già installati, eseguire `setup.exe` dalla cartella
principale del repository. Il programma:

1. verifica la disponibilità di Python e npm;
2. crea o riutilizza `.venv`;
3. installa le dipendenze Python e JavaScript;
4. crea `.env` da `.env.example` senza sovrascrivere configurazioni esistenti;
5. applica le migrazioni;
6. genera i dati demo;
7. esegue il controllo di configurazione Django.

Il setup può essere rilanciato in sicurezza. Per verificare soltanto i
prerequisiti senza installare o modificare nulla:

```powershell
.\setup.exe --check-only --no-pause
```

La procedura manuale seguente rimane disponibile su tutti i sistemi operativi.

Creare l'ambiente Python:

```bash
python -m venv .venv
```

Attivarlo su PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

oppure su macOS/Linux:

```bash
source .venv/bin/activate
```

Installare backend e frontend:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
npm install
```

Creare la configurazione locale:

```powershell
Copy-Item .env.example .env
```

Su macOS/Linux usare `cp .env.example .env`. Il valore di esempio è adatto
solo allo sviluppo. In produzione impostare una chiave casuale, disabilitare
`DJANGO_DEBUG` e configurare host, CORS e HTTPS.

`VITE_API_BASE_URL` indica al frontend l'indirizzo del backend;
`DJANGO_TOKEN_MAX_AGE_SECONDS` controlla la durata massima del token sia nel
cookie sia lato server (8 ore nell'esempio).

Creare database, tabelle e dati demo:

```bash
python server/manage.py migrate
python server/manage.py seed_demo
```

Il comando `seed_demo` è idempotente e può essere rieseguito. Per azzerare
completamente i dati locali:

```bash
npm run db:reset
```

## Avvio

In un terminale:

```bash
npm run server:dev
```

In un secondo terminale:

```bash
npm run dev
```

Indirizzi:

- frontend: <http://127.0.0.1:5173>;
- API: <http://127.0.0.1:3000/api/>;
- stato servizio: <http://127.0.0.1:3000/api/health/>;
- Swagger UI: <http://127.0.0.1:3000/api/docs/>;
- schema OpenAPI: <http://127.0.0.1:3000/api/schema/>;
- amministrazione Django: <http://127.0.0.1:3000/admin/>.

## Account demo

| Ruolo | Email | Password | Accesso |
|---|---|---|---|
| Admin | `admin@taaspulse.local` | `AdminPass!2026` | Tutti i dati e CRUD |
| Utente | `ari.chen@example.com` | `EmployeePass!2026` | Progetti e team assegnati, sola lettura |

Sono credenziali fittizie e non sensibili, create soltanto dal seed locale.

## Autenticazione token-based

Il login accetta email e password e restituisce un token DRF. Lo stesso token
viene inserito in un cookie HttpOnly per il frontend. Client API e strumenti
come `curl` possono invece usare l'header `Authorization: Token ...`.

Ottenere il token:

```bash
curl -X POST http://127.0.0.1:3000/api/token/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@taaspulse.local\",\"password\":\"AdminPass!2026\"}"
```

Usarlo su una rotta protetta:

```bash
curl http://127.0.0.1:3000/api/projects \
  -H "Authorization: Token TOKEN_RICEVUTO"
```

Logout e revoca:

```bash
curl -X POST http://127.0.0.1:3000/api/auth/logout \
  -H "Authorization: Token TOKEN_RICEVUTO"
```

Ogni nuovo login revoca il token precedente dell'utente.
I token scadono anche lato server: una richiesta con un token oltre la durata
configurata riceve `401`, il token viene revocato e il frontend richiede un
nuovo login. Un utente autenticato ma privo dei permessi necessari riceve
invece `403`.

## Endpoint principali

I router DRF espongono operazioni list, detail, create, update, partial update
e delete per:

- `/api/projects`;
- `/api/employees`;
- `/api/teams`;
- `/api/sprints`;
- `/api/tasks`.

`/api/workspace` restituisce lo snapshot aggregato usato dal frontend.

Le collezioni supportano `search`, `ordering` e filtri specifici. Esempio:

```bash
curl "http://127.0.0.1:3000/api/tasks?project=1&status=in_progress&search=invoice&ordering=-spent_hours" \
  -H "Authorization: Token TOKEN_RICEVUTO"
```

La documentazione Swagger elenca parametri, payload e risposte aggiornati.
Le liste sono paginate (20 elementi per impostazione predefinita) e accettano
`page` e `page_size`, fino a 100 elementi. Il payload usa la forma DRF
`count`, `next`, `previous`, `results`. Lo snapshot `/api/workspace` non è
paginato perché serve ad aggiornare in modo atomico la dashboard.

I dettagli principali hanno URL apribili direttamente:

- `/projects/<id>`;
- `/sprints/<id>`;
- `/people/<id>`.

Il ritorno alla lista conserva ricerca e filtri nella query string; il tasto
Indietro del browser ripristina inoltre la schermata precedente. Un ID
inesistente o non autorizzato torna alla lista di riferimento con un messaggio
controllato.

## Permessi e sicurezza

- `/api/health/` è pubblico;
- login e ottenimento token sono pubblici;
- workspace e CRUD richiedono autenticazione;
- gli utenti normali vedono soltanto progetti assegnati, il proprio team e
  task propri/non assegnati;
- solo lo staff può modificare dati;
- le password usano gli hasher Django e non sono mai serializzate;
- il token è memorizzato lato browser in un cookie HttpOnly;
- segreti reali, database e file `.env` sono esclusi da Git;
- in produzione il progetto rifiuta la chiave di sviluppo predefinita.

## Test e controlli prima della consegna

```bash
python server/manage.py check
python server/manage.py makemigrations --check --dry-run
python server/manage.py migrate
python server/manage.py test
npm run build
```

I test coprono autenticazione, revoca token, permessi, scope dei dati,
scadenza token, paginazione, validazioni, errori JSON, filtri, persistenza dei
campi di pianificazione sprint e CRUD principali.

## Modello dati

Il diagramma aggiornato è in [docs/database-design.md](docs/database-design.md).
Le relazioni principali includono:

- `User` — `UserProfile` — `Employee` (One-to-One);
- `Employee` — `Job` (ForeignKey);
- `Employee` — `Project` tramite `ProjectMembership` (Many-to-Many);
- `Employee` — `Team` tramite `TeamMembership` (Many-to-Many);
- `Team` — `Project` (Many-to-Many);
- `Project` — `Sprint` — `Task` (ForeignKey).

Le cancellazioni usano `CASCADE`, `SET_NULL` o `PROTECT` in base al significato
del dato: per esempio eliminare un progetto elimina sprint e task, mentre
eliminare un dipendente mantiene i task rendendo nullo l'assegnatario.

## Struttura

```text
client/                 React e TypeScript
server/config/          impostazioni e URL Django
server/pulse/           modelli, API, permessi, admin e seed
server/pulse/tests/     test automatici
server/pulse/migrations migrazioni versionate
docs/                   documentazione del dominio e diagramma ER
```

## Sviluppi futuri

- refresh token con durata configurabile e audit degli accessi;
- notifiche su scadenze e superamento del budget;
- report CSV/PDF e cronologia delle modifiche;
- PostgreSQL e container per un deployment multiutente.

## Riferimenti

- [Django](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-filter](https://django-filter.readthedocs.io/)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/)
