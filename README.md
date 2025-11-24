# Rematch Web Backend

This backend provides two API endpoints for the Rematch tournaments website:

- `/api/tournaments` – global list of tournaments
- `/api/likes` – per-user likes (by Discord user ID)

## Storage

Data is stored in Vercel KV:

- `tournaments` – array of tournaments
- `likes:<userId>` – array of liked tournament IDs

## Endpoints

### GET `/api/tournaments`
Returns list of tournaments.

### POST `/api/tournaments`
Body: full array of tournaments.

### GET `/api/likes?userId=<ID>`
Returns an array of liked tournament IDs for a specific user.

### POST `/api/likes`
Body:
```json
{
  "userId": "123456",
  "tournamentId": "abc",
  "liked": true
}
