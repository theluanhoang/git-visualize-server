Environment variables

Copy the following into a `.env` file in `backend/`:

```
# Application
PORT=8000
GLOBAL_PREFIX=api
NODE_ENV=development

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
SWAGGER_TITLE=Visualized Git API
SWAGGER_DESCRIPTION=API documentation
SWAGGER_VERSION=1.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=postgres

# TypeORM
TYPEORM_LOGGING=false
TYPEORM_SYNCHRONIZE=false
```


