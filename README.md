# Lead Management Frontend

## Run

```bash
npm install
npm run dev
```

## Env

Create `.env`:

```env
VITE_API_BASE_URL=https://lead-backend-5w9l.onrender.com
```

## Backend APIs used

- `POST /user/login?email=&password=`
- `POST /user/sign-up?email=&password=`
- `GET /lead/get`
- `POST /lead/upload-csv` with multipart `file` and repeated `columns`

CSV column mapping order sent to backend:

1. firstName
2. lastName
3. email
4. country
5. industry
6. phone
7. companyName
8. verifiedStatus
9. verifiedOn
10. campaignId
11. campaignOfInstantly
12. title
13. website
14. leadstatus
