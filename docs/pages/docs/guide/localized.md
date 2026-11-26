# Localized placement

<Callout variant="info">

`@modal.experimental.localized()` is an
[experimental decorator](/docs/guide/feature-maturity#experimental-sdk).

</Callout>

Modal runs containers globally across multiple different clouds. By default,
containers run anywhere capacity exists, but some applications have latency
requirements and need containers to run close to a specific geographic location.

Localized placement lets you specify where you would prefer your containers to
run. Modal will attempt to schedule your containers as close to that location as
possible, at an additional cost. If Modal places a container outside your preferred
area, the container is billed at a lower rate.

Placement uses the following distance categories, measured from your target
location to the datacenter running the container:

| Distance category | Distance from target | Approximate latency | Pricing multiplier |
| ----------------- | -------------------- | ------------------- | ------------------ |
| `short`           | <800 km           | <20 ms           | 1.8x               |
| `medium`          | <2,500 km         | <50 ms           | 1.5x               |
| `long`            | <6,400 km         | <100 ms          | 1.1x               |
| `none` (anywhere) | Any                  | N/A                 | 1x                 |

## Configuring localized placement

Add `@modal.experimental.localized()` below the Function or Server decorator:

```python notest
@app.function(gpu="H100")
@modal.experimental.localized(
    target_location="san-jose",
    preferred_distance="medium",
    max_distance="long",
)
```

The decorator accepts three optional parameters:

* `target_location`: the location you want containers to run near. When omitted,
  it uses the location of your routing region.
* `preferred_distance`: the maximum pricing multiplier. Defaults to
  min(`medium`, `max_distance`).
* `max_distance`: the furthest distance category in which containers may run.
  Defaults to `none`. Set this bound only if your application has strict latency
  requirements and cannot tolerate further placements; restricting placement can
  delay startups.

Modal will attempt to place containers within `preferred_distance` given
available capacity. Otherwise, containers will be placed at the closest available
locations within `max_distance`.

For applications whose requests are routed through Modal, omit `target_location`
to prefer containers near your [routing region](/docs/guide/region-selection#regional-routing):

```python notest
@app.server(routing_region="us-west")
@modal.experimental.localized(
    preferred_distance="medium",
    max_distance="long",
)
```

## Pricing

A multiplier on top of our [base usage pricing](https://modal.com/pricing) is applied
per container, based on its distance from the target location. If the container lands

* **Within `preferred_distance`**: the container is billed at that category's
  multiplier, even if it lands closer to the target.
* **Outside `preferred_distance`**: the container is billed at the lower
  multiplier for the distance category where it runs.

### Combining localized placement with region restrictions

For workloads with data residency requirements, you can combine localized
placement with a [broad region](/docs/guide/region-selection#container-region-options).
Combination with narrow regions is not supported.

Container placements satisfy both `max_distance` and the region restriction.
Each container is billed at the higher rate between its localized multiplier and the
[region multiplier](/docs/guide/region-selection#pricing).

## Location options

Supported options for `target_location` are `ashburn`, `chicago`, `columbus`, `dallas`,
`dublin`, `frankfurt`, `los-angeles`, `phoenix`, and `san-jose`.

More locations will be added over time. Let us know if you need a location which is not here!

## Limitations

Localized placement is not supported for Sandboxes, or for Functions or Servers with
the `modal.clustered` decorator.
