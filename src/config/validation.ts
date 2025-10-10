import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8000),
  GLOBAL_PREFIX: Joi.string().default('api'),

  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  SWAGGER_PATH: Joi.string().default('docs'),
  SWAGGER_TITLE: Joi.string().default('Visualized Git API'),
  SWAGGER_DESCRIPTION: Joi.string().default('API documentation'),
  SWAGGER_VERSION: Joi.string().default('1.0'),

  DB_HOST: Joi.string().hostname().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),

  TYPEORM_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
  TYPEORM_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),
});


