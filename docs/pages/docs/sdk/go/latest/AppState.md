# AppState

AppState is the lifecycle state of a Modal App.

```go
type AppState string
```

The possible values are:

* `AppStateEphemeral` = `"ephemeral"`
* `AppStateDetached` = `"detached"`
* `AppStateDeployed` = `"deployed"`
* `AppStateStopping` = `"stopping"`
* `AppStateStopped` = `"stopped"`
* `AppStateInitializing` = `"initializing"`
* `AppStateDisabled` = `"disabled"`
* `AppStateUnknown` = `"unknown"`
