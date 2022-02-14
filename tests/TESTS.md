## Test Cases

## Installation Created

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: installation" \
  -d @tests/installation-created.json \
  http://localhost:8000/webhook
```

## Installation Deleted

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: installation" \
  -d @tests/installation-deleted.json \
  http://localhost:8000/webhook
```

## Installation Repositories Added

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: installation_repositories" \
  -d @tests/installation-repositories-added.json \
  http://localhost:8000/webhook
```

## Installation Repositories Removed

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: installation_repositories" \
  -d @tests/installation-repositories-removed.json \
  http://localhost:8000/webhook
```

## Check Suite Requested

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: check_suite" \
  -d @tests/check-suite-requested.json \
  http://localhost:8000/webhook
```
