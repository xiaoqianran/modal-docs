# StdioBehavior

StdioBehavior defines how the standard input/output/error streams should behave.

```go
type StdioBehavior string
```

The possible values are:

* `Pipe` = `"pipe"` — Pipe allows the Sandbox to pipe the streams.
* `Ignore` = `"ignore"` — Ignore ignores the streams, meaning they will not be available.
