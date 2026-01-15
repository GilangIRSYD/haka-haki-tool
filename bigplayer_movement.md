endpoint curl
curl --request GET \
  --url 'https://api-idx.gsphomelab.org/api/v1/big-players?date_start=2026-01-12&date_end=2026-01-14&crawl_type=ALL&page=1' \
  --header 'x-nonce: hKJLSHIUOHASD.1768496291088.qwe==='

parameters:
- crawl_type (opt):
  - ALL
  - PARTIAL (default)
- page(required if crawl_type == PARTIAL)
  - number(ex: 1)
  - notes: jika response `is_more:true` maka page+1 untuk mendapatkan next response
- date_start(required)
  - ex: 2026-01-12
- date_end (required)
  - ex: 2026-01-14

example response
`./mock/api-big-players.json`

notes:
- untuk periode <=5 hari, call api dengan ALL langsung tampilkan di tabel semua
- untuk periode >5 hari, call api dengan PARTIAL (page) dan ketika scroll tabel kebawah auto paginated (infinite scroll behaviour)