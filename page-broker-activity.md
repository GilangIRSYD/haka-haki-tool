Layout requirements:
- Desktop-first layout
- Top sticky filter bar
- Two-column main content

Top Filter Bar:
- Searchable dropdown to select a stock broker
- Date range picker (start date – end date)
- preset date range (Today, 3D, 1W, 1M, 3M, 1Y)
- Filters auto-apply on change
- Default value is last analyze broker(localstorage) with date range is today, or broker is SS with TODAY date range
- Clean, minimal, financial dashboard style

Left Panel (40% width):
- Vertical list of stock cards (emiten list)
- Each card shows:
  - Stock symbol (bold)
  - Buy or Sell indicator (green for BUY, red for SELL)
  - Total transaction value
  - Average price and volume (secondary text)
- Cards sorted by absolute transaction value (largest first)
- Clicking a stock card selects it and highlights the card
- Only one stock can be selected at a time

Right Panel (60% width):
- Contextual calendar view that updates based on the selected stock
- Monthly calendar grid layout
- Initially shows an empty state message: "Select a stock to view daily activity"
- calendar UI please check at `./app/broker-calendar/client-page.tsx` with tooltip

Calendar Header:
- Displays selected stock symbol and broker name
- Shows total value and total volume for the selected stock

Design style:
- Clean, modern financial dashboard
- check existing color

data source endpoint:
- for broker activity
```bash
curl --request GET \
  --url 'https://api-idx.gsphomelab.org/api/v1/broker-activity?broker=HP&from=2026-01-09&to=2026-01-09' \
  --header 'x-nonce: hKJLSHIUOHASD.1768070258468.qwe==='
```
example response at `./broker-activity.json`


- for emiten calendar
- ```bash
curl --request GET \
  --url 'https://api-idx.gsphomelab.org/api/v1/broker-action-calendar?symbol=PTRO&broker_code=HP&from=2026-01-09&to=2026-01-09' \
  --header 'x-nonce: hKJLSHIUOHASD.1768070258468.qwe==='
```

example response at `./emitten-calendar.json`

note:
for x-nonce u can check existing implementation