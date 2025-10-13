export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '8000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  swagger: {
    enabled: (process.env.SWAGGER_ENABLED ?? 'true') === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
    title: process.env.SWAGGER_TITLE ?? 'Visualized Git API',
    description: process.env.SWAGGER_DESCRIPTION ?? 'API documentation',
    version: process.env.SWAGGER_VERSION ?? '1.0',
  },
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin',
    database: process.env.DB_NAME ?? 'postgres',
    logging: (process.env.TYPEORM_LOGGING ?? 'false') === 'true',
    synchronize: (process.env.TYPEORM_SYNCHRONIZE ?? 'false') === 'true',
    migrationsRun: (process.env.TYPEORM_MIGRATIONS_RUN ?? 'false') === 'true',
  },
  auth: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '14d',
  },
});


