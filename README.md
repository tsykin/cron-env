# Bun HTTP Cron Scheduler

![MIT License](https://img.shields.io/github/license/tsykin/cron-env)
![Bun](https://img.shields.io/badge/bun-1.0+-brightgreen)
![Docker Ready](https://img.shields.io/badge/docker-ready-blue)

A simple utility that enables scheduling multiple HTTP requests (cron jobs) using environment variables, `node-cron` and Bun as a runtime.

## Use Cases

This utility is ideal for:

- Scheduling recurring tasks for projects without a need for VPS SSH access. Instead, you expose an API endpoint in your app.
- Centralizing cron job management, avoiding in-code implementations and/or writing same cron job implementation in multiple projects.
- Scheduling tasks on an internal network, without exposing endpoints publicly.

## Key Features

- 🌍 **Environment Variable Configuration:** Easily configure jobs using simple environment variables.
- 🔄 **HTTP Method Support:** Supports all common HTTP methods (GET, POST, PUT, DELETE, PATCH).
- 🔒 **Secure Job Configuration:** Secure jobs using URL parameters or request body.
- 🐳 **Docker-Ready:** Simple deployment with Docker.
- 🆓 **Open-Source:** Free to use under the MIT license.

## Getting Started

1. Clone this repository
2. Install dependencies: `bun install`
3. Create a `.env` file in the root directory and configure environment variables (see instructions below)
4. Start the scheduler: `bun run start`

## Deployment

You can easily self-host this scheduler or deploy it in seconds using my Railway template:

👉 [Deploy on Railway](https://railway.com/template/oIgT0x?referralCode=tsykin)

## Configuration

### Environment Variables

The following environment variables are supported:

| Variable        | Required | Description                                                                 | Example                                          |
| --------------- | -------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| TIMEZONE        | No       | IANA timezone name (defaults to UTC)                                        | `TIMEZONE="America/New_York"`                    |
| RUN_ON_START    | No       | Run jobs on startup (defaults to `false`)                                   | `RUN_ON_START="false"`                           |
| REQUEST_TIMEOUT | No       | Request timeout in milliseconds (default: 60000 = 1 minute, 0 = no timeout) | `REQUEST_TIMEOUT="30000"`                        |
| JOB{n}          | Yes      | Cron job configuration (see below)                                          | `JOB1="* * * * *::GET::https://api.example.com"` |

#### Important notes

**Environment Variable Formatting Rules.** Since some environment variables have to contain spaces or special characters, it's recommended to **use double quotes for all values.**

**Development configuration.** During development or testing you can set `RUN_ON_START="true"` to run jobs on every file change to see result of changes faster.

### Timezone

The scheduler supports all IANA timezone names. Examples:

- `TIMEZONE="UTC"` (default)
- `TIMEZONE="America/New_York"`
- `TIMEZONE="Europe/London"`
- `TIMEZONE="Asia/Tokyo"`

Note, that timezone is configured for all jobs.

[See list of available timezones here.](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Job Configuration

Jobs are configured using environment variables in the following format:

```
JOB{n}="schedule::method::url::prop1=value1::prop2=value2"
```

Where:

- `{n}`: Job number (1, 2, 3, etc.)
- `schedule`: Cron schedule expression
- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH)
- `url`: Target URL
- `prop{n}=value{n}`: Optional properties for request body

Fields are separated by `::` (double colon).

#### Property Value Types

Property values are automatically parsed into their appropriate data types:

- **Booleans**: Values `"true"` or `"false"` (case-insensitive) are converted to boolean types
- **Numbers**: Numeric strings are automatically converted to numbers (e.g., `"123"` → `123`, `"45.67"` → `45.67`)
- **Strings**: All other values remain as strings

Examples:
- `enabled=true` → `{ "enabled": true }` (boolean)
- `count=123` → `{ "count": 123 }` (number)
- `name=test` → `{ "name": "test" }` (string)

## Examples

### Basic Jobs

1. Simple GET request every minute:

```env
JOB1="* * * * *::GET::https://api.example.com/ping"
```

2. POST request every day at midnight:

```env
JOB2="0 0 * * *::POST::https://api.example.com/daily-task"
```

### Advanced Jobs

1. POST request with properties:

```env
JOB1="0 0 * * *::POST::https://api.example.com/task::userId=123::action=backup"
```

This will send a POST request with the body:

```json
{
  "userId": 123,
  "action": "backup"
}
```

2. POST request with typed properties (numbers and booleans):

```env
JOB1="0 0 * * *::POST::https://api.example.com/task::userId=123::enabled=true::priority=5"
```

This will send a POST request with the body:

```json
{
  "userId": 123,
  "enabled": true,
  "priority": 5
}
```

Note: `userId` and `priority` are parsed as numbers, while `enabled` is parsed as a boolean.

3. Multiple jobs with different schedules:

```env
JOB1="*/5 * * * *::GET::https://api.example.com/health"
JOB2="0 0 * * *::POST::https://api.example.com/daily::task=backup"
JOB3="0 */2 * * *::PUT::https://api.example.com/update::status=active"
```

## Validation

The scheduler includes comprehensive validation for all configuration:

- **Cron Schedule**: Validates correct cron expression format
- **HTTP Method**: Must be one of: GET, POST, PUT, DELETE, PATCH
- **URL**: Validates proper URL format
- **Timezone**: Validates against IANA timezone database
- **Properties**: Validates key-value pair format and automatically parses data types (string, number, boolean)

If validation fails, the scheduler will:

1. Log detailed error messages
2. Exit with a non-zero status code

## Testing

In order to test your configuration you can use these services that quickly mock API endpoints:

- [Mockbin.io](https://mockbin.io/)
- [Webhook.site](https://webhook.site/)

## Author

[Aliaksandr Tsykin](https://github.com/tsykin)

## License

Licensed under the [MIT license](https://github.com/tsykin/cron-env/blob/main/LICENSE).

## Contribution

All PRs are welcome :)
