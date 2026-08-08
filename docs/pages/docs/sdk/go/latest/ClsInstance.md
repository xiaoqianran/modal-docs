# ClsInstance

ClsInstance represents an instantiated Modal class with bound parameters.
It provides access to the class methods with the bound parameters.

```go
type ClsInstance struct {
}
```

## Method

```go
Method(name string) (*Function, error)
```

Method returns the Function with the given name from a ClsInstance.
