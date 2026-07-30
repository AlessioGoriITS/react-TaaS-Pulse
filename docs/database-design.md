# TaaS Pulse — modello dati

Il database rappresenta persone, ruoli, squadre e lavoro di delivery. Le
tabelle intermedie non sono duplicazioni: memorizzano relazioni molti-a-molti
e, nel caso delle assegnazioni progetto, ruolo e capacità settimanale.

```mermaid
erDiagram
    AUTH_USER ||--o| USER_PROFILE : has
    EMPLOYEE ||--o| USER_PROFILE : represents
    JOB ||--o{ EMPLOYEE : employs
    EMPLOYEE ||--o{ PROJECT_MEMBERSHIP : receives
    PROJECT ||--o{ PROJECT_MEMBERSHIP : contains
    EMPLOYEE ||--o{ TEAM_MEMBERSHIP : joins
    TEAM ||--o{ TEAM_MEMBERSHIP : contains
    EMPLOYEE o|--o{ TEAM : leads
    TEAM }o--o{ PROJECT : delivers
    PROJECT ||--o{ SPRINT : plans
    PROJECT ||--o{ TASK : owns
    SPRINT o|--o{ TASK : groups
    EMPLOYEE o|--o{ TASK : performs

    JOB {
        bigint id PK
        string title UK
        decimal hourly_wage
        int weekly_hours
        string department
    }
    EMPLOYEE {
        bigint id PK
        string email UK
        string first_name
        string last_name
        bigint job_id FK
        boolean is_active
    }
    PROJECT {
        bigint id PK
        string name
        string client_name
        string status
        int budget_hours
        int used_hours
        date deadline
        string risk_level
    }
    PROJECT_MEMBERSHIP {
        bigint id PK
        bigint project_id FK
        bigint employee_id FK
        string assigned_role
        int weekly_allocated_hours
    }
    TEAM {
        bigint id PK
        string name UK
        string focus_area
        bigint lead_id FK
    }
    TEAM_MEMBERSHIP {
        bigint id PK
        bigint team_id FK
        bigint employee_id FK
        string team_role
    }
    SPRINT {
        bigint id PK
        bigint project_id FK
        string name
        date start_date
        date end_date
        string status
        string importance
        int capacity_hours
        string focus_area
        text definition_of_done
        text risk_notes
        text backlog_notes
    }
    TASK {
        bigint id PK
        bigint project_id FK
        bigint sprint_id FK
        bigint assignee_id FK
        string title
        string status
        string priority
    }
    USER_PROFILE {
        bigint id PK
        bigint user_id FK
        bigint employee_id FK
    }
```

## Vincoli e cancellazioni

- email dipendente, titolo del job e nome del team sono univoci;
- una persona può comparire una sola volta nello stesso progetto o team;
- un nome sprint è unico all'interno del progetto;
- fine sprint non può precedere l'inizio;
- la capacità pianificata dello sprint deve essere positiva;
- ore e compensi non possono essere negativi;
- `Project` elimina in cascata sprint, task e membership;
- `Employee` è protetto finché il suo `Job` esiste, mentre la cancellazione
  dell'employee lascia nullo l'assegnatario dei task;
- la validazione API impedisce di assegnare task a sprint di un altro progetto
  o persone non appartenenti al progetto.
