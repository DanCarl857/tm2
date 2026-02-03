process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me';
process.env.SQLITE_PATH = process.env.SQLITE_PATH ?? ':memory:';
