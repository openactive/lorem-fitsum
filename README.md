# lorem-fitsum

Random activity generator

Env vars:

- `FEED_SESSIONSERIES_PAGE_SIZE` (OPTIONAL)
  Number of items in each page for the SessionSeries feed
  Defaults to `60`
- `FEED_SESSIONSERIES_TIMESTAMP_INVERVAL_MINUTES` (OPTIONAL)
  Number of minutes in between each generated item within a page for the SessionSeries feed. Must be a factor of 60
  e.g.
  - `10`: The 2nd item in each feed will start 10 minutes after the 1st. The 3rd will start 10 minutes after the 2nd. etc.
  Defaults to `5`
- `SCHEDULE_MAX_END_DAY_OFFSET` (OPTIONAL)
  Maximum number of days offset between an item's timestamp and the endDate of its schedule. The endDate will be random, but its maximum possible value will use this offset.
  Defaults to `28`
- `SCHEDULE_MIN_END_DAY_OFFSET` (OPTIONAL)
  Minimum number of days offset between an item's timestamp and the endDate of its schedule. The endDate will be random, but its minimum possible value will use this offset.
  Defaults to `14`
- `SCHEDULE_START_DAY_OFFSET` (OPTIONAL)
  Number of days offset between an item's timestamp and the startDate of its schedule. Should be negative!
  Defaults to `-7`
- `TIMESTAMP_START_DAY_OFFSET` (OPTIONAL)
  Number of days offset between now and the first `modified` timestamp in the feed. Should be negative (as `modified` timestamps must be in the past) e.g.
  - `-14`: The first item in each feed will start 14 days ago
  - `-7`: The first item in each feed will start 7 days ago
  Defaults to `-14`